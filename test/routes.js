var app  = require('../app');
var request = require('supertest');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var async = require('async');
var sinon = require('sinon');
require('sinon-mongoose');
var _ = require('underscore');
var secrets = require('../config/secrets');
var User = require('../models/user');
var DataSource = require('../models/dataSource');
var TapListing = require('../models/tapListing');
var Subscription = require('../models/subscription');

var testUsers = [
{
    email: 'test1@email.com',
    password: 'plaintextpass1',
    isAdmin: true
},
{
    email: 'test2@email.com',
    password: 'plaintextpass2',
    isAdmin: false
},
{
    email: 'test3@email.com',
    password: 'plaintextpass3',
    isAdmin: false
}];

var tokens = {};
var adminUser = testUsers[0];
var regularUser = testUsers[1];

function addTestUser(user, callback) {
    var newUser = new User();
    newUser.email = user.email;
    newUser.password = newUser.generateHash(user.password);
    newUser.isAdmin = user.isAdmin;

    newUser.save(function(err) {
        if (err) throw err;
        user.id = newUser.id;
        callback();
    });
}

before(function(done) {
    this.timeout(20000);
    if (process.env.NODE_ENV !== 'test') {
        throw('Tests must be running in node test environment!');
    }
    async.series([
        function(callback) {
            MongoClient.connect(secrets.db.test, function(err, mongo) {
                if (err) throw err;
                this.db = mongo;
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
            request(app)
                .post('/login')
                .send({email: testUsers[0].email, password: testUsers[0].password})
                .expect(200)
                .end(function(err, res) {
                    if (err) throw err;
                    expect(res.body.token).to.not.be.undefined;
                    tokens.adminJwt = res.body.token;
                    callback();
                });
        },
        function(callback) {
            request(app)
                .post('/login')
                .send({email: testUsers[1].email, password: testUsers[1].password})
                .expect(200)
                .end(function(err, res) {
                    if (err) throw err;
                    expect(res.body.token).to.not.be.undefined;
                    tokens.userJwt = res.body.token;
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


after(function(done) {
    this.timeout(20000);
    db.dropDatabase(done);
});

describe('/users', function () {
    function usersAreEqual(user1, user2) {
        return ((user1.email === user2.email) &&
                (user1.isAdmin === user2.isAdmin));
    }

    it ('should return all users on GET /users to admin', function(done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
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

    it ('should return 401 on GET /users to regular user', function(done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(401, done);
    });

    it ('should return 401 on GET /users with no auth token', function(done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 500 on GET /users with internal database error', function(done) {
        var UserMock = sinon.mock(User);
        UserMock.expects('find')
            .chain('select').withArgs('-password')
            .chain('exec')
            .yields('error');
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(500)
            .end(function(err, res) {
                UserMock.verify();
                if (err) throw err;
                done();
            });
    });

    it ('should not return password fields on GET /users', function(done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(res.body.length).to.equal(testUsers.length);
                for (var i = 0; i < res.body.length; i++)
                {
                    expect(res.body[i].password === undefined);
                }
                done();
            });
    });

    it ('should return one user on GET /users/:id to admin', function(done) {
        request(app)
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(usersAreEqual(res.body, testUsers[0]));
                done();
            });
    });

    it ('should return user data for \'myself\' on GET /users/:id to regular user', function(done) {
        request(app)
            .get('/api/v1/users/' + testUsers[1].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(usersAreEqual(res.body, testUsers[1]));
                done();
            });
    });

    it ('should return 401 on GET /users/:id of someone else to regular user', function(done) {
        request(app)
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(401, done);
    });

    it ('should return 401 on GET /users/:id when not logged in', function(done) {
        request(app)
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should not return password on GET /users/:id', function(done) {
        request(app)
            .get('/api/v1/users/' + testUsers[0].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(res.body.password === undefined);
                done();
            });
    });

    it ('should return 500 on GET /users/:id with bogus user id', function(done) {
        request(app)
            .get('/api/v1/users/thisisnotanid')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(500, done);
    });

    it ('should return 404 on GET /users/:id with nonexistent user id', function(done) {
        request(app)
            .get('/api/v1/users/111111111170d64339e061b4')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(404, done);
    });

    it ('should return 401 on DELETE /users/:id by regular user', function(done) {
        request(app)
            .delete('/api/v1/users/' + testUsers[2].id)
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(401, done);
    });

    it ('should return 401 on DELETE /users/:id when not logged in', function(done) {
        request(app)
            .delete('/api/v1/users/' + testUsers[2].id)
            .expect(401, done);
    });

    it ('should return 500 on DELETE /users/:id with bogus user id', function(done) {
        request(app)
            .delete('/api/v1/users/thisisnotanid')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(500, done);
    });

    it ('should return 404 on DELETE /users/:id with nonexistent user id', function(done) {
        request(app)
            .delete('/api/v1/users/111111111170d64339e061b4')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(404, done);
    });

    it ('should return 500 on DELETE /users/:id with database internal error', function(done) {
        sinon.stub(User.prototype, 'remove').yields('error');
        request(app)
            .delete('/api/v1/users/' + testUsers[2].id)
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(500)
            .end(function(err, res) {
                User.prototype.remove.restore();
                if (err) throw err;
                done();
            });
    });

    it ('should delete user record on DELETE /users/:id by admin', function(done) {
        request(app)
            .delete('/api/v1/users/' + testUsers[2].id)
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
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

    it ('should return 401 on GET /users with invalid auth token', function(done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer qwerqwerqwer')
            .expect(401, done);
    });
});

describe('/datasources', function () {
    var testDataSources = [
    {
        homeUrl: "http://www.source1.com",
        name: "Data Source 1",
        scraper: "scraper1",
        updates: [
            new Date('2016-01-21T01:26:42.167Z'),
            new Date('2016-01-21T01:36:43.319Z'),
            new Date('2016-01-21T03:26:47.066Z')
        ]
    },
    {
        homeUrl: "http://www.source2.com",
        name: "Data Source 2",
        scraper: "scraper2",
        updates: [
            new Date('2016-01-23T14:26:52.283Z')
        ]
    },
    {
        homeUrl: "http://www.source3.com",
        name: "Data Source 3",
        scraper: "scraper3",
        updates: []
    }];

    function addTestDataSource(dataSource, callback) {
        var newDataSource = new DataSource();
        newDataSource.homeUrl = dataSource.homeUrl;
        newDataSource.name = dataSource.name;
        newDataSource.scraper = dataSource.scraper;
        newDataSource.updates = dataSource.updates.slice(0);

        newDataSource.save(function(err) {
            if (err) throw err;
            dataSource.id = newDataSource.id;
            callback();
        });
    }

    function dataSourcesAreEqual(source1, source2, withUpdates) {
        return ((source1.homeUrl === source2.homeUrl) &&
                (source1.name === source2.name) &&
                withUpdates ? _.isEqual(source1.updates, source2.updates):true);
    }

    before(function(done) {
        this.timeout(20000);
        if (process.env.NODE_ENV !== 'test') {
            throw('Tests must be running in node test environment!');
        }
        async.series([
            function(callback) {
                MongoClient.connect(secrets.db.test, function(err, mongo) {
                    if (err) throw err;
                    this.db = mongo;
                    callback();
                });
            },
            function(callback) {
                db.collection('datasources').drop(function(err, response) {
                    if (err && err.errmsg !== 'ns not found') throw err;
                    callback();
                });
            },
            function(callback) {
                async.each(testDataSources, function(testDataSource, itrCallback) {
                    addTestDataSource(testDataSource, itrCallback);
                }, function(err) {
                    if (err) throw err;
                    callback();
                });
            },
        ],
        function(err) {
            if (err) {
                throw(err);
            }
            done();
        });
    });

    it ('should return all datasources on GET /datasources', function(done) {
        request(app)
            .get('/api/v1/datasources')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.true;
                expect(res.body.length).to.equal(testDataSources.length);
                for (var i = 0; i < res.body.length; i++) {
                    expect(dataSourcesAreEqual(res.body[i], testDataSources[i], false));
                }
                done();
            });
    });

    it ('should not return any updates array on GET /datasources', function(done) {
        request(app)
            .get('/api/v1/datasources')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.true;
                for (var i = 0; i < res.body.length; i++) {
                    expect(res.body[i].updates).to.be.undefined;
                }
                done();
            });
    });

    it ('should return updates array on GET /datasources?updates=true', function(done) {
        request(app)
            .get('/api/v1/datasources?updates=true')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.true;
                for (var i = 0; i < res.body.length; i++) {
                    expect(dataSourcesAreEqual(res.body[i], testDataSources[i], true));
                }
                done();
            });
    });

    it ('should not return updates array on GET /datasources?updates=<something_other_than_true>', function(done) {
        var urls = [
            '/api/v1/datasources?updates=false',
            '/api/v1/datasources?updates=blahblah',
            '/api/v1/datasources?updates='
        ];

        async.each(urls, function(url, callback) {
            request(app)
                .get(url)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + tokens.userJwt)
                .expect(200)
                .end(function(err, res) {
                    if (err) throw err;
                    expect(Array.isArray(res.body)).to.be.true;
                    expect(res.body.updates).to.be.undefined;
                    callback();
                });
            },
            function(err) {
                if (err) throw err;
                done();
            }
        );
    });

    it ('should return a single datasource on GET /datasources/:id', function(done) {
        request(app)
            .get('/api/v1/datasources/' + testDataSources[1].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(dataSourcesAreEqual(res.body, testDataSources[1], false));
                done();
            });
    });

    it ('should return 500 on GET /datasources with internal database error', function(done) {
        var DataSourceMock = sinon.mock(DataSource);
        DataSourceMock.expects('find')
            .chain('select').withArgs('-updates')
            .chain('exec')
            .yields('error');
        request(app)
            .get('/api/v1/datasources')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(500)
            .end(function(err, res) {
                DataSourceMock.verify();
                if (err) throw err;
                done();
            });
    });

    it ('should return 500 on GET /datasources/:id with a bogus id', function(done) {
        request(app)
            .get('/api/v1/datasources/thisisnotanid')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(500, done);
    });

    it ('should return 404 on GET /datasources/:id with a non-existent id', function(done) {
        request(app)
            .get('/api/v1/datasources/11111111111111903f138bf4')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(404, done);
    });

    it ('should return 401 on GET /datasources with no auth token', function(done) {
        request(app)
            .get('/api/v1/datasources')
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 401 on GET /datasources with no invalid auth token', function(done) {
        request(app)
            .get('/api/v1/datasources')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer asdfasdfasdfasdf')
            .expect(401, done);
    });

    after(function(done) {
        this.timeout(20000);
        db.collection('datasources').drop(function(err, response) {
            if (err) throw err;
            done();
        });
    });
});

describe('/taplistings', function () {
    // These are in reverse order of createdDate right now, so the tests are happy. We
    // should probably sort these if the dataset gets much larger or more complicated.
    var testTapListings = [
    {
        isActive: true,
        createdDate: new Date('2016-02-09T06:06:40.071Z'),
        rawListing: 'Beer Number 1'
    },
    {
        isActive: true,
        createdDate: new Date('2016-02-08T11:42:49.123Z'),
        rawListing: 'Beer Number 2'
    },
    {
        isActive: false,
        createdDate: new Date('2016-01-30T18:46:42.444Z'),
        removedDate: new Date('2016-02-09T04:02:13.832Z'),
        rawListing: 'Beer Number 3'
    },
    {
        isActive: false,
        createdDate: new Date('2016-01-03T03:33:22.777Z'),
        removedDate: new Date('2016-01-18T13:55:44.222Z'),
        rawListing: 'Beer Number 4'
    }];

    var testDataSource = {
        name: 'Test Data Source',
        homeUrl: 'http://testdatasource.com',
        scraper: 'testDataSource'
    };

    function addTestDataSource(dataSource, callback) {
        var testDataSource = new DataSource();
        testDataSource.name = dataSource.name;
        testDataSource.homeUrl = dataSource.homeUrl;
        testDataSource.scraper = dataSource.scraper;

        testDataSource.save(function(err) {
            if (err) throw err;
            dataSource.id = testDataSource.id;
            for (var i = 0; i < testTapListings.length; i++) {
                testTapListings[i].dataSource = {
                    id: testDataSource.id,
                    name: testDataSource.name
                };
            }
            callback();
        });
    }

    function addTestTapListing(tapListing, testDataSource, callback) {
        var newTapListing = new TapListing();
        newTapListing.isActive = tapListing.isActive;
        newTapListing.createdDate = tapListing.createdDate;
        if (tapListing.removedDate) { newTapListing.removedDate = tapListing.removedDate; }
        newTapListing.dataSource = { _id: testDataSource.id };
        newTapListing.rawListing = tapListing.rawListing;

        newTapListing.save(function(err) {
            if (err) throw err;
            tapListing.id = newTapListing.id;
            callback();
        });
    }

    function tapListingsAreEqual(tapListing1, tapListing2) {
        return ((tapListing1.isActive === tapListing2.isActive) &&
                (tapListing1.createdDate === tapListing2.createdDate) &&
                ((!tapListing.isActive) ? (tapListing1.removedDate === tapListing2.removedDate) : true) &&
                _.isEqual(tapListing1.dataSource, tapListing2.dataSource) &&
                (tapListing1.rawListing === tapListing2.rawListing));
    }

    before(function(done) {
        this.timeout(20000);
        if (process.env.NODE_ENV !== 'test') {
            throw('Tests must be running in node test environment!');
        }
        async.series([
            function(callback) {
                MongoClient.connect(secrets.db.test, function(err, mongo) {
                    if (err) throw err;
                    this.db = mongo;
                    callback();
                });
            },
            function(callback) {
                db.collection('taplistings').drop(function(err, response) {
                    if (err && err.errmsg !== 'ns not found') throw err;
                    callback();
                });
            },
            function(callback) {
                addTestDataSource(testDataSource, callback);
            },
            function(callback) {
                async.each(testTapListings, function(testTapListing, itrCallback) {
                    addTestTapListing(testTapListing, testDataSource, itrCallback);
                }, function(err) {
                    if (err) throw err;
                    callback();
                });
            },
        ],
        function(err) {
            if (err) {
                throw(err);
            }
            done();
        });
    });

    it ('should return all listings on GET /taplistings', function(done) {
        request(app)
            .get('/api/v1/taplistings')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.true;
                expect(res.body.length).to.equal(testTapListings.length);
                for(var i = 0; i < res.body.length; i++)
                {
                    expect(tapListingsAreEqual(res.body[i], testTapListings[i]));
                }
                done();
            });
    });

    it ('should return only active listings on GET /taplistings?active=true', function(done) {
        request(app)
            .get('/api/v1/taplistings?active=true')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.true;
                var activeTapListings = testTapListings.filter(function(listing) {
                    return listing.isActive;
                });
                expect(res.body.length).to.equal(activeTapListings.length);
                for(var i = 0; i < res.body.length; i++)
                {
                    expect(tapListingsAreEqual(res.body[i], activeTapListings[i]));
                }
                done();
            });
    });

    it ('should ignore query param on GET /taplistings?active=<something_other_than_true>', function(done) {
        var urls = [
            '/api/v1/taplistings?active=false',
            '/api/v1/taplistings?active=foobar',
            '/api/v1/taplistings?active='
        ];

        async.each(urls, function(url, callback) {
            request(app)
                .get(url)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + tokens.userJwt)
                .expect(200)
                .end(function(err, res) {
                    if (err) throw err;
                    expect(Array.isArray(res.body)).to.be.true;
                    expect(res.body.length).to.equal(testTapListings.length);
                    callback();
                });
            },
            function(err) {
                if (err) throw err;
                done();
            }
        );
    });

    it ('should return 500 on GET /taplistings with internal database error', function(done) {
        var TapListingMock = sinon.mock(TapListing);
        TapListingMock.expects('find')
            .chain('populate')
            .chain('exec')
            .yields('error');
        request(app)
            .get('/api/v1/taplistings')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(500)
            .end(function(err, res) {
                TapListingMock.verify();
                if (err) throw err;
                done();
            });
    });

    it ('should return 401 on GET /taplistings with no auth token', function(done) {
        request(app)
            .get('/api/v1/taplistings')
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 401 on GET /taplistings with invalid auth token', function(done) {
        request(app)
            .get('/api/v1/taplistings')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer asdfjasefaawef')
            .expect(401, done);
    });

    after(function(done) {
        this.timeout(20000);
        db.collection('taplistings').drop(function(err, response) {
            if (err) throw err;
            done();
        });
    });
});

describe('/subscriptions', function () {
    var testDataSources = [
    {
        homeUrl: "http://www.source1.com",
        name: "Data Source 1",
        scraper: "scraper1",
        updates: [
            new Date('2016-01-21T01:26:42.167Z'),
            new Date('2016-01-21T01:36:43.319Z'),
            new Date('2016-01-21T03:26:47.066Z')
        ]
    }];

    // For now these are in sorted order so the tests are happy. In the future we should
    // consider sorting to avoid this constraint but for simple tests this is fine.
    var testSubscriptions = [
    {
        isForAdmin: true,
        type: 'keyword', 
        createdDate: new Date('2016-03-01T10:22:13.283Z'),
        keywordConfig: {
            keyword: 'ipa'
        },
        dataSourceMatches: 'any',
        dataSourceList: []
    },
    {
        isForAdmin: false,
        type: 'keyword', 
        createdDate: new Date('2015-12-01T10:02:18.313Z'),
        keywordConfig: {
            keyword: 'imperial stout'
        },
        dataSourceMatches: 'any',
        dataSourceList: []
    },
    {
        isForAdmin: false,
        type: 'keyword', 
        createdDate: new Date('2015-12-01T10:02:18.313Z'),
        keywordConfig: {
            keyword: 'abyss'
        },
        dataSourceMatches: 'list',
        dataSourceList: []
    }];

    before(function(done) {
        this.timeout(20000);
        if (process.env.NODE_ENV !== 'test') {
            throw('Tests must be running in node test environment!');
        }
        async.series([
            function(callback) {
                MongoClient.connect(secrets.db.test, function(err, mongo) {
                    if (err) throw err;
                    this.db = mongo;
                    callback();
                });
            },
            function(callback) {
                db.collection('datasources').drop(function(err, response) {
                    if (err && err.errmsg !== 'ns not found') throw err;
                    callback();
                });
            },
            function(callback) {
                db.collection('subscriptions').drop(function(err, response) {
                    if (err && err.errmsg !== 'ns not found') throw err;
                    callback();
                });
            },
            function(callback) {
                async.each(testDataSources, function(testDataSource, itrCallback) {
                    addTestDataSource(testDataSource, itrCallback);
                }, function(err) {
                    if (err) throw err;
                    callback();
                });
            },
            function(callback) {
                async.each(testSubscriptions, function(testSubscription, itrCallback) {
                    addTestSubscription(testSubscription, itrCallback);
                }, function(err) {
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
    })

    function addTestDataSource(dataSource, callback) {
        var testDataSource = new DataSource();
        testDataSource.name = dataSource.name;
        testDataSource.homeUrl = dataSource.homeUrl;
        testDataSource.scraper = dataSource.scraper;

        testDataSource.save(function(err) {
            if (err) throw err;
            dataSource.id = testDataSource.id;
            for (var i = 0; i < testSubscriptions.length; i++) {
                if (testSubscriptions[i].dataSourceMatches === 'list') {
                    testSubscriptions[i].dataSourceList = testSubscriptions.dataSourceList || [];
                    testSubscriptions[i].dataSourceList.push(testDataSource.id);
                }
            }
            callback();
        });
    }

    function addTestSubscription(subscription, callback) {
        var newSubscription = new Subscription();
        newSubscription.user =  subscription.isForAdmin ? adminUser.id : regularUser.id;
        newSubscription.type = subscription.type;
        newSubscription.createdDate = subscription.createdDate;
        newSubscription.keywordConfig = subscription.keywordConfig;
        newSubscription.dataSourceMatches = subscription.dataSourceMatches;
        newSubscription.dataSourceList = subscription.dataSourceList;

        newSubscription.save(function(err) {
            if (err) throw err;
            subscription.id = newSubscription.id;
            callback();
        });
    }

    function subscriptionsAreEqual(subscription1, subscription2) {
        return ((subscription1.user === subscription2.user) &&
                (subscription1.createdDate === subscription2.createdDate) &&
                (subscription1.type === subscription2.type) &&
                (subscription1.keywordConfig === subscription2.keywordConfig) &&
                (subscription1.dataSourceMatches === subscription2.dataSourceMatches) &&
                (subscription1.dataSourceList === subscription2.dataSourceList));
    }

    it ('should return all subscriptions on GET /subscriptions for admin', function(done) {
        request(app)
            .get('/api/v1/subscriptions')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.true;
                expect(res.body.length).to.equal(testSubscriptions.length);
                for(var i = 0; i < res.body.length; i++)
                {
                    expect(subscriptionsAreEqual(res.body[i], testSubscriptions[i]));
                }
                done();
            });
    });

    it ('should return 401 on GET /subscriptions for regular user', function(done) {
        request(app)
            .get('/api/v1/subscriptions')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(401, done);
    });

    it ('should return 500 on GET /subscriptions with internal database error', function(done) {
        var SubscriptionMock = sinon.mock(Subscription);
        SubscriptionMock.expects('find')
            .chain('exec')
            .yields('error');
        request(app)
            .get('/api/v1/subscriptions')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(500)
            .end(function(err, res) {
                SubscriptionMock.verify();
                if (err) throw err;
                done();
            });
    });

    it ('should return 401 on GET /subscriptions with no auth token', function(done) {
        request(app)
            .get('/api/v1/subscriptions')
            .set('Accept', 'application/json')
            .expect(401, done);
    });

    it ('should return 401 on GET /subscriptions with no invalid auth token', function(done) {
        request(app)
            .get('/api/v1/datasources')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer 2349823rio32hfj23.sdakfjsdoiajfdsjfoi3')
            .expect(401, done);
    });

   it ('should return a single subscription on GET /subscriptions/:id', function(done) {
        async.each(testSubscriptions, function(testSubscription, callback) {
            request(app)
                .get('/api/v1/subscriptions/' + testSubscription.id)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + tokens.adminJwt)
                .expect(200)
                .end(function(err, res) {
                    if (err) throw err;
                    expect(Array.isArray(res.body)).to.be.false;
                    expect(subscriptionsAreEqual(res.body, testSubscription));
                    callback();
                });
        }, 
        function(err) {
            if (err) throw err;
            done();
        });
    });

    it ('should return another user\'s subscription on GET /subscriptions/:id with an admin token', function(done) {
        request(app)
            .get('/api/v1/subscriptions/' + testSubscriptions[1].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(subscriptionsAreEqual(res.body, testSubscriptions[1]));
                done();
            });
    });

    it ('should return 401 on GET /subscriptions/:id for a subscription the user does not own (and is not admin)', function(done) {
        request(app)
            .get('/api/v1/subscriptions/' + testSubscriptions[0].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(401, done);
    });

    it ('should return subscription on GET /subscriptions/:id for a subscription the regular user does own', function(done) {
        request(app)
            .get('/api/v1/subscriptions/' + testSubscriptions[2].id)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.userJwt)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                expect(Array.isArray(res.body)).to.be.false;
                expect(subscriptionsAreEqual(res.body, testSubscriptions[2]));
                done();
            });
    });

    it ('should return 500 on GET /subscriptions/:id with a bogus id', function(done) {
        request(app)
            .get('/api/v1/subscriptions/thisisnotanid')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(500, done);
    });

    it ('should return 404 on GET /subscriptions/:id with a non-existent id', function(done) {
        request(app)
            .get('/api/v1/subscriptions/1111111891171b903f138bf4')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + tokens.adminJwt)
            .expect(404, done);
    });

    after(function(done) {
        this.timeout(20000);
        db.collection('subscriptions').drop(function(err, response) {
            if (err) throw err;
            done();
        });
    });
});