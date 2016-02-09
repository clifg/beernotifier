var express = require('express');
var router = express.Router();

var DataSource = require('../models/dataSource.js');

router.get('/', function(req, res) {
    DataSource.find({}, null, {sort: {name: 1}})
        .select(!req.query.updates || req.query.updates !== 'true' ?
            '-updates' :
            '')
        .exec(function(err, dataSources) {
        if (err) {
            return res.sendStatus(500);
        }
        res.json(dataSources);
    });
});

router.get('/:id', function(req, res) {
    DataSource.findById(req.params.id)
        .exec(function(err, dataSource) {
        if (err) {
            return res.sendStatus(500);
        }

        if (!dataSource) {
            return res.sendStatus(404);
        }

        res.json(dataSource);
    });
});

module.exports = router;