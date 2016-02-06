if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
}

var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var passport = require('passport');
var activator = require('activator');
var nodemailer = require('nodemailer');

var User = require('./models/user');

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var users = require('./routes/users');
var tapListings = require('./routes/tapListings');
var dataSources = require('./routes/dataSources');

var app = express();

mongoose.connect(secrets.db);

// TODO: Use proper account for sending activation emails!
var transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.BEERNOTIFIER_EMAIL_USERNAME,
      pass: process.env.BEERNOTIFIER_EMAIL_PASSWORD
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
  from: 'do_not_reply' + process.env.BEERNOTIFIER_EMAIL_USERNAME
});

// Handle static files first, so we don't incur the session/user lookup overhead as many times.
// Since we're currently a single-page app, we have like 8 requests just to load the homepage. :(
app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'seahawkmarinersounder',
  cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 },
  store: new MongoStore({ mongooseConnection: mongoose.connection, autoReconnect: true, touchAfter: 24 * 3600 })
}));
app.use(passport.initialize());
app.use(passport.session());

// Ensure every page has access to the current user
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

app.post('/signup', function(req, res, next) {
  passport.authenticate('local-signup', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { console.dir(info); return res.status(401).send(info.message); }
    if (!req.activator) { req.activator = {}; }
    req.activator.id = user.id;
    next();
  })(req,res,next);
}, activator.createActivate);
app.get('/activate', activator.completeActivate);

app.post('/login', function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { console.dir(info); return res.status(401).send(info.message); }
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
    console.dir(err);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.sendStatus(err.status || 500);
});


module.exports = app;
