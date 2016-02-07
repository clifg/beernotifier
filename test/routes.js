var app  = require('../app');
var request = require('supertest');
var expect = require('chai').expect;
var mongoose = require('mongoose');
var secrets = require('../config/secrets');

function clearTestDB(done) {
    if (process.env.NODE_ENV !== 'test') {
        throw('Tests must be running in node test environment!');
    }

    mongoose.connect(secrets.db.test, function() {
        mongoose.connection.db.dropDatabase();
        done();
    });
}

describe('Users', function () {
    before(function(done) {
        clearTestDB(done);
    });

    it('should return a 200 response', function (done) {
        request(app)
            .get('/api/v1/users')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});