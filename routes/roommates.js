var User = require('../models/User')
var async = require('async')

exports.displaySurvey = function(req, res){
	res.render('roommates', {title: "Roommate Finder", currUser: req.session.user, matches: req.session.user.roommate_matches});
}

exports.calculateAndDisplayOptions = function(req, res){
	// only display friends who actually fit the relevant criteria
	var currUser = User.findOne({name: req.session.user.name}).exec(function (req2, user){
		var friendList = user.friends; 
		for(var i=0; i<friendList.length; i++){
			req.facebook.api("/" + friendList[i].id + "?fields=id,name,location", function (err, friend){
				if(err)
					console.log("Error looking up friend: ", err);
			});
		}
	});
}


// using async to grab and display relevant Facebook friends  
exports.asyncRoommateCalculation = function(req, res){
	var roommateFits = [];
	var currUser; 
  	async.auto({
	      calculating_matches: function(callback){
		 	// look up user, look up their friends
			currUser = User.findOne({name: req.session.user.name}).exec(function (req2, user){
				var friendList = user.friends; 
				async.each(friendList, function(item, next){
					if(item.location && item.location.name.split(',')[0] == req.body.city){
						roommateFits.push(item);
					}
					next();
				}, callback);
			});  
		}, 
		  saving_matches: ["calculating_matches", function(callback){
		  	console.log("Made it into saving_matches");
		  	var userToUpdate = User.findOne({name: req.session.user.name}).exec(function (req3, toUpdate){
		  		toUpdate.roommate_matches = roommateFits;
		  		toUpdate.lastSearchedCity = req.body.city;
		  		toUpdate.save(function (err){
		  			if(err)
		  				console.log("Unable to save matches list");
		  			callback(null);
		  		});
		  	});
		  }], 
	      displaying_matches: ["saving_matches", function(callback, results){
	        console.log("Made it into displaying_matches");
	        res.render('_roommate_results', {currUser: req.session.user, matches: roommateFits});
	        callback(null, 'done');
	      }]
	  }, function (err, result) {
	      console.log("Finished async house scraping + displaying");   
  	});
}