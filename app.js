/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , splash = require('./routes/splash')
  , home = require('./routes/home')
  , group = require('./routes/group')
  , roommates = require('./routes/roommates')
  , googleMapsTest = require('./routes/googleMapsTest')
  , scrapiTest = require('./routes/scrapiTest')
  , housing = require('./routes/housing')
  , mongoose = require('mongoose')
  , Facebook = require('facebook-node-sdk');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(Facebook.middleware({appId: process.env.FACEBOOK_APPID, secret: process.env.FACEBOOK_SECRET}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
  mongoose.connect(process.env.MONGOLAB_URI || 'localhost');
});

// global for FB permissions
global.scope = ['read_friendlists', 'publish_stream', 'friends_location'];

// GETS
app.get('/', splash.splashLoginPage);
app.get('/login', Facebook.loginRequired({scope: scope}), user.login);
app.get('/users/delete_all', user.delete_all);
app.get('/roommates', Facebook.loginRequired({scope: scope}), roommates.displaySurvey);
app.get('/roommates/search', Facebook.loginRequired({scope: scope}), roommates.asyncRoommateCalculation);
app.get('/housing', Facebook.loginRequired({scope: scope}), housing.asyncHouseScrape);
app.get('/housing/delete_all', housing.delete_all);
app.get('/home', Facebook.loginRequired({scope: scope}), home.displayHome);
app.get('/FBOnlyUsers/delete_all', user.delete_all_FBOnlyUsers);
app.get('/groups/delete_all', group.delete_all);
app.get('/groups/deleteAll_currUser', Facebook.loginRequired({scope: scope}), group.delete_currUser_groups);
app.get('/group/:group_id', Facebook.loginRequired({scope: scope}), group.display);


// PUTS
app.post('/login', Facebook.loginRequired({scope: scope}), user.login);
app.post('/logout', Facebook.loginRequired(), user.logout);
app.post('/roommates/search', Facebook.loginRequired({scope: scope}), roommates.asyncRoommateCalculation);
app.post('/starred_roommates/add', Facebook.loginRequired({scope: scope}), roommates.addStarredRoommate);
app.post('/group/new', Facebook.loginRequired({scope: scope}), group.create);
app.post('/group/:id/remove', Facebook.loginRequired({scope: scope}), group.removeIndividualGroup);
app.post('/starred_roommates/addToGroup', Facebook.loginRequired({scope: scope}), group.addStarredRoommate);
app.post('/starred_housing/addToGroup', Facebook.loginRequired({scope: scope}), group.addStarredHousingListing);
app.post('/group/:group_id', Facebook.loginRequired({scope: scope}), group.display);


// TESTS
app.get('/mapsTest', googleMapsTest.mapsTest2);
app.get('/scrapiTest', scrapiTest.scrapiTest3);
app.get('/asyncScrapeTest', housing.asyncHouseScrape);
app.get('/modalTesting', scrapiTest.displayModalTest);
app.get('/fbInviteTest', Facebook.loginRequired({scope: scope}), group.fbInviteTest); 

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
