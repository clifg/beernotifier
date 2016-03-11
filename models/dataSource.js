var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSourceSchema = new Schema({
    scraper: { type: String, required: true },
    scraperStatus: { type: String, trim: true, default: 'ok' },
    consecutiveFailures: { type: Number, default: 0 },
    isDisabled: { type: Boolean, default: false },
    name: { type: String, trim: true, required: true },
    homeUrl: { type: String, trim: true, required: true},
    updates: [Date]
});

var DataSource = mongoose.model('DataSource', dataSourceSchema);

module.exports = DataSource;