var User = require('../models/User')
var Group = require('../models/Group')
var FBOnlyUser = require('../models/user_FB_only')
var async = require('async')

/*exports.displayHome = function(req, res){
	res.render('home', {title: "Home"});
}*/


exports.displayHome = function(req, res){
	var allGroups = [];
	var currUser = User.findOne({name: req.session.user.name}).populate(['starred_roommates', 'groups']).exec(function (err, user){
		if(err)
			console.log("Unable to display user's home: ", err);
		async.each(user.groups, function (item, next){
			Group.findOne({group_name: item.group_name}).populate(['creator', 'members', 'group_starredRoommates', 'group_starredHousing']).exec(function (err, group){
				allGroups.push(group);
				next();
			});
		}, function(){
			res.render('home', {title: "Home", starred_roommates: user.starred_roommates, groups: allGroups});
		});
	});
}

