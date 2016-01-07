var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var beerSchema = new Schema({
    brewery: String,
    name: { type: String, required: true },
    price: Number
});

var User = mongoose.model('Beer', userSchema);

module.exports = Beer;