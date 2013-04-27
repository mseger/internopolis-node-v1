var mongoose = require('mongoose'), Schema = mongoose.Schema

var HousingListingSchema = new Schema({
	description: String, 
	image_URLs: [String], 
	address: String, 
	lat: Number, 
	lon: Number, 
});

var HousingListing = mongoose.model('HousingListing', HousingListingSchema);

module.exports = HousingListing;


