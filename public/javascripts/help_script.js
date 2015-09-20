//******* JQUERY ON PAGE LOAD FUNCTION ********
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
    loginSpan.append('<a href="/login" class="logout"> <li> Logout <li> </a>');

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

  //SUBMIT LOGIN LISTENER AND FUNCTION:
  $('.loginButton').on('click',function(evt){
    event.preventDefault();
    var email = $(".userEmail");
    var password = $(".userPassword");

    //AJAX REQUEST TO AUTHENTICATE USER AND BE RE-ROUTED:
    $.ajax({
      method: "post",
      url: "/authenticate",
      data: JSON.stringify({email: email.val(), password: password.val()}),
      contentType: 'application/json; charset=UTF-8',
      dataType : 'json',
      success: function(data){
        console.log(data);
        //NOTES: TOKEN WILL COME BACK IN FORM OF COOKIE -SEE SERVER.JS

        //OTHER TOKEN HANDLERS NOT BEING USED IN THIS APP:
        // localStorage.setItem('userToken', data.access_token);
        // $.ajaxSetup({
        //     headers: { 'x-access-token': localStorage['userToken'] }
        // });

        //REDIRECT IF SERVER RESPONSE HAS REDIRECT KEY IN JSON:
        if(data.redirect){
          window.location.href = data.redirect;
        }
      }
    });
  });

  //SLIDE VARIABLES:
  var slide = 1;
  var slider = $('.sliderUL');
  var pause = 7500;
  var helpText = $('.helpText');

  var helpButton1 = $('.slideControl1');
  var helpButton2 = $('.slideControl2');
  var helpButton3 = $('.slideControl3');

  var help1 = 'Log in and press "Summary" to view current holdings, historical performance and options.';
  var help2 = 'Click "Buy" or scroll down to search securities to add to your portfolio';
  var help3 = 'Click "Sell" or continue scrolling to sell securities out of of your portfolio.';

  //SLIDER FUNCTION
  function slideTutorial(){
    slider.animate({'margin-left': '-=800'}, 2000, function(){
      slide++;
      if(slide === 4){
        slide = 1;
        slider.css('margin-left',0);
      }
      if(slide === 1){
        helpText.text(help1);
        helpButton2.css('background-color','rgba(45,62,80,0.3)');
        helpButton3.css('background-color','rgba(45,62,80,0.3)');
        helpButton1.css('background-color','rgba(0,150,136,1)');
      } else if(slide === 2){
        console.log('slide 2');
        helpText.text(help2);
        helpButton1.css('background-color','rgba(45,62,80,0.3)');
        helpButton3.css('background-color','rgba(45,62,80,0.3)');
        helpButton2.css('background-color','rgba(0,150,136,1)');
      } else if(slide === 3){
        helpText.text(help3);
        helpButton1.css('background-color','rgba(45,62,80,0.3)');
        helpButton2.css('background-color','rgba(45,62,80,0.3)');
        helpButton3.css('background-color','rgba(0,150,136,1)');
      }
    }); //END CALLBACK FUNCTION TO CHANGE SLIDER DEPENDANCIES
  } //END SLIDER FUNCTION

  //SET SLIDER SPEED AND INVOKE:
  var startSlide;

  function startSlider(){
    startSlide = setInterval(slideTutorial, pause);
  }
  startSlider();

  //CHANGE TO FIRST SLIDE BUTTON LISTENER AND FUNCTIONS:
  helpButton1.on('click',function(){
    clearInterval(startSlide);
    slider.animate({'margin-left': '0'}, 2000);
    helpText.text(help1);
    helpButton2.css('background-color','rgba(45,62,80,0.3)');
    helpButton3.css('background-color','rgba(45,62,80,0.3)');
    helpButton1.css('background-color','rgba(0,150,136,1)');
    slide = 1;
    startSlider();
  });

  //CHANGE TO SECOND SLIDE BUTTON LISTENER AND FUNCTIONS:
  helpButton2.on('click',function(){
    clearInterval(startSlide);
    slider.animate({'margin-left': '-800'}, 2000);
    helpText.text(help2);
    helpButton1.css('background-color','rgba(45,62,80,0.3)');
    helpButton3.css('background-color','rgba(45,62,80,0.3)');
    helpButton2.css('background-color','rgba(0,150,136,1)');
    slide = 2;
    startSlider();
  });

  //CHANGE TO THRID SLIDE BUTTON LISTENER AND FUNCTIONS:
  helpButton3.on('click',function(){
    clearInterval(startSlide);
    slider.animate({'margin-left': '-1600'}, 2000);
    helpText.text(help3);
    helpButton1.css('background-color','rgba(45,62,80,0.3)');
    helpButton2.css('background-color','rgba(45,62,80,0.3)');
    helpButton3.css('background-color','rgba(0,150,136,1)');
    slide = 3;
    startSlider();
  });


  var submitMessage = $('.submitMessage');
  var guestName = $('.guestName');
  var guestEmail = $('.guestEmail');
  var guestMessage = $('.guestMessage');
  var messageConfirm = $('.messageConfirm');
  var backgroundModal = $('.backgroundModal');

  function hideConfirmation(){
    backgroundModal.fadeOut('slow');
    messageConfirm.fadeOut('slow');
    messageConfirm.val('');
    guestName.val('');
    guestEmail.val('');
    guestMessage.val('');
  }

  submitMessage.on('click', function(){
    var sendMssage = {
      name: guestName.val(),
      email: guestEmail.val(),
      message: guestMessage.val()
    };

    backgroundModal.fadeIn();
    messageConfirm.text("sending...");
    messageConfirm.fadeIn();

    $.ajax({
      method: 'post',
      url: 'https://messageaddy.herokuapp.com/messages/',
      data: JSON.stringify(sendMssage),
      contentType: 'application/json; charset=UTF-8',
      dataType : 'json',
      success: function(data){
          console.log(data);
          messageConfirm.text('Message Sent!');
          setTimeout(hideConfirmation,2500);

      }
    }); // END AJAX FUNCTION

  }); //END SEND GUEST MESSAGE LISTENER AND FUNCTION



}); //CLOSE JQUERY ON PAGE LOAD FUNCTION
