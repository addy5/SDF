//***** JQUERY LOAD FUNCTIONS ON PAGE LOAD ****
$( document ).ready(function() {

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

  //DOM FORM VARIABLES:
    var firstName = $('#firstName');
    var lastName = $('#lastName');
    var email = $('#email');
    var password = $('#key');
    var confirmPass = $('#pwkey');

  //SUBMIT SIGNUP FORM LISTENER AND FUNCTION:
  $('form').on('submit',function(){

    event.preventDefault();

    //CHECK FOR VALUE IN FIRST NAME INPUT
      if( !$('#firstName').val()){
          return alert('Please Enter Your First Name');
      }

    //CHECK FOR VALUE IN LAST NAME INPUT
      if( !$('#lastName').val()){
          return alert('Please Enter Your Last Name');
      }

    //CHECK FOR VALUE IN EMAIL INPUT
      if( !$('#email').val()){
          return alert('Please Enter Your Email');
      }

    //CHECK FOR VALUE IN PASSWORD INPUT
      if( !$('#key').val()){
          return alert('Please Enter a Password');
      }

    //CONFIRM PASSWORD CHECK
       if( $('#key').val() != $('#pwkey').val() ){
           alert('Password does not match');
           return false;
       }

    //AJAX REQUEST TO POST NEW USER TO DATABASE:
      $.ajax({
          method: "post",
         url: "/users",
         data: JSON.stringify({firstName:firstName.val(),
                               lastName:lastName.val(),
                               email:email.val(),
                               password:password.val()
                             }),
         contentType: 'application/json; charset=UTF-8',
         dataType : 'json',
         success: function(data){
           console.log(data);
           if(data.redirect){
             window.location.href = data.redirect;
           }
         }
       }); //CLOSE AJAX REQUEST AND FUNCTION

  }); //CLOSE SUBMIT FORM LISTENER AND FUNCTION



}); //CLOSE JQUERY ON PAGE LOAD FUNCTION
