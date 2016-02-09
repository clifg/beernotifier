var express = require('express');
var router = express.Router();

var TapListing = require('../models/tapListing.js');

router.get('/', function(req, res) {
    var queryFilter = {};

    if (req.query.active && (req.query.active === 'true')) {
        queryFilter = { isActive: true };
    }

    TapListing.find(queryFilter, null, {sort: {createdDate: -1}})
        .populate('dataSource', 'name')
        .exec(function(err, tapListings) {
        if (err) {
            return res.sendStatus(500);
        }
        res.json(tapListings);
    });
});

module.exports = router;