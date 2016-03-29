if (process.env.NEW_RELIC_LICENSE_KEY) {
    require('newrelic');
}

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var nodemailer = require('nodemailer');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var owasp = require('owasp-password-strength-test');

var User = require('./models/user');

var secrets = require('./config/secrets');

var users = require('./routes/users');
var tapListings = require('./routes/tapListings');
var dataSources = require('./routes/dataSources');
var subscriptions = require('./routes/subscriptions');

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

// Handle static files first
app.use(express.static(path.join(__dirname, 'public')));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var jwtSign = function(x) {
    // TODO: Rather than using tokens that never expire, refresh tokens on successful
    // API queries and generate refresh tokens for use in mobile apps.
    return jwt.sign(x, secrets.jwtSecret);
};

app.post('/signup', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
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

            newUser.save(function(err) {
                if (err) {
                    console.dir(err);
                    throw err;
                }

                var jsonUser = newUser.toObject();
                newUser.password = undefined;

                return res.json({ token: jwtSign(jsonUser) });
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

        return res.json({ token: jwtSign(jsonUser) });
    });
});

// REST APIs are protected by JWT
app.use('/api', expressJwt({ secret: secrets.jwtSecret }));

app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('Invalid token');
    }
});

app.use('/api/v1/users', users);
app.get('/api/v1/login', function(req, res) {
  if (req.user) {
    // There's a lot of other crap in the user model that we don't want to pass back, so
    // we'll just select what we want in, rather than trying to hide what we don't.
    var parsedUser = {};
    parsedUser.id = req.user._id;
    parsedUser.email = req.user.email;
    parsedUser.isAdmin = req.user.isAdmin;
    parsedUser.profile = req.user.profile;
    console.log(req.user);
    console.log(parsedUser);
    return res.json(parsedUser);
  }

  return res.sendStatus(401);
});
app.use('/api/v1/taplistings', tapListings);
app.use('/api/v1/datasources', dataSources);
app.use('/api/v1/subscriptions', subscriptions);

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
