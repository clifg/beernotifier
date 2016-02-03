# beernotifier
Watch local taplists and send notifications

## Contributing
The site is built on the MEAN stack: MongoDB (database), ExpressJS (web service framework), AngularJS (client framework), and Node (server-side Javascript runtime environment). Here are a few tutorials I found useful when learning how this all works:
* https://blog.udemy.com/node-js-tutorial
* https://thinkster.io/mean-stack-tutorial

To run the code here, I recomment following the setup flow of the Udemy tutorial above. It'll get you set up with [Node](https://nodejs.org/en/download/) and [MongoDB](https://www.mongodb.org/downloads#production) on your local machine. That tutorial will tell you how to set up your mongo database file, etc.

Node Note: After installing Node, you should also [update npm](https://docs.npmjs.com/getting-started/installing-node) to the latest version.

You'll want to run the [mongo command line tool](https://docs.mongodb.org/manual/mongo/) to bootstrap the database. Run `mongo` and then create the database (the Udemy tutorial talks about robomongo, and that looks great and all, but doesn't work with the latest version of MongoDB so just ignore that part).

The database needs some manually-created datasources, and there isn't any client UI for managing them yet, so you can do it by hand from the shell. This inserts all implemented datasources (TODO: Make this automated):
```
use beernotifier
db.datasources.insert(
[{
	"updateFrequency": 0,
	"homeUrl": "http://chuckscd.com",
	"name": "Chucks Central District",
	"scraper": "chucksCentralDistrict"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://chucks85th.com",
	"name": "Chucks Hop Shop Greenwood",
	"scraper": "chucksGreenwood"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://nakedcitybrewing.com",
	"name": "Naked City",
	"scraper": "nakedCity"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://www.prosttavern.net",
	"name": "Prost Tavern",
	"scraper": "prostTavern"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://www.thebarkingdogalehouse.com",
	"name": "The Barking Dog",
	"scraper": "theBarkingDog"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://www.thedray.com",
	"name": "The Dray",
	"scraper": "theDray"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://www.thenoblefir.com",
	"name": "The Noble Fir",
	"scraper": "theNobleFir"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://www.pineboxbar.com",
	"name": "The Pine Box",
	"scraper": "thePineBox"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://www.thesixgill.com",
	"name": "The Sixgill",
	"scraper": "theSixgill"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://theyardcafe.com",
	"name": "The Yard Cafe",
	"scraper": "theYardCafe"
},
{
	"updateFrequency": 0,
	"homeUrl": "http://uberbier.com",
	"name": "Uber",
	"scraper": "uber"
}])
```
Once you're set up, clone the repo to some sane location on your machine and run "npm install" to pull down all of the dependencies for the project. If you followed the Udemy tutorial, you already installed nodemon, which I **highly** recommend using. You can then just run "nodemon" from the root of the project and then point your browser to http://localhost:4000 to see the site.

The account confirmation mailer is configured by using these environment variables:
```
BEERNOTIFIER_EMAIL_USERNAME
BEERNOTIFIER_EMAIL_PASSWORD
```
For now it only supports gmail, so make a dummy gmail account for this. (Note: For now, you can also reuse the one I'm using if you want: `thejankkings@gmail.com`/`p00psocks`) For local development, if you don't want to bother, you can also just go stick an account in the "users" collection directly. Ping me if you want help doing this.

Data is updated through a script that runs periodically, `bin/updateDataSources`. On the live site, this is run every 10 minutes by the Heroku scheduler. You can run it from the command line whenever you want to pull down new data from the scrapers.
