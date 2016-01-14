var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tapListingSchema = new Schema({
    rawListing: { type: String, trim: true, required: true },
    price: Number,
    dataSource: { type: Schema.Types.ObjectId, ref: 'DataSource', required: true },
    createdDate: { type: Date, required: true },
    removedDate: { type: Date },
    isActive: { type: Boolean, required: true }
});

var TapListing = mongoose.model('TapListing', tapListingSchema);

module.exports = TapListing;