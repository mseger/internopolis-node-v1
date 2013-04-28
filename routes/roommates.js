var User = require('../models/User')
var async = require('async')

exports.displaySurvey = function(req, res){
	res.render('roommates', {title: "Roommate Finder", currUser: req.session.user});
}

exports.calculateAndDisplayOptions = function(req, res){
	// only display friends who actually fit the relevant criteria
	var currUser = User.findOne({name: req.session.user.name}).exec(function (req2, user){
		var friendList = user.friends; 
		for(var i=0; i<friendList.length; i++){
			req.facebook.api("/" + friendList[i].id + "?fields=id,name,location", function (err, friend){
				if(err)
					console.log("Error looking up friend: ", err);
				console.log("FRIEND: ", friend.location);
			});
		}
		//res.redirect('/roommates');
	});
}


// using async to grab and display relevant Facebook friends  
exports.asyncRoommateCalculation = function(req, res){
	var roommateFits = [];
  	async.auto({
      calculating_matches: function(callback){
	 	// look up user, look up their friends
	 	console.log("Entering step 1");
		var currUser = User.findOne({name: req.session.user.name}).exec(function (req2, user){
			var friendList = user.friends; 
			async.each(friendList, function(item, next){
				req.facebook.api("/" + item.id + "?fields=id,name,location", function (err, friend){
					if(err)
						console.log("Error looking up friend: ", err);
					if(friend.location != undefined){
						roommateFits.push(friend.location);
						next();
					}else{
						next();
					}
				});
			}, callback);
		});  
	}, 
      displaying_matches: ["calculating_matches", function(callback, results){
        callback(null, 'done');
      }]
  }, function (err, result) {
      console.log("Finished async house scraping + displaying");   
  });
}