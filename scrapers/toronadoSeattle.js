var request = require('request');

module.exports = {
    scrapeSite: function(callback) {
        request('http://toronadoseattle.com/beerlistmanager/seattle_beer_list.json', function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode != 200) {
                return callback('Failed to fetch page. Status code: ' + res.statusCode);
            }

            var beers = [];
            obj = JSON.parse(body)
            var currentBrewery;
            for(i = 0; i < obj.beers.length; i++) {
                switch(obj.beers[i].type) {
                    case 'brewer':
                        currentBrewery = obj.beers[i].nameOrHeading;
                        break;

                    case 'brewer_and_beer':
                        currentBrewery = obj.beers[i].nameOrHeading.trim();
                        beers.push(currentBrewery + ' ' + obj.beers[i].beerName.trim());
                        break;

                    case 'beer':
                        beers.push(currentBrewery + ' ' + obj.beers[i].beerName.trim());
                        break;
                }
            }

            return callback(null, beers);
        });
    }
};
