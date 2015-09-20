//**** CALL NPM PACKAGES AND MODELS FOR FUNCTIONS ***
var User = require('../models/user.js');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var request = require('request');

var arrayOfStocks = [];
var currentValues = {};

//CREATE CURRENT DATE VARIABLE:
var date = new Date();
var day = date.getDate();
var year = date.getFullYear();
var month = date.getMonth() + 1;
if(month < 10){
  month = '0' + month.toString();
} else {
  month = month.toString();
}
if(day < 10){
  day = '0' + day.toString();
} else {
  day = day.toString();
}
year = year.toString();
var today = month + "-" + day + "-" + year;
//END CREATE TODAY FUNCTION

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
    //CREATE TOKEN NOW THAT USER FOUND AND PW CLEARS:
    console.log('user created successfully, creating token..');
    var token = jwt.sign({
      email: user.email,
      firstName: user.firstName },
      superSecret,
      { expiresInMinutes: 1440 }
    );
    //RETURN RESPONSE WITH TOKEN COOKIE AND REDIRECT:
    res.cookie("token",token);
    res.json({success: true, message: 'enjoy your token', access_token: token, redirect: '/map'});
  });

} //CLOSE CREATE NEW USER FUNCTION

//****** SHOW All USERS ***********
function getAll(req,res,logThis){
  User.find({}, function(err, users){
    if(err) res.send(err);

    //GET EOD BALANCE FOR EACH USER:
    for(i=0; i< users.length; i++){
      var user = users[i];

      for(var h=0; h < user.holdings.length; h++){
        if(arrayOfStocks.indexOf(user.holdings[h].symbol) === -1){
          arrayOfStocks.push(user.holdings[h].symbol);
        }
      } //CLOSE PUSHING OF ALL STOCKS LIST
    } //CLOSE LOOP THROUGH ALL USERS TO GET ALL STOCKS

    //GET ACTUAL QUOTE FOR EACH STOCK IN STOCK ARRAY:
    // for(n=0; n < arrayOfStocks.length;n++){
    //   getPrice(arrayOfStocks[n]);
    // }

    arrayOfStocks.forEach(function(stock){
      getPrice(stock);
    });

    function logStocks(){
      console.log(currentValues);
      for(d=0; d < users.length; d++){
        var user = users[d];
        var todayBalance = user.balance;
        for(p=0; p < user.holdings.length; p++){
          todayBalance = todayBalance + (currentValues[user.holdings[p].symbol] * parseInt(user.holdings[p].volume) );
        }
        user.history.push([today, todayBalance]);
        user.save(function(err){
          if(err) console.log(err);
        });
      } //END LOOP THROUGH ALL USERS
    } //END LOGSTOCK FUNCTION TO SAVE EOD BALANCE TO HISTORY

    // setTimeout(logStocks,2000);
    logStocks();
    res.json(users);
  });
} //CLOSE GET ALL USERS FUNCTION


function getPrice(symbol){
  var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20(%22'+symbol+'%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
  request(url, function(error, response, body){
    var data = JSON.parse(body);
    var holdingValue = parseFloat(data.query.results.quote.LastTradePriceOnly);
    currentValues[symbol] = holdingValue;
    // console.log(currentValues);
  });
}

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

        console.log('found user');
        console.log(req.decoded.email);
        if(err) res.send(err);

        //UPDATE USER PARAMETERS ONLY IF PROVIDED:
        if(req.body.firstName) user.firstName = req.body.firstName;
        if(req.body.lastName) user.lastName = req.body.lastName;
        if(req.body.email) user.email = req.body.email;
        if(req.body.password) user.password = req.body.password;
        if(req.body.purchase){
          //PARSE PURCHASE OBJECT FEES TO UPDATE USER INFO:
          var parseFees =  req.body.purchase.totalFees.replace('$','');
          var invoice = parseFloat(parseFees);

          //UPDATE USER HOLDINGS IF SUFFICIENT BALANCE:
          if (user.balance < invoice){
            return res.json({message: 'insufficient funds', redirect:"/map"});
          }
          user.balance = user.balance - invoice;
          user.holdings.push(req.body.purchase);
        } // END PURCHASE SAVE FUNCTION

        if(req.body.sell){
          var holdingToSell;
          var holdingNumber;

          //LOCATE SPECIFIC STOCK TO BE SOLD:
          for(var h=0; h < user.holdings.length; h++){

            holdingToSell = user.holdings[h];

            if( holdingToSell.date === req.body.sell.originalBuyDate && holdingToSell.price === req.body.sell.originalBuyPrice && holdingToSell.symbol === req.body.sell.symbol){

            holdingNumber = h;
            h = user.holdings.length;

              if( parseInt(req.body.sell.shares) > parseInt(holdingToSell.volume)){
                res.json({message: 'error', redirect:"/map"});
              }

              //PARSE PURCHASE OBJECT FIGURES TO UPDATE USER INFO:
              var netSale =  req.body.sell.net.replace('$','');
              var salePrice = parseFloat(netSale);
              var newVolume = (parseInt(holdingToSell.volume) - parseInt(req.body.sell.shares)).toString();
              console.log(newVolume);

              // MODIFY USER:
              user.balance = user.balance + salePrice;
              // user.holdings[holdingNumber].volume = ( parseInt(user.holdings[holdingNumber].volume) - parseInt(req.body.sell.shares) ).toString();
              user.holdings.push({
                symbol: holdingToSell.symbol,
                name: holdingToSell.name,
                price: holdingToSell.price,
                volume: newVolume,
                subTotal: holdingToSell.subTotal,
                tradeFee: holdingToSell.tradeFee,
                oddLotFee: holdingToSell.oddLotFee,
                totalFees: holdingToSell.totalFees,
                date: holdingToSell.date
              });

              user.holdings.splice(holdingNumber,1);

            } // END STORING SPECIFIC STOCK TO SELL
          } //END LOOP THROUGH USE HOLDINGS SEARCH FOR SPECIFIC STOCK

        } //END IF THERE IS A SELL REQUEST


        //SAVE UPDATED USER INFORMATION:
        user.save(function(err){
          if(err) res.send(err);
          res.json({message: 'successfully updated', redirect: '/map', user:user});
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
