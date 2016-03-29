var express = require('express');
var router = express.Router();

var Subscription = require('../models/subscription');

router.get('/', function(req, res) {
    if (!req.user || !req.user.isAdmin) {
        return res.sendStatus(401);
    }
    Subscription.find({})
        .exec(function(err, subscriptions) {
        if (err) {
            return res.sendStatus(500);
        }
        res.json(subscriptions);
    });
});

module.exports = router;