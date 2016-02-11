var request = require('request');
var cheerio = require('cheerio');
require('lodash');

module.exports = {
    scrapeSite: function(callback) {
        request('http://mammothseattle.com', function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode != 200) {
                return callback('Failed to fetch page. Status code: ' + res.statusCode);
            }

            $ = cheerio.load(body);

            var beers = [];
            $('div.even-item').each(function(i, element) {
                beers.push($(this).text().replace(/[\n\t\r]/g,""));
            });
            $('div.odd-item').each(function(i, element) {
                beers.push($(this).text().replace(/[\n\t\r]/g,""));
            });

            return callback(null, beers);
        });
    }
};

