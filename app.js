var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var activator = require('activator');
var nodemailer = require('nodemailer');

var User = require('./models/user');

var secrets = require('./config/secrets');

var routes = require('./routes/index');
var users = require('./routes/users');
var tapListings = require('./routes/tapListings');
var dataSources = require('./routes/dataSources');

var app = express();

mongoose.connect(secrets.db);

// TODO: Use proper account for sending activation emails!
var transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.DAILYFANTASY_EMAIL_USERNAME,
      pass: process.env.DAILYFANTASY_EMAIL_PASSWORD
  }
});

activator.init({
  user: {
    find: function(login, callback) {
      User.findById(login, callback);
    },
    save: function(id, data, callback) {
      User.findByIdAndUpdate(id, { $set: data }, callback);
    }
  },
  emailProperty: 'local.email',
  transport: transport,
  templates: __dirname + '/mailTemplates',
  from: 'do_not_reply' + process.env.DAILYFANTASY_EMAIL_USERNAME
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'seahawkmarinersounder',
  cookie: { maxAge: 60000, expires: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000) },
  store: new MongoStore({ mongooseConnection: mongoose.connection, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure every page has access to the current user
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

app.post('/signup', passport.authenticate('local-signup', { session: false }), activator.createActivate);
app.get('/activate', activator.completeActivate);

app.post('/login', function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.status(401).send(info.message); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/');
    });
  })(req, res, next);
});

app.get('/logout', function(req, res) {
  req.logout();
  res.sendStatus(200);
});

app.use('/', routes);
app.use('/api/v1/users', users);
app.get('/api/v1/login', function(req, res) {
  if (req.user) {
    return res.json(req.user);
  }

  return res.sendStatus(401);
});
app.use('/api/v1/taplistings', tapListings);
app.use('/api/v1/datasources', dataSources);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
