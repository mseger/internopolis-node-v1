var mongoose = require('mongoose'), Schema = mongoose.Schema

var GroupSchema = new Schema({
	group_name: String, 
	creator: {type: Schema.Types.ObjectId, ref: 'User'}, 
	members: [{type: Schema.Types.ObjectId, ref: 'User'}],
	group_starredRoommates: [{type: Schema.Types.ObjectId, ref: 'FBOnlyUser'}],  
	group_starredHousing: [{type: Schema.Types.ObjectId, ref: 'HousingListing'}] 
});

var Group = mongoose.model('Group', GroupSchema);

module.exports = Group; 