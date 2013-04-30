var mongoose = require('mongoose'), Schema = mongoose.Schema

var FBOnlyUserSchema = new Schema({
	name: String, 
	FBID: Number,
	profileURL: String,  
	profPicURL: String, 
	location: String
});

var FBOnlyUser = mongoose.model('FBOnlyUser', FBOnlyUserSchema);

module.exports = FBOnlyUser; 