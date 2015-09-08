//****** JQUERY FUNCTIONS AND FUNCTION CALLS AT PAGE LOAD ********
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
    $(this).css('backgroundColor',"grey");
  }).mouseout(function(){
    $(this).css('backgroundColor',"#2D3E50");
  });

  //DOM VARIABLES TO UPDATE USER INFO:
    var firstName = $("#firstName");
    var lastName = $("#lastName");
    var email = $("#email");
    var password = $("#key");

  //IMMEDIATE AJAX CALL TO FILL USER ACCOUNT INFO:
  $.ajax({
    method: "get",
    url: "/users/placeholder", //WILL BE USING TOKEN TO FIND USER IN CONTROLLER
    success: function(data){
      console.log(data);
      firstName.val(data.firstName);
      lastName.val(data.lastName);
      email.val(data.email);
    }
  });

  //CHECK TO MAKE SURE FORM IS COMPLETED & PASSWORD CONFIRM MATCHES:
  $('form').on('submit',function(){

    event.preventDefault();

      //CHECK FOR VALUE IN FIRST NAME INPUT
      if(!firstName.val()){
          return alert('Please Enter Your First Name');
      }

      //CHECK FOR VALUE IN LAST NAME INPUT
      if(!lastName.val()){
          return alert('Please Enter Your Last Name');
      }

      //CHECK FOR VALUE IN EMAIL INPUT
      if(!email.val()){
          return alert('Please Enter Your Email');
      }

      //CHECK FOR VALUE IN PASSWORD INPUT
      if(!password.val()){
          return alert('Please Enter a Password');
      }

      //CONFIRM PASSWORD CHECK
      if( $('#key').val() != $('#pwkey').val() ){
          alert('Password does not match');
          return false;
      }

      //AJAX REQUEST TO PATCH USER:
      $.ajax({
        method: "patch",
        url: "/users/" + email.val(), //WILL BE USING TOKEN TO FIND USER
        data: JSON.stringify({  firstName: firstName.val(),
                                lastName: lastName.val(),
                                email: email.val(),
                                password: password.val()
                            }),
        contentType: 'application/json; charset=UTF-8',
        dataType : 'json',
        success: function(data){
            console.log(data);

            //REDIRECT IF SERVER RESPONSE HAS REDIRECT KEY:
            if(data.redirect){
                window.location.href = data.redirect;
            }
        }
      });
    }); //CLOSE FORM SUBMIT LISTENER AND FUNCTION


  //DELETE BUTTON LISTENER AND AJAX REQUEST TO DELETE USER
  $('#btn-delete').on('click',function(){
      event.preventDefault();

      //AJAX REQUEST TO DELETE USER:
      $.ajax({
          method: "delete",
          url: "/users/" + email.val(),
          success: function(data){
            delete_cookie('token');
            console.log(data);
            if(data.redirect){
              window.location.href = data.redirect;
              }
            }
        }); //CLOSE AJAX DELETE REQUEST
  }); //CLOSE DELETE USER LISTENER AND FUNCTION


}); //CLOSE JQUERY ON PAGE LOAD FUNCTION
