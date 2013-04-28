var mongoose = require('mongoose'), Schema = mongoose.Schema

var UserSchema = new Schema({
	name: String, 
	profPicURL: String, 
	friends: [],
	roommate_matches: [], 
	lastSearchedCity: String
});

var User = mongoose.model('User', UserSchema);

module.exports = User; 