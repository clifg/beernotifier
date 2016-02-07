module.exports = {
    db: {
        production: process.env.MONGOLAB_URI || 'mongodb://localhost:27017/beernotifier',
        test: 'mongodb://localhost:27017/beernotifier_test'
    },

    facebook: {
        // Used by passport
        clientID: process.env.BEERNOTIFIER_FACEBOOK_ID,
        clientSecret: process.env.BEERNOTIFIER_FACEBOOK_SECRET,
        callbackURL: '/auth/facebook/callback',
        passReqToCallback: true,
        profileFields: ['id', 'email', 'name', 'displayName'],

        // Used by our code
        adminFacebookId: process.env.BEERNOTIFIER_ADMIN_FACEBOOK_ID
    }
}