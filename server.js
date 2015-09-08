//CALL NPM PACKAGES:
require('dotenv').load();
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 8080;
var User = require('./models/user.js');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

var mongoose = require('mongoose');

//SET PORT FOR REOMTE OR LOCAL:
app.set('port', process.env.PORT || 8080);

//BRING IN USER ROUTE:
var userRoutes = require('./config/userRoutes');

//BRING IN SYGNS ROUTE:
var sygnRoutes = require('./config/sygnRoutes');

//TOKEN CONFIGURATION:
var superSecret = 'iamtherealbatman';

//CONNECT OUR DATABASE:
var mongodbUri = 'mongodb://addy:password@ds033123.mongolab.com:33123/sygns_db';
mongoose.connect(mongodbUri);

//USE PUBLIC FOLDER FOR ANY FILE REQUESTS:
app.use(express.static(__dirname + '/public'));

//APP MIDDLEWARE CONFIGURATIONS:
app.use(bodyParser.urlencoded( {extended : true} ));
app.use(bodyParser.json());
app.use(cookieParser());

//ALLOW ACCESS FORM OTHER SERVERS:
app.use(function(req,res,next){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','Get,Post');
  res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type, Authorization');
  next();
});

//LOGGER FOR SERVER REQUESTS:
app.use(morgan('dev'));

//HOMEPAGE / MAIN MAP PAGE ROUTER:
app.get('/', function(req,res){
    res.sendfile("./views/index.html");
});

//RESPONSE TO LOG IN HELP REQUEST:
app.get('/help', function(req,res){
    res.sendfile('./views/help_view.html');
});

//RESPONSE TO LOG IN SIGNUP REQUEST:
app.get('/signup', function(req,res){
  res.sendfile('./views/signUp.html');
});

// //RESPONSE TO LOG IN PAGE REQUEST:
// app.get('/login', function(req,res){
//     res.sendfile('./views/index.html');
// });

//REGISTER THE USERS ROUTE:
app.use('/users', userRoutes);

//REGISTER THE SYGNS ROUTE:
app.use('/sygns',sygnRoutes);

//ROUTE TO AUTHENTICATE / LOG IN A USER AND REDIRECT:
app.post('/authenticate',function(req,res){
  User.findOne({email: req.body.email}).select('email firstName password').exec(function(err,user){
    if(err) throw err;

    //HANDLE IF NO USER FOUND:
    if(!user){
      res.json({success: false, message: 'Invalid email', redirect: '/login'});
    } else {
      //VALIDATE PASSWORD TO MATCH USER:
      var validPW = user.comparePassword(req.body.password);
      if (!validPW){
        res.json({success: false, message: 'Invalid password', redirect: '/login'});
      } else {
        //CREATE TOKEN NOW THAT USER FOUND AND PW CLEARS:
        console.log('user found and password verified, creating token..');
        var token = jwt.sign({
          email: user.email,
          firstName: user.firstName },
          superSecret,
          { expiresInMinutes: 1440 }
        );
        //RETURN RESPONSE WITH TOKEN COOKIE AND REDIRECT:
        res.cookie("token",token);
        res.json({success: true, message: 'enjoy your token', access_token: token, redirect: '/map'});
      }
    }

  }); //END FIND USER AND CONFIRM PW
}); //END AUTHENTICATE ROUTE AND FUNCTION


//MIDDLEWARE CHECK FOR TOKEN AUTHORIZATION TO PROCEED TO RESTRICTED ROUTES:
app.use(function(req,res,next){
  //LOG A NEW REQ:
  console.log("Someone just requested a restricted route");

  //CHECK FOR ACTIVE TOKEN IN URL OR POST PARAMS:
  var token = req.cookies.token || req.body.token || req.param('token') || req.headers['x-access-token'];

  //DECODE TOKEN:
  if(token){

    //VERIFY SECRET AND CHECK TOKEN EXPIR:
    jwt.verify(token, superSecret, function(err, decoded){
      if(err){
        res.status(403).send({success: false, message: 'failed to authen token'});
      } else {
        //IF TOKEN IS VALID AND ACTIVE, SAVE IN REQUEST TO USE LATER:
        req.decoded = decoded;
        next(); //MOVE ON NEXT ACTION
      }
    });
  } else {
    //IF THERE IS NO TOKEN, RETURN ACCESS FORBIDDEN RESPONSE:
    return res.redirect('/');
    // return res.status(403).send({success: false, message: 'no token provided'});
  }

});

//ROUTE TO MAP AFTER SUCCESSFUL LOGIN:
app.get('/map', function(req,res){
  res.sendfile('./views/map_index.html');
});

//EDIT ACCOUNT PAGE ROUTER:
app.get('/edit', function(req,res){
  res.sendfile('./views/edit.html');
});

//APP TO LISTEN ON PORT 8080:
app.listen(app.get('port'), function(){
  console.log("server started on", app.get('port'));
});
