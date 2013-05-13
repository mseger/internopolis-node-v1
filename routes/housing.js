var scrapi = require('scrapi')
var async = require('async')
var HousingListing = require('../models/housingListing')
var CraigslistObject = require('../models/craigslistObject')
var User = require('../models/user')
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
        },  
      titles: {
        "$query": ".pl a", 
        "$each":{
          "title": "(text)"
          } 
        }, 
      prices: {
        "$query": ".pnr .price", 
        "$each": {
          "price": "(text)"
          }
        }, 
      areas: {
        "$query": ".pnr small",
        "$each": {
          "area": "(text)"
          }
        }
      }
    }
  };

// for each individual listing
var individualManifest = {
  "base": "http://sfbay.craigslist.org",
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


// using async to scrape and display properly 
exports.asyncHouseScrape = function(req, res){
	var allListings = [];
  var allListings_asObjects = [];
  var arr = [];

  async.auto({
      clearing_listings: function(callback){
        // if stored listings are recent enough, just surface those
        var userListings = User.findOne({name: req.session.user.name}).populate(['housing_listings', 'groups']).exec(function (err, user){
          if(err)
            console.log("Unable to retrieve housing listings for current user: ", err); 
          var time = Date.now();
          if((user.housing_listings).length != 0){
            res.render('displayHousing', {title: "Housing", housingOptions: user.housing_listings, groups: user.groups});
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

          // [link title price area]
          for (var i = 0; i < json.links.length; i++) {
            arr.push({
              link: json.links[i],
              listing_title: json.titles[i], 
              price: json.prices[i], 
              area: json.areas[i]
            });
          }
          callback(null);
        });
      }], 
      individual_listings: ["scraping_listings", function(callback){

		    // using scrapi to dig into each one of the individual listings
        async.each(arr, function(item, next){
		    	var link = item.link.href;
			     if((link != '#') && (link != undefined)){
		        // 28th character is the beginning of the listing-specific URL
		        var individualAPI = scrapi(individualManifest);

		        individualAPI(link).get(function (err, listingJSON){
		          if(err)
		            console.log("Error using second call of scrapi: ", err);
              allListings.push({
                link: item.link,
                listing_title: item.title,
                price: item.price, 
                area: item.area,
                listingJSON: listingJSON
              });
		          next();
			        });   
			      }else{
			      	next();
			      }
			    }, 
			    callback);
			}],
			mapping_listings: ["individual_listings", function(callback){
			    async.map(allListings, function (currListing, next) {
	          // create a new HousingListing entry 
            var currTime = Date.now();
            var parsed_imageURLs = [];
            for(var i=0; i< currListing.listingJSON.images.length; i++){
              if(currListing.listingJSON.images[i] != undefined){
                parsed_imageURLs.push(currListing.listingJSON.images[i].href);
              }
            }
            // NEED TO ADD LOGIC IN HERE TO PREVENT REPEAT LISTINGS

            // trying to beat my race condition here
            var currListingTitle = ""; 
            var currListingURL = ""; 
            var currListingPrice = ""; 
            var currListingArea = ""; 

            if(currListing.listing_title != undefined){
              currListingTitle = currListing.listing_title.title; 
            }

            if(currListing.link != undefined){
              currListingTitle = currListing.link.href; 
            }

            if(currListing.price != undefined){
              currListingPrice = currListing.price.price; 
            }

            if(currListing.area != undefined){
              currListingArea = currListing.area.area;
            }


	          var newHousingListing = new HousingListing({listing_title: currListingTitle, listing_URL: currListingURL, price: currListingPrice, area: currListingArea, description: currListing.listingJSON.description, image_URLs: parsed_imageURLs, address: currListing.listingJSON.address, lat: currListing.listingJSON.lat, lon: currListing.listingJSON.lon, timestamp: currTime});
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
        User.findOneAndUpdate({name: req.session.user.name}, {housing_listings: allListings_asObjects}).exec(function (err, currUser){
            if(err)
              console.log("Unable to save housing listings for user", err);
            currUser.save(function (err){
              if(err)
                console.log("Unable to save current user: ", err);
              callback(null);
            });
        });
      }],
      displaying_listings: ["updating_user_listings", function(callback, results){

        var currUser = User.findOne({name: req.session.user.name}).populate(['housing_listings', 'groups']).exec(function (err, user){
          res.render('displayHousing', {title: "Housing", housingOptions: user.housing_listings, groups: user.groups});
          callback(null, 'done');
        });
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
  HousingListing.remove().exec(function(err) { 
      console.log('housing collection emptied');
      res.redirect('/');
  });
};







