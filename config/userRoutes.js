//CALL NPM PACKAGES
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var userRouter = express();

var usersController = require('../controllers/usersController.js');

userRouter.route('/')

  // //GET
  //   .get(usersController.getAll)
  //
  //POST
    .post(usersController.createUser);


userRouter.route('/:email')

  //GET ONE USER
    .get(usersController.showUser)

  //PATCH USER
    .patch(usersController.updateUser)

  //DELETE USER
    .delete(usersController.deleteUser);

//EXPORTS
module.exports = userRouter;
