var mongoose = require('mongoose'), Schema = mongoose.Schema

var CraigslistObjectSchema = new Schema({
	title: String, 
	description: String,
	url: String, 
	timestamp: Number 
});

var CraigslistObject = mongoose.model('CraigslistObject', CraigslistObjectSchema);

module.exports = CraigslistObject;


