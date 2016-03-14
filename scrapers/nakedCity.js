var browser = require('zombie');
var cheerio = require('cheerio');
var utils = require('./scraperUtils.js');

module.exports = {
    scrapeSite: function(callback) {
        utils.retry(function(callback) {
            // Naked City uses the meteor framework, so we have to actually render the page (sucks)
            browser.visit('https://drink.nakedcity.beer/menus', function(err, browser) {
                if (err) {
                    return callback(err);
                }

                $ = cheerio.load(browser.html());

                var beers = [];
                $('#beerMenu').find($('.col b')).each(function(i, element) {
                    var beer = $(this).text().trim();
                    if (beer) {
                        beers.push(beer);
                    }
                });

                return callback(null, beers);
            });
        }, 3, callback);
    }
};

