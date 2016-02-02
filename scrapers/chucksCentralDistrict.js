var request = require('request');
var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request('http://cd.chucks85th.com//draft', function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode != 200) {
                return callback('Failed to fetch page. Status code: ' + res.statusCode);
            }

            $ = cheerio.load(body);

            var beers = [];
            $('td.draft_brewery').each(function(i, element) {
                var brewery = $(this).text();
                var beer = $(this).nextAll('td.draft_name').text();

                // Check for known non-beverages
                if ((brewery.toLowerCase().indexOf('ipa flight') != -1) ||
                    (brewery.toLowerCase().indexOf('cider flight') != -1) ||
                    (brewery.toLowerCase().indexOf('humm') != -1)) {
                    return;
                }

                beers.push(brewery.trim() + ' ' + beer.trim());
            });

            return callback(null, beers);
        });
    }
};

