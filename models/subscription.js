var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subscriptionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['keyword'], trim: true, required: true, default: 'keyword' },
    createdDate: { type: Date, required: true },

    keywordConfig: {
        keyword: { type: String, trim: true, default: '' }
    },

    dataSourceMatches: { type: String, enum: ['any', 'list'], trim: true, required: true, default: 'any' },

    dataSourceList: [{ type: Schema.Types.ObjectId, ref: 'DataSource' }]
});

var Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;