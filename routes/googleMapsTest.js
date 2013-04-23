var gm = require('googlemaps');
var util = require('util');

exports.mapsTest1 = function(req, res){	
	gm.reverseGeocode('41.850033,-87.6500523', function(err, data){
	  console.log("Reverse geocoded data 1 is: ", JSON.stringify(data));
	  res.redirect('/users');
	});
}

exports.mapsTest2 = function(req, res){
	markers = [
    { 'location': '300 W Main St Lock Haven, PA' },
    { 'location': '444 W Main St Lock Haven, PA',
        'color': 'red',
        'label': 'A',
        'shadow': 'false',
        'icon' : 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=cafe%7C996600'
    	}
	]

	styles = [
	    { 'feature': 'road', 'element': 'all', 'rules': 
	        { 'hue': '0x00ff00' }
	    }
	]

	paths = [
	    { 'color': '0x0000ff', 'weight': '5', 'points': 
	        [ '41.139817,-77.454439', '41.138621,-77.451596' ]
	    }
	]

	util.puts(gm.staticMap('444 W Main St Lock Haven PA', 15, '500x400', false, false, 'roadmap', markers, styles, paths));
}