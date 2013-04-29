var scrapi = require('scrapi')
var async = require('async')
var HousingListing = require('../models/housingListing')
var User = require('../models/User')

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
          if((listings.length) >0 && listings[0].timestamp- time < 3600000){
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
	          var newHousingListing = new HousingListing({description: currListing.description, image_URLs: currListing.images, address: currListing.address, lat: currListing.lat, lon: currListing.lon, timestamp: currTime});
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

// delete all housing listings
exports.delete_all = function(req, res){
  // clears out your list so you can start from scratch
  HousingListing.remove({}, function(err) { 
      console.log('housing collection emptied');
      res.redirect('/');
  });
};





