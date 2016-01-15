var request = require('request');
var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request('https://nakedcitybrewing.com/beer/tap-list', function(err, res, body) {
            if (err) {
                return callback(err);
            }

            $ = cheerio.load(body);

            beers = [];
            $('span.views-field-field-beer').each(function(i, element) {
                beers.push($(this).children('span.field-content').children('a').text());
            });

            return callback(null, beers);
        });
    }
};

