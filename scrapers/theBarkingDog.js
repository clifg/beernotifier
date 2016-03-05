var request = require('request');
var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request('http://thebarkingdogalehouse.com/beers/', function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode != 200) {
                return callback('Failed to fetch page. Status code: ' + res.statusCode);
            }

            $ = cheerio.load(body);

            var beers = [];
            var foundDelimiter = false;
            $('h5').nextAll('p').each(function(i, element) {
                var line = $(this).text().trim();

                if (line.toLowerCase() == '-bottled beer-') {
                    foundDelimiter = true;
                    return false;
                }

                beers.push(line);
            });

            if (foundDelimiter) {
                console.log('FOUND BEERS!');
                for (var i = 0; i < beers.length; i++) {
                    console.log(beers[i]);
                }
            }

            return foundDelimiter ?
                callback(null, beers) :
                callback("Didn't find -bottled beer- line we expected!");
        });
    }
};

