var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

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

passport.use(new FacebookStrategy(secrets.facebook, function(req, accessToken, refreshToken, profile, done) {
    User.findOne({ 'facebook.id': profile.id }, function(err, existingUser) {
        if (err) { return done(err); }

        if (existingUser) {
            return done(null, existingUser);
        } else {
            // New user! Create an account in our database
            console.log('New user!');
            console.dir(profile);
            
            var user = new User();

            user.facebook.id = profile.id;
            user.facebook.token = accessToken;
            user.facebook.email = profile._json.email;
            user.name = profile.displayName;
            user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';

            user.isAdmin = (profile.id == secrets.facebook.adminFacebookId);

            user.save(function(err) {
                if (err) { throw err; }

                return done(null, user);
            });
        }
    });
}));