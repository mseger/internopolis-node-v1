var User = require('../models/User')
var FBOnlyUser = require('../models/user_FB_only')
var async = require('async')

/*exports.displayHome = function(req, res){
	res.render('home', {title: "Home"});
}*/


exports.displayHome = function(req, res){
	var currUser = User.findOne({name: req.session.user.name}).populate(['starred_roommates', 'groups']).exec(function (err, user){
		console.log("THE USER'S GROUPS ARE: ", user.groups);
		if(err)
			console.log("Unable to display user's home: ", err);
		res.render('home', {title: "Home", starred_roommates: user.starred_roommates, groups: user.groups});
	});
}
