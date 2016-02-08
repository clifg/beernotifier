var app  = require('../app');
var request = require('supertest');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var async = require('async');
var sinon = require('sinon');
require('sinon-mongoose');
var secrets = require('../config/secrets');
var User = require('../models/user');

describe('Users', function () {
    var testUsers = [
    {
        local: {
            email: 'test1@email.com',
            password: 'plaintextpass1'
        },
        isAdmin: true,
        activation_code: 'X'
    },
    {
        local: {
            email: 'test2@email.com',
            password: 'plaintextpass2'
        },
        isAdmin: false,
        activation_code: 'X'
    },
    {
        local: {
            email: 'test3@email.com',
            password: 'plaintextpass3'
        },
        isAdmin: false,
        activation_code: 'X'
    }];

    var adminAgent = request.agent(app);
    var userAgent = request.agent(app);

    function addTestUser(user, callback) {
        var newUser = new User();
        newUser.local.email = user.local.email;
        newUser.local.password = newUser.generateHash(user.local.password);
        newUser.isAdmin = user.isAdmin;
        newUser.activation_code = user.activation_code;

        newUser.save(function(err) {
            if (err) throw err;
            user.id = newUser.id;
            callback();
        });
    }

    function usersAreEqual(user1, user2) {
        return ((user1.local.email === user2.local.email) &&
                (user1.isAdmin === user2.isAdmin) &&
                (user1.activation_code === user2.activation_code));
    }

    var db = {};

    before(function(done) {
        this.timeout(20000);
        if (process.env.NODE_ENV !== 'test') {
            throw('Tests must be running in node test environment!');
        }
        async.series([
            function(callback) {
                MongoClient.connect(secrets.db.test, function(err, mongo) {
                    if (err) throw err;
                    db = mongo;
                    callback();
                });
            },
            function(callback) {
                db.dropDatabase(callback);
            },
            function(callback) {
                async.each(testUsers, function(testUser, itrCallback) {
                    addTestUser(testUser, itrCallback);
                }, function(err) {
                    if (err) throw err;
                    callback();
                });
            },
            function(callback) {
                adminAgent
                    .post('/login')
                    .send({email: testUsers[0].local.email, password: testUsers[0].local.password})
                    .expect(302)
                    .end(function(err, res) {
                        if (err) throw err;
                        callback();
                    });
            },
            function(callback) {
                userAgent
                    .post('/login')
                    .send({email: testUsers[1].local.email, password: testUsers[1].local.password})
                    .expect(302)
                    .end(function(err, res) {
                        if (err) throw err;
                        callback();
                    });
            }
        ],
        function(err) {
            if (err) {
                throw(err);
            }
            done();
        });
    });

    it ('should return all users on GET / to admin', function(done) {
        adminAgent
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(res.body.length).to.equal(testUsers.length);
                for (var i = 0; i < res.body.length; i++) {
                    expect(usersAreEqual(res.body[i], testUsers[i]));
                }
                done();
            });
    });

    it ('should return 401 on GET / to regular user', function(done) {
        userAgent
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 401 on GET / when not logged in', function(done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 500 on GET / with internal database error', function(done) {
        var UserMock = sinon.mock(User);
        UserMock.expects('find')
            .chain('select').withArgs('-local.password')
            .chain('exec')
            .yields('error');
        adminAgent
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(500)
            .end(function(err, res) {
                UserMock.verify();
                if (err) throw err;
                done();
            });
    });

    it ('should not return password fields on GET /', function(done) {
        adminAgent
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(res.body.length).to.equal(testUsers.length);
                for (var i = 0; i < res.body.length; i++)
                {
                    expect(res.body[i].local.password === undefined);
                }
                done();
            });
    });

    it ('should return one user on GET /:id to admin', function(done) {
        adminAgent
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(usersAreEqual(res.body, testUsers[0]));
                done();
            });
    });

    it ('should return user data for \'myself\' on GET /:id to regular user', function(done) {
        userAgent
            .get('/api/v1/users/' + testUsers[1].id)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(usersAreEqual(res.body, testUsers[1]));
                done();
            });
    });

    it ('should return 401 on GET /:id of someone else to regular user', function(done) {
        userAgent
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 401 on GET /:id when not logged in', function(done) {
        request(app)
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should not return password on GET /:id', function(done) {
        adminAgent
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(res.body.local.password === undefined);
                done();
            });
    });

    it ('should return 500 on GET /:id with bogus user id', function(done) {
        adminAgent
            .get('/api/v1/users/thisisnotanid')
            .set('Accept', 'application/json')
            .expect(500, done);
    });

    it ('should return 404 on GET /:id with nonexistent user id', function(done) {
        adminAgent
            .get('/api/v1/users/111111111170d64339e061b4')
            .set('Accept', 'application/json')
            .expect(404, done);
    });

    it ('should return 401 on DELETE /:id by regular user', function(done) {
        userAgent
            .delete('/api/v1/users/' + testUsers[2].id)
            .expect(401, done);
    });

    it ('should return 401 on DELETE /:id when not logged in', function(done) {
        request(app)
            .delete('/api/v1/users/' + testUsers[2].id)
            .expect(401, done);
    });

    it ('should return 500 on DELETE /:id with bogus user id', function(done) {
        adminAgent
            .delete('/api/v1/users/thisisnotanid')
            .expect(500, done);
    });

    it ('should return 404 on DELETE /:id with nonexistent user id', function(done) {
        adminAgent
            .delete('/api/v1/users/111111111170d64339e061b4')
            .expect(404, done);
    });

    it ('should return 500 on DELETE /:id with database internal error', function(done) {
        sinon.stub(User.prototype, 'remove').yields('error');
        adminAgent
            .delete('/api/v1/users/' + testUsers[2].id)
            .expect(500)
            .end(function(err, res) {
                User.prototype.remove.restore();
                if (err) throw err;
                done();
            });
    });

    it ('should delete user record on DELETE /:id by admin', function(done) {
        adminAgent
            .delete('/api/v1/users/' + testUsers[2].id)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                // Make sure the user was actually deleted
                User.findById(testUsers[2].id, function(err, user) {
                    if (err) throw err;
                    expect(user).is.null;
                    done();
                });
            });
    });

    after(function(done) {
        this.timeout(20000);
        db.dropDatabase(done);
    });
});