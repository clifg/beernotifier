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
var nodemailer = require('nodemailer');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var owasp = require('owasp-password-strength-test');

var User = require('./models/user');

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

var users = require('./routes/users');
var tapListings = require('./routes/tapListings');
var dataSources = require('./routes/dataSources');

var app = express();

mongoose.connect((process.env.NODE_ENV && process.env.NODE_ENV === 'test') ?
    secrets.db.test :
    secrets.db.production);

// TODO: Use proper account for sending activation emails!
var transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.BEERNOTIFIER_EMAIL_USERNAME,
      pass: process.env.BEERNOTIFIER_EMAIL_PASSWORD
  }
});

// Handle static files first, so we don't incur the session/user lookup overhead as many times.
// Since we're currently a single-page app, we have like 8 requests just to load the homepage. :(
app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
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

var jwtSign = function(x) {
    return jwt.sign(x, secrets.jwtSecret, { expiresIn: 60 });
};

app.post('/signup', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    console.log(req.body.email);
    console.log(req.body.password);
    if (!email || !password) {
      return res.status(401).send('Must supply username and password');
    }

    User.findOne({ 'email': email })
        .exec(function(err, user) {
        if (err) {
            console.log(' ! Database error finding user for email ' + email);
            return res.status(401).send(err);
        }

        if (user) {
            return res.status(401).send('That email is already taken.');
        } else {
            var passwordResult = owasp.test(password);
            if (!passwordResult.strong) {
                console.log(' ! Rejecting weak password');
                console.dir(passwordResult);
                return res.status(401).send(passwordResult.errors.join('\n'));
            }
            
            var newUser = new User();

            newUser.email = email;
            newUser.password = newUser.generateHash(password);
            newUser.profile.firstName = req.body.firstName;
            newUser.profile.lastName = req.body.lastName;
            newUser.profile.zipCode = req.body.zipCode;
            newUser.profile.gender = req.body.gender;

            newUser.save(function(err) {
                if (err) {
                    console.dir(err);
                    throw err;
                }

                newUser.password = undefined;

                var token = jwtSign(newUser);
                return res.json({ token: token });
            });
        }
    });
});

app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    if (!email || !password) {
        res.status(401).send('Must supply username and password');
    }
    User.findOne({ 'email': email.toLowerCase().trim() })
        .exec(function(err, user) {
        if (err) {
            return res.status(401).send(err);
        }

        if (!user) {
            console.log('AUTH: Invalid user');
            return res.status(401).send('User not found.');
        }

        if (!user.validPassword(password)) {
            console.log('AUTH: Invalid password');
            return res.status(401).send('Invalid password.');
        }

        var jsonUser = user.toObject();
        jsonUser.password = undefined;

        var token = jwtSign(jsonUser);
        return res.json({ token: token });
    });
});

app.get('/logout', function(req, res) {
  req.logout();
  res.sendStatus(200);
});

app.use('/api/v1/users', users);
app.get('/api/v1/login', function(req, res) {
  if (req.user) {
    var myUser = JSON.parse(JSON.stringify(req.user));
    delete myUser.password;
    return res.json(myUser);
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
