var request = require('request');
var cheerio = require('cheerio');
var utils = require('./scraperUtils');

module.exports = {
    scrapeSite: function(callback) {
        utils.retry(function(callback) {
            request('http://thenoblefir.com/beer-cider.html', function(err, res, body) {
                if (err) {
                    return callback(err);
                }

                if (res.statusCode != 200) {
                    return callback('Failed to fetch page. Status code: ' + res.statusCode);
                }

                $ = cheerio.load(body);

                var beers = [];

                // There are two tables on the page. The first is the draft list.
                $('tbody').first().children('tr').each(function(i, element) {
                    var children = $(this).children();
                    var beer = $(children[0]).text().trim();
                    var brewery = $(children[1]).text().trim();

                    // Noble Fir annoyingly puts "Brewirng Co.", "Cider Co.", etc at the end of the brewery name. Strip it.
                    brewery = brewery.replace(/ Co.$/g, '');
                    brewery = brewery.replace(/ Brewing$/g, '');
                    brewery = brewery.replace(/ Cider$/g, '');

                    if (beer && brewery) {
                        beers.push(brewery + ' ' + beer);
                    }
                });

                return callback(null, beers);
            });
        }, 3, callback);
    }
};

