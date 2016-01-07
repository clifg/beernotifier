var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dataSourceSchema = new Schema({
    name: { type: String, trim: true, required: true },
    url: { type: String, trim: true, required: true }
});

var User = mongoose.model('DataSource', userSchema);

module.exports = DataSource;