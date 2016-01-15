#!/usr/bin/env node

var tableTop = require('tabletop');

module.exports = {
    scrapeSite: function(callback) {
        tableTop.init( {
            key: 'https://docs.google.com/spreadsheets/d/1tSIEW6A0O8c2VWC62jGmLxlX-_DiNQKMYKP5jFU_Ikc/pubhtml?gid=0&single=true',
            simpleSheet: true,
            callback: function(data) {
                if (!data) {
                    return callback('Failed to fetch taplist data!');
                }
                
                beers = [];
                JSON.stringify(data);

                for (var i = 0; i < data.length; i++) {
                    beers.push(data[i].beername);
                }

                return callback(null, beers);
            }
        });
    }
};
