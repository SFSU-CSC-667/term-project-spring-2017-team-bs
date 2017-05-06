const db = require('../../db');

function checkCredentials() {
  const username = document.getElementById("username");
  var password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  if(username.value.length <= 0) {
    alert("Username cannot be empty!");
    return false;
  }

  //check if username is unique

  if(password.value.length < 6 ) {
    alert("Password must be at least 6 characters long!");
    return false;
  }

  if(password.value !== confirmPassword.value) {
    alert("Passwords do not match!");
    return false;
  }

  return true;
}
