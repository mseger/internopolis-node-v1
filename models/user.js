var mongoose = require('mongoose'), Schema = mongoose.Schema

var UserSchema = new Schema({
	name: String, 
	profPicURL: String, 
	friends: [],
	groups: [{type: Schema.Types.ObjectId, ref: 'Group'}], 
	roommate_matches: [{type: Schema.Types.ObjectId, ref: 'FBOnlyUser'}], 
	housing_listings: [{type: Schema.Types.ObjectId, ref: 'HousingListing'}],
	starred_roommates: [{type: Schema.Types.ObjectId, ref: 'FBOnlyUser'}],
	starred_housingListings: [],
	lastSearchedCity: String
});

var User = mongoose.model('User', UserSchema);

module.exports = User; 