var User = require('../models/User')

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