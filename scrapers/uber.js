var request = require('request');
var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request('http://www.uberbier.com/tap.php', function(err, res, body) {
            if (err) {
                return callback(err);
            }

            $ = cheerio.load(body);

            tableData = [];
            $('td.td-lists').each(function(i, element) {
                tableData.push($(this).text());
            });

            // The data is in groups of 5 rows. The brewery is the second, the beer is the third.
            var i = 0, chunks = []; 
            while (i < tableData.length) {
                chunks.push(tableData.slice(i, i += 5));
            }

            var beers = [];
            chunks.forEach(function(chunk) {
                beers.push(chunk[1] + ' ' + chunk[2]);
            });

            return callback(null, beers);
        });
    }
};

