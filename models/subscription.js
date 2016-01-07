var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscriptionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    match: { type: String, lowercase: true, trim: true, required: true }
});

var User = mongoose.model('Subscription', userSchema);

module.exports = Subscription;