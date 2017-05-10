function checkCredentials() {
  const username = document.getElementById('registerUsername');
  const password = document.getElementById('registerPassword');
  const confirmPassword = document.getElementById('registerConfirmPassword');

  if(username.value.length <= 0) {
    $('#registerUsernameModal').modal();
    return false;
  }

  if(password.value.length < 6 ) {
    $('#registerPasswordModal').modal();
    return false;
  }

  if(password.value !== confirmPassword.value) {
    $('#registerConfirmPasswordModal').modal();
    return false;
  }

  return true;
}
