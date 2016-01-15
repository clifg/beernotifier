var request = require('request');
var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request({
                url: 'http://www.prosttavern.net/bier',
                headers: {
                    'User-Agent': 'request'
                }
            },
            function(err, res, body) {
            if (err) {
                return callback(err);
            }

            $ = cheerio.load(body);

            beers = [];
            $('.menu-item-title').each(function(i, element) {
                beers.push($(this).text().trim());
            });

            return callback(null, beers);

        });
    }
};

