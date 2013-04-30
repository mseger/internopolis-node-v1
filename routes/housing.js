var scrapi = require('scrapi')
var async = require('async')
var HousingListing = require('../models/housingListing')
var CraigslistObject = require('../models/craigslistObject')
var User = require('../models/User')
var craigslist = require('craigslist');

///////////////////////////MANUAL SCRAPING//////////////////////////////////////////////

// scrape just the links to leads manifest
var linksManifest = {
  "base": "http://sfbay.craigslist.org/",
  "spec": {
    "*": {
      links: {
        "$query": "#toc_rows a",
        "$each":{
          "href": "(attr href)"
        }
      }
    }
  }
};

// for each individual listing
var individualManifest = {
  "base": "http://sfbay.craigslist.org/",
  "spec": {
    "*": {
      description: {
        "$query": "#postingbody",
        "$value": "(text)"
      },
      images: {
        "$query": "#thumbs a",
        "$each": {
          "href": "(attr href)"
        }
      }, 
      address: {
        "$query": "#attributes", 
        "$value": "(text)"
      }, 
      lat: {
        "$query": "#leaflet",
        "$value": "(attr data-latitude)"
      }, 
      lon: {
        "$query": "#leaflet", 
        "$value": "(attr data-longitude)"
      }
    }
  }
};

// trying to refine our search and query each one for info 
exports.houseScrape = function(req, res){
  var api = scrapi(linksManifest);
  api('apa/').get(function (err, json){
    if(err)
      console.log("Error using scrapi: ", err);
    // if that goes through, sort through the links returned
    for(var i=0; i<json.links.length; i++){
      var link = json.links[i].href;
      if((link != '#') && (link != undefined) && (link.length >28)){
        // 28th character is the beginning of the listing-specific URL
        var individualAPI = scrapi(individualManifest);
        individualAPI(link.substring(28)).get(function (err, listingJSON){
          if(err)
            console.log("Error using second call of scrapi: ", err);

          // create a new HousingListing entry 
          var newHousingListing = new HousingListing({description: listingJSON.description, image_URLs: listingJSON.images, address: listingJSON.address, lat:listingJSON.lat, lon: listingJSON.lon});
          newHousingListing.save(function(err){
          	if(err)
          		console.log("Unable to save new listing: ", err);
          });
        });
      }
    }
  });
}

// using async to scrape and display properly 
exports.asyncHouseScrape = function(req, res){
	var allListings = [];
  var allListings_asObjects = [];
  async.auto({
      clearing_listings: function(callback){
        // if stored listings are recent enough, just surface those
        var aListing = HousingListing.find().exec(function (err, listings){
          if(err)
            console.log("Unable to retrieve housing listings ", err); 
          var time = Date.now();
          if((listings.length) >0 && time - listings[0].timestamp < 36000000){
            res.render('displayHousing', {title: "Housing", housingOptions: listings});
          }else{
            // too old, delete all old ones and re-scrape
            HousingListing.remove({}, function(err){
              if(err)
                console.log("Unable to purge HousingListing DB: ", err);
              // if successful
              callback(null);   
            });
          }
        });
      }, 
      scraping_listings: ["clearing_listings", function(callback){
        // using scrapi, scrape list of links in listing
        var api = scrapi(linksManifest);
			  api('apa/').get(function (err, json){
			    if(err)
			      console.log("Error using scrapi: ", err);
			    async.each(json.links, function(item, next){
			    	var link = item.href;
				     if((link != '#') && (link != undefined) && (link.length >28)){
				        // 28th character is the beginning of the listing-specific URL
				        var individualAPI = scrapi(individualManifest);
				        individualAPI(link.substring(28)).get(function (err, listingJSON){
				          if(err)
				            console.log("Error using second call of scrapi: ", err);
				          allListings.push(listingJSON);
				          next();
				        });   
				      }else{
				      	next();
				      }
			    }, 
			    callback);
			  });
			}],
			mapping_listings: ["scraping_listings", function(callback){
			    async.map(allListings, function (currListing, next) {
	          // create a new HousingListing entry 
            var currTime = Date.now();
            var parsed_imageURLs = [];
            for(var i=0; i< currListing.images.length; i++){
              if(currListing.images[i] != undefined){
                parsed_imageURLs.push(currListing.images[i].href);
              }
            }
	          var newHousingListing = new HousingListing({description: currListing.description, image_URLs: parsed_imageURLs, address: currListing.address, lat: currListing.lat, lon: currListing.lon, timestamp: currTime});
	          newHousingListing.save(function(err){
	            if(err)
	              console.log("Couldn't save new housing listing: ", err);
	            allListings_asObjects.push(newHousingListing);
              next(null);
            });
          }, function (err, results) {
            // all done with each of them
            callback(null, results);
          });
			}],
      updating_user_listings: ["mapping_listings", function(callback){
        var currentUser = User.findOne({name: req.session.user.name}).exec(function (err, currUser){
          currUser.housing_listings = allListings_asObjects;
          currUser.save(function (err2){
            if(err)
              console.log("Unable to save housing listings for user", err2);
            callback(null);
          });
        });
      }],
      displaying_listings: ["updating_user_listings", function(callback, results){
        res.render('displayHousing', {title: "Housing", housingOptions: allListings});
        callback(null, 'done');
      }]
  }, function (err, result) {
      console.log("Finished async house scraping + displaying");   
  });
}

// add a housing listing to your list of starred housing listings
// FOR NEXT TIME START HERE
exports.addStarredHousingListing = function(req, res){
  currUser = User.findOne({name: req.session.user.name}).exec(function (err, user){
    if(err)
      console.log("Unable to edit starred roommates list: ", err);
    var starredRoommates = user.starred_roommates;

    // look up or create a FBOnlyUser 
    var fbUser = FBOnlyUser.findOne({FBID: req.body.id}).exec(function (err, FBUser){
      if(err)
        console.log("Error in retrieving FBUser: ", err);
      // user already exists, just add them to modified starred list
      starredRoommates.push(FBUser);
      user.starred_roommates = starredRoommates;
      user.save(function (err){
        if(err)
          console.log("Unable to save modified starred roommates list: ", err);
        res.redirect('/roommates');
      });
    });
  });
}

// delete all housing listings
exports.delete_all = function(req, res){
  // clears out your list so you can start from scratch
  HousingListing.remove({}, function(err) { 
      console.log('housing collection emptied');
      res.redirect('/');
  });
};

///////////////////////////CRAIGSLIST MODULE//////////////////////////////////////////////

// craigslist module test
exports.craigslistModuleTest = function(req, res){
  // this parses the HTML list, which doesn't include things like images and geo coordinates
  craigslist.getList('http://auburn.craigslist.org/apa/', function(error, listings) {
    listings.forEach(function(listing) {
      listing.title;
      listing.description;
      listing.url;
    });
  });
}

exports.asyncCraigslistModule = function(req, res){
  var allListings = [];
  var allListings_asObjects = [];
  async.auto({
      clearing_listings: function(callback){
        // too old, delete all old ones and re-scrape
        CraigslistObject.remove({}, function(err){
          if(err)
            console.log("Unable to purge CraigslistObject DB: ", err);
          // if successful
          callback(null);   
        });
      }, 
      retrieving_listings: ["clearing_listings", function(callback){
        // this parses the HTML list, which doesn't include things like images and geo coordinates
        craigslist.getList('http://auburn.craigslist.org/apa/', function(error, listings) {
          allListings = listings;
          console.log("Listings are: ", listings[0]); 
          callback(null);
        });
      }],
      mapping_listings: ["retrieving_listings", function(callback){
          async.map(allListings, function (currListing, next) {
            // create a new HousingListing entry 
            var currTime = Date.now();
            var newCraigslistObject = new CraigslistObject({title: currListing.title, description: currListing.description, url: currListing.url, timestamp: currTime});
            newCraigslistObject.save(function(err){
              if(err)
                console.log("Couldn't save new CraigslistObject: ", err);
              allListings_asObjects.push(newCraigslistObject);
              next(null);
            });
          }, function (err, results) {
            // all done with each of them
            callback(null, results);
          });
      }],
      displaying_listings: ["mapping_listings", function(callback, results){
        res.render('displayHousing', {title: "Housing", housingOptions: allListings});
        callback(null, 'done');
      }]
  }, function (err, result) {
      console.log("Finished async Craigslist Object scraping + displaying");   
  });
}


// delete all Craigslist Objects
exports.delete_all_CraigslistObjects = function(req, res){
  // clears out your list so you can start from scratch
  CraigslistObject.remove({}, function(err) { 
      console.log('craigslist object collection emptied');
      res.redirect('/');
  });
};





