var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var owasp = require('owasp-password-strength-test');

var secrets = require('./secrets');
var User = require('../models/user');

passport.serializeUser(function(user, done) {
    console.log('serializing user: ' + user.id);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id)
        .exec(function(err, user) {
        console.log('deserializing user: ' + id);
        done(err, user);
  });
});

passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {
    User.findOne({ 'local.email': email })
        .exec(function(err, user) {
        if (err) {
            console.log(' ! Database error finding user for email ' + email);
            return done(err);
        }

        if (user) {
            return done(null, false, { message: 'That email is already taken.'});
        } else {
            var passwordResult = owasp.test(password);
            if (!passwordResult.strong) {
                console.log(' ! Rejecting weak password');
                console.dir(passwordResult);
                return done(null, false, { message: passwordResult.errors[0] });
            }
            
            var newUser = new User();

            newUser.local.email = email;
            newUser.local.password = newUser.generateHash(password);

            newUser.save(function(err) {
                if (err) {
                    console.dir(err);
                    throw err;
                }

                newUser.local.password = undefined;

                return done(null, newUser);
            });
        }
    });
}));

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done) {
    User.findOne({ 'local.email': email.toLowerCase().trim() })
        .exec(function(err, user) {
        if (err) {
            return done(err);
        }

        if (!user) {
            console.log('AUTH: Invalid user');
            return done(null, false, { message: 'User not found.'});
        }

        if (!user.validPassword(password)) {
            console.log('AUTH: Invalid password');
            return done(null, false, { message: 'Invalid password.'});
        }

        if (!user.activation_code || (user.activation_code !== 'X')) {
            console.log('AUTH: User not yet activated');
            return done(null, false, { message: 'Email address not yet confirmed. Please check your email and click the link.'});
        }

        return done(null, user);
    });
}));