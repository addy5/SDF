//LOAD GOOGLE VISUALIZATION:
google.load("visualization", "1", {packages:["corechart"]});
var buyChart = $('#buyChart');

function drawChart(a,b,c,d,e) {

  buyChart.fadeIn('slow');

  var data = google.visualization.arrayToDataTable(
    [  ['Data', 'Price'],
   [ 'current', a],
   [ 'day_high', b],
   [ 'day_low', c],
   [ 'year_high', d],
   [ 'year_low', e]]
  );

  var options = {
    title: 'Security Price Overview',
    vAxis: {title: 'Price', minValue: 0},
    legend: 'none',
    colors: ['#009688']
  };

  var chart = new google.visualization.ScatterChart(document.getElementById('buyChart'));

  chart.draw(data, options);
}



//CAPITALIIZE PROTOTYPE FOR STRINGS (USED TO CAPITALIZE DAYS):
String.prototype.capitalize = function(){
  var wordNoFirstLetter = [];
  var firstLetter = this[0].toUpperCase();
  for(var i = 1; i < this.length; i+=1){
    wordNoFirstLetter.push(this[i]);
  }

  return(firstLetter + wordNoFirstLetter.join(""));
};


//****** JQUERY FUNCTIONS AND FUNCTION CALL AT PAGE LOAD ********
$(document).ready(function() {

    //DELETE COOKIE FUNCTION UPON LOGGING OUT:
    function delete_cookie( name ) {
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    //*** APPEND LOGIN OR LOG OUT BUTTON TO NAV DEPENDING IF COOKIES PRESENT:
    var ul = $('.navBar');
    var loginSpan = $('.login');

    if(document.cookie.indexOf("token") >= 0) {
      console.log("cookie here");

      //REMOVE LOGIN ELEMENTS IF USER IS ALREADY LOOGED IN:
      loginSpan.children(".userEmail").remove();
      loginSpan.children(".userPassword").remove();
      loginSpan.children(".loginButton").remove();

      //ADD LOGOUT BUTTON FOR LOGGED IN USERS:
      loginSpan.append('<a href="/login" class="logout"> <li class="navItem"> Logout  <li> </a>');

      //CREATE LOG OUT LISTENER FOR APPENDED LOGOUT TAB IN NAVBAR:
      $('.logout').on('click', function(){
        delete_cookie('token');
      });
    }

    //NAVBAR HIGHLIGHTER:
    $("li").mouseover(function(){
      $(this).css('backgroundColor',"rgba(0,150,136,1)");
    }).mouseout(function(){
      $(this).css('backgroundColor',"inherit");
    });

    //IMMEDIATE AJAX CALL TO FILL USER ACCOUNT INFO:
    var balance = $('.balance');
    $.ajax({
      method: "get",
      url: "/users/placeholder", //WILL BE USING TOKEN TO FIND USER IN CONTROLLER
      success: function(data){
        console.log(data);
        balance.text('$' + data.balance);
      }
    });

    //STOCK SEARCH LISTENER AND FUNCTIONS:
    var query = $('.query');
    var searchButton = $('.search');
    var symbol = $('.symbol');
    var name = $('.name');
    var price = $('.price');
    var volume = $('.volume');
    var dailyHigh = $('.dailyHigh');
    var dailyLow = $('.dailyLow');
    var yearlyHigh = $('.yearlyHigh');
    var yearlyLow = $('.yearlyLow');

    searchButton.on('click', runQuote);

    query.on('keypress', function (e) {
      var key = e.which || e.keyCode;
      if (key === 13) return runQuote();
      return null;
    });

    function runQuote(){
      var baseURL = 'https://query.yahooapis.com/v1/public/yql?q=';
      var queryParams = 'select * from yahoo.finance.quote where symbol in ("'+ query.val() +'")';
      var queryString = encodeURI(baseURL + queryParams);
      var apiCall = queryString + '&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

      $.getJSON(apiCall, function(data){
          console.log(data.query.results.quote);
          symbol.text(data.query.results.quote.Symbol);
          name.text(data.query.results.quote.Name);
          price.text(data.query.results.quote.LastTradePriceOnly);
          volume.text(data.query.results.quote.Volume);
          dailyHigh.text(data.query.results.quote.DaysHigh);
          dailyLow.text(data.query.results.quote.DaysLow);
          yearlyHigh.text(data.query.results.quote.YearHigh);
          yearlyLow.text(data.query.results.quote.YearLow);

          setTimeout(drawChart(parseFloat(data.query.results.quote.LastTradePriceOnly),parseFloat(data.query.results.quote.DaysHigh),parseFloat(data.query.results.quote.DaysLow),parseFloat(data.query.results.quote.YearHigh),parseFloat(data.query.results.quote.YearLow)),100);
        });

    }

    //BUY FUNCTIONS AND HANDLERS:
    var buyButton = $('.buyButton');
    var background = $('.background');
    var buyModal = $('.buyModal');
    var modalTitle = $('.modalTitle');
    var modalDetails = $('.modalDetails');
    var sharesInput = $('.sharesInput');
    var totalSummary = $('.totalSummary');
    var totalPrice = $('.totalPrice');
    var totalTradeFee = $('.totalTradeFee');
    var totalTrade = $('.totalTrade');
    var totalOddLot = $('.totalOddLot');
    var totalOddLotFee = $('.totalOddLotFee');
    var totalFees = $('.totalFees');
    var total = $('.total');

    var oddFee = 0;

    buyButton.on('click', function(){
      background.fadeIn('slow');
      buyModal.fadeIn('slow');
      modalTitle.text('Purchasing ' + name.text());
      modalDetails.text('shares @ $' + price.text() + ' per share');
    });

    background.on('click', function(){
      background.fadeOut('slow');
      buyModal.fadeOut('slow');
    });

    sharesInput.on('input', function(){
      totalSummary.text(sharesInput.val() + ' shares of ' + symbol.text() + ' x ' + price.text());

      if( isNaN(parseInt(sharesInput.val()) ) ){
        cancelButton.hide();
        confirmButton.hide();
      } else{
        cancelButton.show();
        confirmButton.show();
      }

      totalPrice.text( '$' +  (parseInt(sharesInput.val()) * parseFloat(price.text())).toFixed(2) );

      totalTrade.text('Trade Fee');
      totalTradeFee.text('$24');

      if( sharesInput.val() % 100 === 0){
        totalOddLot.text('Odd Lot Charge');
        totalOddLotFee.text('$0');
        oddFee = 0;
      } else {
        totalOddLot.text('Odd Lot Charge');
        totalOddLotFee.text('$7');
        oddFee = 7;
      }

      total.text('Total');
      totalFees.text( ((parseInt(sharesInput.val()) * parseFloat(price.text())) + 24 + oddFee).toFixed(2) );
    });

    var cancelButton = $('.cancelButton');
    cancelButton.on('click', function(){
      background.fadeOut('slow');
      buyModal.fadeOut('slow');
    });

    var confirmButton = $('.confirmButton');

}); //CLOSE JQUERY ON PAGE LOAD FUNCTION
