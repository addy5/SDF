//**** BRING IN ALL REQUIRE PACKAGES *********
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

//******* CREATE USER SCHEMA ********
var UserSchema = new Schema({
  firstName : String,
  lastName : String,
  email : { type: String, required: true, index: {unique:true} },
  password : { type: String, required: true, select: false }
});

//****** RUN THIS FUNCTION WHENEVER SAVING USER TO DATABASE ***
UserSchema.pre('save', function(next){
  var user = this;

  //EXIT IF PW HAS NOT BEEN MODIFIED:
  if(!user.isModified('password')) return next();

  //GENERATE SALT / HASH FOR PASSWORD BEFORE SAVING TO DB:
  bcrypt.hash(user.password, null, null, function(err, hash){
    if(err) return next(err);
    //CHANGE PW TO HASH
    user.password = hash;
    next();
  });
});

//**** METHOD TO COMPARE PW WITH CURRENT DB PASSWORD (AUTHENTICATION) **
UserSchema.methods.comparePassword = function(password){
  var user = this;

  return bcrypt.compareSync(password, user.password);
};

//******* EXPORT THE USER MODE ********
module.exports = mongoose.model("User", UserSchema);
