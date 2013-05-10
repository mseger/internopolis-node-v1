var User = require('../models/user')
var FBOnlyUser = require('../models/user_FB_only')
var async = require('async')

exports.displaySurvey = function(req, res){
	User.findOne({name: req.session.user.name}).populate(['roommate_matches', 'groups']).exec(function (err, user){
		if(err)
			console.log("Unable to display user's home: ", err);
		res.render('roommates', {title: "Roommate Finder", currUser: req.session.user, matches: user.roommate_matches, groups: user.groups});
	});
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
	var user_groups; 
  	async.auto({
	      calculating_matches: function(callback){
		 	// look up user, look up their friends
			currUser = User.findOne({name: req.session.user.name}).populate('groups').exec(function (req2, user){
				var friendList = user.friends; 
				user_groups = user.groups;
				async.each(friendList, function(item, next){
					if(item.location && item.location.name.split(',')[0] == req.body.city){
						var newFBUser = new FBOnlyUser({name: item.name, FBID: item.id, profileURL: item.link, profPicURL: "https://graph.facebook.com/"+ item.id +"/picture?type=large", location: item.location.name});
						newFBUser.save(function (err){
							if(err)
								console.log("Couldn't save new FBUser");
							roommateFits.push(newFBUser);
						});
					}
					next();
				}, callback);
			});  
		}, 
		  saving_matches: ["calculating_matches", function(callback){
		  	var userToUpdate = User.findOne({name: req.session.user.name}).exec(function (req3, toUpdate){
		  		toUpdate.roommate_matches = roommateFits;
		  		toUpdate.lastSearchedCity = req.body.city;
		  		toUpdate.save(function (err){
		  			if(err)
		  				console.log("Unable to save matches list", err);
		  			callback(null);
		  		});
		  	});
		  }], 
	      displaying_matches: ["saving_matches", function(callback, results){
	        res.render('roommates', {title: "Roommate Matches", currUser: req.session.user, matches: roommateFits, groups: user_groups});
	        callback(null, 'done');
	      }]
	  }, function (err, result) {
	      console.log("Finished async house scraping + displaying");   
  	});
}

// add a roommate to your starred roommates list
exports.addStarredRoommate = function(req, res){
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

// star a roommate and add it to a particular group
exports.addToGroup = function(req, res){
	
}




