var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' }
});

var User = mongoose.model('Notification', userSchema);

module.exports = Notification;