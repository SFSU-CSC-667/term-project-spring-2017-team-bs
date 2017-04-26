$(function () {
  var socket = io();
  $('.chatform').submit(function(){
    socket.emit( 'message-send', $('.chatinput').val());
    $('.chatinput').val('');
    return false;
  });
  socket.on( 'message-send', (data) => {
    $('#messages').append($('<li>').text(data));
  });
});