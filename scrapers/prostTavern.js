var request = require('request');
var cheerio = require('cheerio');
var utils = require('./scraperUtils');

module.exports = {
    scrapeSite: function(callback) {
        utils.retry(function(callback) {
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

                if (res.statusCode != 200) {
                    return callback('Failed to fetch page. Status code: ' + res.statusCode);
                }

                $ = cheerio.load(body);

                var beers = [];
                $('.menu-item-title').each(function(i, element) {
                    beers.push($(this).text().trim());
                });

                return callback(null, beers);
            });
        }, 3, callback);
    }
};

