//**** CALL NPM PACKAGES AND MODELS FOR FUNCTIONS ***
var User = require('../models/user.js');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');

//**** TOKEN CONFIG ***********
var superSecret = 'iamtherealbatman';

//**** CREATE USER ***********
function createUser(req,res){
  var user = new User();

  //SET USER INFO FROM REQUEST:
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.email = req.body.email;
  user.password = req.body.password;

  //SAVE USER AND CHECK FOR ERRORS:
  user.save(function(err){
    if(err){
      if(err.code == 11000){
        return res.json({success: false, message: 'user already exist'});
      } else{
        res.send(err);
      }
    }
    res.json({message:"successful", redirect:"/"});
  });

} //CLOSE CREATE NEW USER FUNCTION

//****** SHOW All USERS ***********
function getAll(req,res){
  User.find({}, function(err, users){
    if(err) res.send(err);
    res.json(users);
  });
} //CLOSE GET ALL USERS FUNCTION


//****** GET AND SHOW INDIVIDUAL USER ***********
function showUser(req,res){
  console.log("individual user requested");

  var token = req.cookies.token || req.body.token || req.param('token') || req.headers['x-access-token'];
  var decodedInfo;

  if(token){

    //VERIFY SECRET AND CHECK TOKEN EXPIRATION:
    jwt.verify(token, superSecret, function(err, decoded){
      if(err){
        res.status(403).send({success: false, message: 'failed to authen token'});
      } else {
        //IF TOKEN IS VALID AND ACTIVE, SAVE FOR OTHER ROUTES TO USE:
        req.decoded = decoded;
        decodedInfo = decoded;
      }

      //FIND USER AND SHOW INFO:
      User.findOne({email: decodedInfo.email}, function(err, user){
        if(err) res.send(err);
        console.log(user);
        res.json(user);
      });
    }); //CLOSE TOKEN VALIDATION CHECK
  } //CLOSE TOKEN CHECK
} //CLOSE SHOW USER FUNCTION

//******** UPDATE INDIVIDUAL USER ********
function updateUser(req,res){
  console.log("edit individual user requested");

  var token = req.cookies.token || req.body.token || req.param('token') || req.headers['x-access-token'];
  var decodedInfo;

  if(token){

    //VERIFY SECRET AND CHECK TOKEN EXPIRATION:
    jwt.verify(token, superSecret, function(err, decoded){
      if(err){
        res.status(403).send({success: false, message: 'failed to authen token'});
      } else {
        //IF TOKEN IS VALID AND ACTIVE, SAVE FOR OTHER ROUTES TO USE:
        req.decoded = decoded;
        decodedInfo = decoded;
        console.log(decodedInfo.email + "$$$$$");
      }

      User.findOne({email: decodedInfo.email}, function(err, user){

        console.log('found him');
        console.log(req.decoded.email);
        if(err) res.send(err);

        //UPDATE USER PARAMETERS ONLY IF PROVIDED:
        if(req.body.firstName) user.firstName = req.body.firstName;
        if(req.body.lastName) user.lastName = req.body.lastName;
        if(req.body.email) user.email = req.body.email;
        if(req.body.password) user.password = req.body.password;

        //SAVE UPDATED USER INFORMATION:
        user.save(function(err){
          if(err) res.send(err);
          res.json({message: 'successfully updated', redirect:"/edit"});
        });
      });

    }); //CLOSE TOKEN VALIDATION CHECK
  } //CLOSE TOKEN CHECK
} //CLOSE UPDATE USER FUNCTION

//*********  DELETE USER  ***********
function deleteUser(req,res){
  User.remove({ email: req.params.email}, function(err){
    if(err) res.send(err);
    res.json({message: 'successfully deleted', redirect: '/'});
  });
} //CLOSE DELETE USER FUNCTION


//********* EXPORT USER FUNCTIONS *********
module.exports = {
  getAll: getAll,
  createUser: createUser,
  showUser: showUser,
  updateUser: updateUser,
  deleteUser: deleteUser
};
