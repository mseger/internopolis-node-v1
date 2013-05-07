var mongoose = require('mongoose'), Schema = mongoose.Schema

var HousingListingSchema = new Schema({
	listing_title: String, 
	listing_URL: String, 
	price: String, 
	area: String, 
	description: String, 
	image_URLs: [], 
	address: String, 
	lat: Number, 
	lon: Number,
	timestamp: Number 
});

var HousingListing = mongoose.model('HousingListing', HousingListingSchema);

module.exports = HousingListing;


