var User = require('../models/user')
var Group = require('../models/group')
var async = require('async')
var FBOnlyUser = require('../models/user_FB_only')
var HousingListing = require('../models/housingListing');

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

// star a roommate and add it to a particular group
exports.addStarredRoommate = function(req, res){
	currGroup = Group.findOne({_id: req.body.group_id}).populate('group_starredRoommates').exec(function (err, group){
		if(err)
			console.log("Could not find the requested group to add starred roommate: ", err);
		var starredRoommates = group.group_starredRoommates; 

		// look up or create an FBOnlyUser
		var fbUser = FBOnlyUser.findOne({FBID: req.body.user_FBID}).exec(function (err, FBUser){
			if(err)
				console.log("Error in retrieving FBUser: ", err);
			starredRoommates.push(FBUser);
			group.starred_roommates = starredRoommates;
			group.save(function (err){
				if(err)
					console.log("Unable to save updated group: ", err);
				console.log("Successfully added starred roommate to group!");
				res.redirect('/roommates');
			});
		});
	});
}

// star a housing listing and add it to a particular group
exports.addStarredHousingListing = function(req, res){
	currGroup = Group.findOne({_id: req.body.group_id}).populate('group_starredHousing').exec(function (err, group){
		if(err)
			console.log("Could not find the requested group to add starred roommate: ", err);
		var starredHousing = group.group_starredHousing; 

		// look up or create an FBOnlyUser
		var theListing= HousingListing.findOne({_id: req.body.housing_id}).exec(function (err, listing){
			if(err)
				console.log("Error in retrieving HousingListing: ", err);
			starredHousing.push(listing);
			group.group_starredHousing= starredHousing;
			group.save(function (err){
				if(err)
					console.log("Unable to save updated group: ", err);
				console.log("Successfully added starred housing listing to group!");
				res.redirect('/housing');
			});
		});
	});
}






