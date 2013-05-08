var scrapi = require('scrapi');

// general example manifest
var manifest = {
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
      }
    }
  }
};

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

// basic out-of-box example
exports.scrapiTest1 = function(req, res){
  var api = scrapi(manifest);
  api('eby/apa/3762023833.html').get(function (err, json) {
    if(err)
      console.log("Error using scrapi: ", err);
    console.log(json);
  });
}

// working our way up: scraping listings from main page
exports.scrapiTest2 = function(req, res){
  var api = scrapi(linksManifest); 
  api('apa/').get(function (err, json){
    if(err)
      console.log("Error using scrapi: ", err);
    console.log(json);
  });
}

// trying to refine our search and query each one for info 
exports.scrapiTest3 = function(req, res){
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
          console.log("Latitude: ", listingJSON.lat, listingJSON.lon);
        });
      }
    }
  });
}


exports.displayModalTest = function(req, res){
  res.render('modalTesting');
}





