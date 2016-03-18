var request = require('request');
var cheerio = require('cheerio');
var utils = require('./scraperUtils');

var allCaps = [
    'DIPA',
    'BBL',
    'BA'
];

function sanitizeListing(line) {
    var formattedLine = utils.titleCase(line.trim());
    // Fix up parts that shouldn't actually be title-case, like IPA, IIPA, IRA, DIPA, etc.
    formattedLine = formattedLine.replace(/\bIi*[pr]a\b/g, function(x) { return x.toUpperCase(); });
    for (var i = 0; i < allCaps.length; i++) {
        var regex = new RegExp('\\b' + utils.titleCase(allCaps[i]) + '\\b', 'g');
        formattedLine = formattedLine.replace(regex, function(x) { return x.toUpperCase(); });
    }
    return formattedLine;
}

module.exports = {
    scrapeSite: function(callback) {
        utils.retry(function(callback) {
            request('http://thebarkingdogalehouse.com/?page_id=3', function(err, res, body) {
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
                    beers.push(sanitizeListing(line));
                });

                return foundDelimiter ?
                    callback(null, beers) :
                    callback("Didn't find -bottled beer- line we expected!");
            });
        }, 3, callback);
    }
};

