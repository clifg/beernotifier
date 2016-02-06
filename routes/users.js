var express = require('express');
var router = express.Router();

var User = require('../models/user.js');

router.get('/', function(req, res) {
    User.find({}, function(err, users) {
        if (err) throw err;
        res.json(users);
    });
});

router.get('/me', function(req, res) {
    if (!req.user) {
        res.send(404);
    }
    else
    {
        res.json(req.user);
    }
});

router.delete('/me', function(req, res) {
    if (!req.user) {
        res.sendStatus(404);
    }
    else
    {
        User.findById(req.user.id, function(err, user) {
            if (err) {
                return res.sendStatus(404);
            }

            user.remove(function(err) {
                if (err) throw err;

                res.sendStatus(200);
            })
        })
    }
});

router.get('/:id', function(req, res) {
    if ((req.params.id == req.user.id) || req.user.isAdmin) {
        User.findById(req.params.id, function(err, user) {
            if (err) {
                return res.send(404);
            }

            res.json(user);
        });
    }
    else
    {
        res.send(401);
    }
});

router.delete('/:id', function(req, res) {
    if ((req.params.id == req.user.id) || req.user.isAdmin) {
        User.findById(req.params.id, function(err, user) {
            if (err) {
                return res.send(404);
            }

            user.remove(function(err) {
                if (err) throw err;

                res.sendStatus(200);
            });
        });
    }
    else
    {
        res.send(401);
    }
});

module.exports = router;