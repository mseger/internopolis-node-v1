var User = require('../models/user')
var Group = require('../models/group')
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

// delete all groups
exports.delete_all = function(req, res){
	// clears out your list so you can start from scratch
	Group.remove({}, function(err) { 
   		console.log('group collection removed');
   		res.redirect('/');
	});
};

// delete all groups for logged in user
exports.delete_currUser_groups = function(req, res){
	User.findOneAndUpdate({name: req.session.user.name}, {groups: []}).exec(function (err, user){
		if(err)
			console.log("Error deleting current user's groups: ", err);
		res.redirect('/');
	});
}

// remove an individual group from a user's list of groups
exports.removeIndividualGroup = function(req, res){
	User.findOne({name: req.session.user.name}).exec(function (err, user){
		var groupList = user.groups;
		var index = groupList.indexOf(req.body.id);
		groupList.splice(index, 1);
		user.groups = groupList; 
		user.save(function (err){
			if(err)
				console.log("Unable to remove group: ", err);
			res.redirect('/home');
		})
	})

}







