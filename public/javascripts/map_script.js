var date = new Date();
var day = date.getDate();
var year = date.getFullYear();
var month = date.getMonth() + 1;
var lastMonth = month - 1;
var lastDay = day;
var lastYear = year;
var purchase = {};
var user;
var userHoldings = [];

var tickerStocks = ['TSLA','AAPL','GS','YHOO','GOOG','FB','ADR','TWX','AMZN','NFLX','BABA','MSFT','XOM','BAC','DIS','JPM','PG','INTC'];
var tickerStockObjects = {};

var marginCount;
var tickerLength;
var historyLog;

var dataToPlot = [];

var articleArray = ['NYSE','Dow Jones','Wall Street','finance','nasdaq','stock markets','investing'];
var articleFeed = $('.articleFeed');

//RANDOM NUMBER SELECTOR FROM 1 TO 10:
function randomNum(num){
  smallNum = Math.random();
  return Math.floor( smallNum * num );
}

//FILL NEWS SIDEBAR WITH RECENT RELATED NY TIMES ARTICLES:
function newsFeed(newsQuery){
  var nyTimes = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?q='+ newsQuery +'&page=1&sort=newest&api-key=ba627640adb004fc3d5047fc6e33a8c3:19:72915330';

    $.ajax({
      method: 'get',
      url: nyTimes,
      success: function(data){

        articleFeed.append('<p style="padding: 1px 15px; margin: 1px 2px; text-align:left; font-size: 20px;">' + data.response.docs[0].headline.main +'</p>' + '<p style="padding: 0 15px; text-align:left; margin:1px 2px 30px 2px;">' + data.response.docs[0].snippet +'..<a style="color:blue" href="' + data.response.docs[0].web_url + '">'+ 'read more </a></p>');

      } //END AJAX SUCCESS FUNCTION
    }); //END AJAX CALL TO GET NY TIMES ARTICLES
} //END FILL NEWSFEED FUNCTION


//CONVERT DATE INTO STRINGS FOR 30 DAY PRICE HISTORY
    if(month < 10){
      month = '0' + month.toString();
    } else {
      month = month.toString();
    }

    if(lastMonth === -1){
      lastYear = lastYear - 1;
    } else if(lastMonth < 10){
      lastMonth = '0' + lastMonth.toString();
    } else {
      lastMonth = lastMonth.toString();
    }

    if(day < 10){
      day = '0' + day.toString();
    } else {
      day = day.toString();
    }

    if(lastDay === 31) lastDay = 28;
    if(lastDay < 10){
      lastDay = '0' + lastDay.toString();
    } else {
      lastDay = lastDay.toString();
    }

    year = year.toString();

    var today = month + "-" + day + "-" + year;
//END OF 30 DAY DATE CONVERSION

//LOAD GOOGLE SCATTER AND LINE VISUALIZATION:
google.load("visualization", "1", {packages:["corechart"]});
var buyChart = $('#buyChart');
var priceChart = $('#priceChart');


//GOOGLE PRICE SCATTER PLOT:
function drawChart(a,b,c,d,e) {
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

//LOAD GOOGLE LINE VISUALIZATION:
function drawLineChart() {
  var data = google.visualization.arrayToDataTable(dataToPlot);

  var options = {
    title: '30 Day History',
    curveType: 'function',
    legend: { position: 'right' },
    colors: ['#009688']
    };

  var chart = new google.visualization.LineChart(document.getElementById('priceChart'));

  chart.draw(data, options);
}

//LOAD HISTORY SUMMARY LINE VISUALIZATION:
function drawSummaryLine(summaryData) {
  var data = google.visualization.arrayToDataTable(summaryData);

  var options = {
    title: 'Your Fund History',
    curveType: 'none',
    legend: { position: 'right' },
    colors: ['#009688']
    };

  var chart = new google.visualization.LineChart(document.getElementById('summaryGraph'));

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
    $(".navItem").mouseover(function(){
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
        user = data;
        balance.text('$' + data.balance);
        console.log(user);

        if(user.holdings.length === 0){
          marginCount = tickerStocks.length * 200 - 500;
          tickerLength = '-'+marginCount+'px';
          callQuotes();
        }

        for(var b=0; b < user.holdings.length; b++){
          articleArray.push(user.holdings[b].name.split(" ")[0]);
          tickerStocks.push(user.holdings[b].symbol);
          if(b == user.holdings.length-1){
            callQuotes();
            marginCount = tickerStocks.length * 200 - 500;
            tickerLength = '-'+marginCount+'px';
          }
        }

        historyLog = user.history;
        historyLog.unshift(["Date","Value"],["Start",100000]);

        //FILL NEWS FEED BASED ON USERS HOLDINGS:
        for(var g=0; g < 8; g++){
          var currentArticle = randomNum(articleArray.length);
          newsFeed(articleArray[currentArticle]);
        }
      } //END AJAX SUCCESS FUNCTION
    }); //ENDS AJAX REQUEST TO SHOW USER

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

    searchButton.on('click', function(){
      runQuote();
      runPriceHistory();
    });

    query.on('keypress', function (e) {
      var key = e.which || e.keyCode;
      if (key === 13){
         runQuote();
         return runPriceHistory();
      }
      return null;
    });

// https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20(%22YHOO%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys

    //FUNCTION TO GET CURRENT STOCK QUOTES BASE ON SYMBOL:
    function runQuote(){
      var queryParams = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20(%22'+query.val()+'%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

      $.getJSON(queryParams, function(data){
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

    //FUNCTION TO GET 30 DAY PRICE HISTORY BASED ON SYMBOL:
    function runPriceHistory(){
    var queryParams = 'https://query.yahooapis.com/v1/public/yql?q=select * from yahoo.finance.historicaldata where symbol in ("'+ query.val() +'") and startDate = "'+lastYear+'-'+lastMonth+'-'+lastDay+'" and endDate = "'+year+'-'+month+'-'+day+'"';

    var queryString = encodeURI(queryParams);
    var apiCall = queryString + '&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';

      dataToPlot = [['Date','Price']];

      $.getJSON(apiCall, function(data){
        var array = data.query.results.quote;
        for(var i=array.length-1; i > 0; i-=1){
            dataToPlot.push( [ array[i].Date, parseFloat(array[i].Close) ] );
        }
        setTimeout(drawLineChart,500);
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
      modalDetails.text('shares @ $' + (parseFloat(price.text())).toFixed(2) + ' per share');
    });

    background.on('click', function(){
      background.fadeOut('slow');
      buyModal.fadeOut('slow');
      sharesInput.val("");
    });

    sharesInput.on('input', function(){
      totalSummary.text(sharesInput.val() + ' shares of ' + symbol.text() + ' x ' + price.text());

      if( isNaN(parseInt(sharesInput.val()) ) || sharesInput.val() === 0 ){
        cancelButton.hide();
        confirmButton.hide();
        totalSummary.hide();
        totalPrice.hide();
        totalTradeFee.hide();
        totalTrade.hide();
        totalOddLot.hide();
        totalOddLotFee.hide();
        totalFees.hide();
        total.hide();

      } else{
        cancelButton.show();
        confirmButton.show();
        totalSummary.show();
        totalPrice.show();
        totalTradeFee.show();
        totalTrade.show();
        totalOddLot.show();
        totalOddLotFee.show();
        totalFees.show();
        total.show();
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
      totalFees.text( '$' + ((parseInt(sharesInput.val()) * parseFloat(price.text())) + 24 + oddFee).toFixed(2) );
    });

    var cancelButton = $('.cancelButton');
    cancelButton.on('click', function(){
      background.fadeOut('slow');
      buyModal.fadeOut('slow');
      sharesInput.val("");
      cancelButton.hide();
      confirmButton.hide();
      totalSummary.hide();
      totalPrice.hide();
      totalTradeFee.hide();
      totalTrade.hide();
      totalOddLot.hide();
      totalOddLotFee.hide();
      totalFees.hide();
      total.hide();
    });

    var confirmButton = $('.confirmButton');
    confirmButton.on('click', function(){
      purchase.symbol = symbol.text();
      purchase.name = name.text();
      purchase.price = price.text();
      purchase.volume = sharesInput.val();
      purchase.subTotal = totalPrice.text();
      purchase.tradeFee = totalTradeFee.text();
      purchase.oddLotFee = totalOddLotFee.text();
      purchase.totalFees = totalFees.text();
      purchase.date = today;

      console.log(purchase);
      // AJAX REQUEST TO PATCH USER'S HOLDINGS (BUY):
      $.ajax({
        method: "patch",
        url: "/users/purchase", //WILL BE USING TOKEN TO FIND USER
        data: JSON.stringify( {purchase: purchase} ),
        contentType: 'application/json; charset=UTF-8',
        dataType : 'json',
        success: function(data){
            console.log(data);

            //REDIRECT IF SERVER RESPONSE HAS REDIRECT KEY:
            if(data.redirect){
                window.location.href = data.redirect;
            }
        } //CLOSE AJAX SUCCESS FUNCTION
      }); // CLOSE AJAX PATCH REQUEST TO USER'S HOLDINGS
    }); // CLOSE CONFIRM BUTTON TO BUY FUNCTION

    var priceToggle = $('.priceToggle'); //TOGGLE PRICE CHART
    var buyToggle = $('.buyToggle'); //TOGGLE SCATTER CHART

    priceToggle.on('click', function(){
      $(this).css('background-color','rgba(128,128,128,1.0)');
      buyToggle.css('background-color','rgba(128,128,128,0.5)');
      buyChart.css('z-index','2');
      priceChart.css('z-index','3');
    });

    buyToggle.on('click', function(){
      $(this).css('background-color','rgba(128,128,128,1.0)');
      priceToggle.css('background-color','rgba(128,128,128,0.5)');
      priceChart.css('z-index','2');
      buyChart.css('z-index','3');
    });

  var tickerTape = $('.tickerTape');

  //FUNCTION TO LOOP THROUGH ALL STOCKS FOR TICKER INFO:
  function ticker(param){
    var stockQuery = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20(%22'+param+'%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
    //AJAX REQUEST TO LOAD TICKER TAPE INFO:
    $.ajax({
      method:'get',
      url: stockQuery,
      success: function(data){
        tickerStockObjects[data.query.results.quote.symbol] = data.query.results.quote.LastTradePriceOnly;

        // console.log(data.query.results.quote);
        if(data.query.results.quote.Change[0] === '+'){

          tickerTape.append('<li class="tickerLi"> |&nbsp;&nbsp; '+ data.query.results.quote.symbol +' last: '+ data.query.results.quote.LastTradePriceOnly + ' change: <span  style="color:rgba(0,130,0,0.85);">'+ data.query.results.quote.Change +'</span> &nbsp;&nbsp;| </li>');
        } else {
          tickerTape.append('<li class="tickerLi"> |&nbsp;&nbsp;  '+ data.query.results.quote.symbol +' last: '+ data.query.results.quote.LastTradePriceOnly + ' change: <span  style="color:red;">'+ data.query.results.quote.Change +' </span> &nbsp;&nbsp;| </li>');
        }
      } //END AJAX SUCCESS FUNCTION
    }); //END AJAX REQUEST FOR TICKER INFO
  } //END OF TICKER FUNCTION

  //APPEND STOCKS THAT CAME BACK TO TICKER TAPE:
  function callQuotes(){
    for(var e=0; e < tickerStocks.length; e++){
      ticker(tickerStocks[e]);
      if(e === tickerStocks.length -1){
        startTicker();
        $('.ticker1').text('Welcome!');
      }
    }
  } //END CALL AND APPEND QUOTES

  //MOVE TICKER TAPE FUNCTION:
  function moveTicker(){
    if(tickerTape.css("margin-left") == tickerLength){
      console.log('ping!');
      tickerTape.css("margin-left","-90px");
    }
    tickerTape.css('margin-left','-=2');
  }
  function startTicker(){
    setInterval(moveTicker,60);
  }

  function userSummaryOfFund(){
      user.currentBalance = user.balance;
      user.holdings.forEach(function(stock){
        userHoldings.push({
              symbol: stock.symbol,
              name: stock.name,
              volume: stock.volume,
              currentPrice: tickerStockObjects[stock.symbol]
              });
      user.currentBalance = user.currentBalance + parseFloat(tickerStockObjects[stock.symbol]) * parseFloat(stock.volume);
      console.log(user.currentBalance);
      }); //END LOOP THROUGH USERS STOCK
      historyLog.push([today,user.currentBalance]);
      drawSummaryLine(historyLog);

      var yesterValue = user.history[user.history.length-2][1];
      var dailyChange = ((parseFloat(user.currentBalance) - yesterValue) / yesterValue).toFixed(6);
      var totalChange = ((user.currentBalance - 100000) / 100000).toFixed(6);

      if(totalChange < 0){
        $('.userChange').text("-" + totalChange + "%");
        $('.userChange').css('color','red');
      } else{
        $('.userChange').text("+" + totalChange + "%");
      }

      if(dailyChange < 0){
        $('.userDaily').text("-" + dailyChange + "%");
        $('.userDaily').css('color','red');
      } else{
        $('.userDaily').text("+" + dailyChange + "%");
      }

      $('.userCurrent').text('$' + user.currentBalance);
      $('.userCash').text('$' + user.balance);

  } //END LOGSTOCK FUNCTION TO SAVE EOD BALANCE TO HISTORY

  setTimeout(userSummaryOfFund,2000);

}); //CLOSE JQUERY ON PAGE LOAD FUNCTION
