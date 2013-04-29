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

// PUTS
app.post('/login', Facebook.loginRequired({scope: scope}), user.login);
app.post('/logout', Facebook.loginRequired(), user.logout);
app.post('/roommates/search', Facebook.loginRequired({scope: scope}), roommates.asyncRoommateCalculation);


// TESTS
app.get('/mapsTest', googleMapsTest.mapsTest2);
app.get('/scrapiTest', scrapiTest.scrapiTest3);
app.get('/asyncScrapeTest', housing.asyncHouseScrape);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
