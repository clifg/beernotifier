var request = require('request');
var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request({
                url: 'http://www.prosttavern.net/bier',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
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

