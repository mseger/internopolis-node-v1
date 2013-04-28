var User = require('../models/User')

exports.displaySurvey = function(req, res){
	res.render('roommates', {title: "Roommate Finder", currUser: req.session.user});
}

exports.calculateAndDisplayOptions = function(req, res){
	// only display friends who actually fit the relevant criteria
}