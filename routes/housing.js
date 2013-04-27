var scrapi = require('scrapi')
var async = require('async')
var HousingListing = require('../models/housingListing')


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
          	console.log("Successful Save: ", newHousingListing.address);
          });
        });
      }
    }
  });
}

// using async to scrape and display properly 
exports.asyncHouseScrape = function(req, res){
	var allListings = [];
  async.auto({
      clearing_listings: function(callback){
        HousingListing.remove({}, function(err){
        	if(err)
        		console.log("Unable to purge HousingListing DB: ", err);
          // if successful
          callback(null);    
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
	          var newHousingListing = new HousingListing({description: currListing.description, image_URLs: currListing.images, address: currListing.address, lat: currListing.lat, lon: currListing.lon});
	          newHousingListing.save(function(err){
	            if(err)
	              console.log("Couldn't save new housing listing: ", err);
	            next(null);
            });
          }, function (err, results) {
            // all done with each of them
            callback(null, results);
          });
			}],
      displaying_listings: ["mapping_listings", function(callback, results){
        res.redirect('/');
        callback(null, 'done');
      }]
  }, function (err, result) {
      console.log("Finished async house scraping + displaying");   
  });
}