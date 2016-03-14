var tableTop = require('tabletop');
var utils = require('./scraperUtils');

module.exports = {
    scrapeSite: function(callback) {
        utils.retry(function(callback) {
            tableTop.init({
                key: 'https://docs.google.com/spreadsheets/d/1tSIEW6A0O8c2VWC62jGmLxlX-_DiNQKMYKP5jFU_Ikc/pubhtml?gid=0&single=true',
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
        }, 3, callback);
    }
};
