var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSourceSchema = new Schema({
    scraper: { type: String, required: true },
    name: { type: String, trim: true, required: true },
    homeUrl: { type: String, trim: true, required: true},
    updateFrequency: Number, // Minutes between updates -- 0 to update every time the script runs
    updates: [Date]
});

var DataSource = mongoose.model('DataSource', dataSourceSchema);

module.exports = DataSource;