var app  = require('../app');
var request = require('supertest');
var expect = require('chai').expect;

describe('server', function () {
    it('should exist', function (done) {
        expect(app);
        done();
    });
});