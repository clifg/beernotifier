#!/usr/bin/env node

var tableTop = require('tabletop');

module.exports = {
    scrapeSite: function(callback) {
        tableTop.init( {
            key: 'https://docs.google.com/spreadsheets/d/1-1L9oCGJ0MPTUWuRwADzcECjxkGTih9O-VT6RbIFXlA/pubhtml?gid=0&single=true',
            simpleSheet: true,
            callback: function(data) {
                if (!data) {
                    return callback('Failed to fetch taplist data!');
                }
                
                var beers = [];
                JSON.stringify(data);

                for (var i = 0; i < data.length; i++) {
                    beers.push(data[i].beername);
                }

                return callback(null, beers);
            }
        });
    }
};
