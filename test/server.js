var app  = require('../app');
var request = require('supertest');
var expect = require('chai').expect;

describe('server', function () {
    it('should exist', function (done) {
        expect(app);
        done();
    });

    it('should respond to GET /', function(done) {
        request(app)
            .get('/')
            .expect(200, done);
    });
});