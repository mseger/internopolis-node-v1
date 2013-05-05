var User = require('../models/User')
var Group = require('../models/Group')
var async = require('async')

exports.create = function(req, res){
	// create, save, post, and update new room
	User.findOne({name: req.session.user.name}).exec(function (err, user){
		// save and display the new group
		var newGroup = new Group({group_name: req.body.group_name, creator: user, members: [user], group_starredRoommates: [], group_starredHousing: []});
		newGroup.save(function (err){
			if (err)
				console.log("Error creating new group", err);
			// update the current user
			var currGroups = user.groups;
			currGroups.push(newGroup);
			user.groups = currGroups;
			user.save(function (err){
				if(err)
					console.log("Could not add new group to user's groups: ", err);
			res.redirect('/home');
			});
		});
	});
};