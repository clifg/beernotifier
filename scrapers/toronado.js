var request = require('request');
//var cheerio = require('cheerio');

module.exports = {
    scrapeSite: function(callback) {
        request({
          url: 'http://toronadoseattle.com/beerlistmanager/seattle_beer_list.json',
            },
            function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode != 200) {
                return callback('Failed to fetch page. Status code: ' + res.statusCode);
            }

            {

            if (!err && res.statusCode == 200) {
              var beers = [];
              obj = JSON.parse(body)
              for(i = 0; i < obj.beers.length; i++){
                if(obj.beers[i].beerName != ''){
                  beers.push(obj.beers[i].nameOrHeading + " " + obj.beers[i].beerName);
                  }
              }
            }

            return callback(null, beers);
            }
        })
    }
};
