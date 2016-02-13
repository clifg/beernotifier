var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    email: { type: String, lowercase: true, unique: true, trim: true, required: true },
    password: { type: String },

    facebookId: String,
    tokens: Array,

    profile: {
        firstName: { type: String, trim: true, default: '' },
        lastName: { type: String, trim: true, default: '' },
        zipCode: { type: String, trim: true, default: '' },
        gender: { type: String, trim: true, default: '' },
        picture: { type: String, default: '' }
    },
    
    isAdmin: { type: Boolean, default: false },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync());
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

var User = mongoose.model('User', userSchema);

module.exports = User;