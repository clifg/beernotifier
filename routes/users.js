var express = require('express');
var router = express.Router();

var User = require('../models/user.js');

router.get('/', function(req, res) {
    if (!req.user || !req.user.isAdmin) {
        return res.sendStatus(401);
    }
    User.find({})
        .select('-local.password')
        .exec(function(err, users) {
        if (err) throw err;
        res.json(users);
    });
});

router.get('/:id', function(req, res) {
    if (!req.user || ((req.user.id != req.params.id) && !req.user.isAdmin)) {
        return res.sendStatus(401);
    }
    User.findById(req.params.id, function(err, user) {
        if (err) {
            return res.sendStatus(404);
        }

        return res.json(user);
    });
});

router.delete('/:id', function(req, res) {
    if (!req.user || ((req.user.id != req.params.id) && !req.user.isAdmin)) {
        return res.sendStatus(401);
    }
    User.findById(req.params.id, function(err, user) {
        if (err) {
            return res.sendStatus(404);
        }

        user.remove(function(err) {
            if (err) throw err;

            res.sendStatus(200);
        });
    });
});

module.exports = router;