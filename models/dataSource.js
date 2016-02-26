var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSourceSchema = new Schema({
    scraper: { type: String, required: true },
    scraperStatus: { type: String, trim: true, default: 'ok' },
    name: { type: String, trim: true, required: true },
    homeUrl: { type: String, trim: true, required: true},
    updates: [Date]
});

var DataSource = mongoose.model('DataSource', dataSourceSchema);

module.exports = DataSource;