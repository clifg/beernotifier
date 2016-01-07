var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    facebook: {
        id: { type: String, trim: true },
        token: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true, required: true },
    },
    google: {
        id: { type: String, trim: true }
    },
    name: { type: String, trim: true },
    picture: { type: String, trim: true },

    isAdmin: { type: Boolean, default: false }
});

var User = mongoose.model('User', userSchema);

module.exports = User;