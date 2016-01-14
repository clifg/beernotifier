var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    local: {
        email: { type: String, lowercase: true, unique: true, trim: true, required: true },
        password: { type: String, required: true }
    },

    isAdmin: { type: Boolean, default: false },
    activation_code: String,
    password_reset_code: String,
    password_reset_time: Date
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync());
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
}

var User = mongoose.model('User', userSchema);

module.exports = User;