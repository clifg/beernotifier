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

router.get('/:id', function(req, res) {
    Subscription.findById(req.params.id)
        .exec(function(err, subscription) {
        if (err) {
            return res.sendStatus(500);
        }

        if (!subscription) {
            return res.sendStatus(404);
        }

        if (!req.user || (!req.user.isAdmin && (req.user._id != subscription.user))) {
            return res.sendStatus(401);
        }

        res.json(subscription);
    });
});

module.exports = router;