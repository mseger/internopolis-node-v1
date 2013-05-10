var User = require('../models/user')
var FBOnlyUser = require('../models/user_FB_only')

// login a new user, start a new session
exports.login = function (req, res) {
  req.facebook.api('/me', function(err, data){
  	req.facebook.api('/me/friends?fields=id,name,location', function(err, friendData){
  		req.facebook.api('/me/picture?redirect=false&type=large', function(err, picData){
	  		var existentUser = User.findOne({name: data.name}, function (err, user){
	  			if(user){
	  				req.session.user = user;
	  				res.redirect('/home');
		  		}else{
		  			var loggedInUser = new User({name: data.name, profPicURL: picData.data.url, friends: friendData.data, groups: [], roommate_matches: [], housing_listings: [], starred_roommates: [], starred_housingListings: [], lastSearchedCity: ""});
		  			loggedInUser.save(function (err){
			  			if(err)
			  				console.log("Unable to save new user.");
			  		 	req.session.user = loggedInUser; 
			  			res.redirect('/home');
		  			});
		  		}
		  	});
	  	});
  	});
  });
};

// logout of your account
exports.logout = function(req, res){
	req.session.user = null;
	res.redirect('/');
}

// delete all users
exports.delete_all = function(req, res){
	// clears out your list so you can start from scratch
	User.remove({}, function(err) { 
   		console.log('user collection removed');
   		res.redirect('/');
	});
};

// delete all FBOnlyUsers
exports.delete_all_FBOnlyUsers = function(req, res){
	// clears out your list so you can start from scratch
	FBOnlyUser.remove({}, function(err) { 
   		console.log('FBOnly user collection removed');
   		res.redirect('/');
	});
};