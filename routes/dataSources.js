var express = require('express');
var router = express.Router();

var secrets = require('../config/secrets');
var passportConf = require('../config/passport');

var DataSource = require('../models/dataSource.js');

// TODO: Secure these APIs

router.get('/', function(req, res) {
    DataSource.find({})
        .select(!req.query.updates || req.query.updates !== 'true' ?
            '-updates' :
            '')
        .exec(function(err, dataSources) {
        if (err) {
            console.dir(err);
            throw err;
        }
        res.json(dataSources);
    });
});

module.exports = router;