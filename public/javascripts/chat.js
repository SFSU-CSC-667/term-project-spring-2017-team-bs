var socket = io();

var url = window.location.pathname;

var gamecards, messages;
var gameid, username;
var players = 0;

if(url.search("games")) {
  gameid = url.split("/")[2];
  userid = $('#userid').text();
  username = $('#username').text();

  gamecards = {
    gameid: gameid,
    userid: userid,
    username: username,
    cardid: null,
    order: null
  };
}

$(function () {
  $('#playerone').text(username);

  socket.on('connect', function() {

    socket.emit('join-room', gamecards);
    socket.emit('user-joined', gamecards);

    $('#start').click(function() {
      socket.emit('start', gamecards);
    });

    $('#chatform').submit(function(){
      sendMessage();
      return false;
    });

    $('#send').click(function(){
      sendMessage();
      return false;
    });

    $('#leave').click(function() {
      if(window.confirm("Are you sure you want to leave?") == true) {
        socket.emit('user-left', gamecards);
        window.location = '/';
      }
    });

    socket.on('message-send', function(data) {
      $('#messages').append($('<li>').text(data.username + ": " + data.message));
    });
    socket.on('user-joined', function(data) {
      $('#messages').append($('<li>').text(data.username + " has joined!"))
    });
    socket.on('user-left', function(data) {
      $('#messages').append($('<li>').text(data.username + " has left!"));
    });

  });
});

function sendMessage() {
  var messages = {
    gameid: gameid,
    userid: userid,
    username: username,
    message: $('#chatinput').val()
  }
  socket.emit('message-send', messages);
  $('#chatinput').val('');
};