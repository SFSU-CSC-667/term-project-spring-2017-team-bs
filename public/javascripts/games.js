const socket = io();

const url = window.location.pathname;

var gamecards = [];

var gameid = url.split("/")[2];
var userid = $('#userid').text();
var username = $('#username').text();

var myInfo = {
  gameid: gameid,
  userid: userid,
  username: username,
  numberOfCards: 3
}

var myPlayers = [username];

var gameState = {
  gameid: gameid,
  status: 'open',
  numberOfPlayers: 0,
  cardsInDeck: 0,
  players: null,
  turnId: null,
  turn: null,
  lastHandCalledId: 1,
  lastHandCalled: ''
}

$(function () {
  $('#start').hide();
  $('#bs').hide();
  $('#playerone').text(username);

  socket.on('connect', function() {

    socket.emit('join-room', myInfo);
    socket.emit('user-joined', myInfo, gameState);
    socket.emit('update-cards', myInfo, gamecards);
    updateGameState(gameState);
    
    $('#start').click(function() {
      if($('#start').prop('disabled')) {
        return false;
      } else {
        socket.emit('start', myInfo);
      }
    })

    $('#chatform').submit(function(){
      sendMessage();
      return false;
    })

    $('#send').click(function(){
      sendMessage();
      return false;
    })

    $('#leave').click(function() {
      if(window.confirm("Are you sure you want to leave?") == true) {
        socket.emit('user-left', myInfo, gameState);
        window.location = '/';
      }
    })

    $('#bs').click(function() {
      if($('#bs').prop('disabled')) {
        return false;
      } else {
        socket.emit('call-bs', myInfo, gameState);
      }
    })

    $('#call').click(function() {
      if($('#call').prop('disabled')) {
        return false;
      } else {
        var callQuantity = $('#callQuantity').val();
        var callRank = $('#callRank').val();
        socket.emit('call-hand', myInfo, gameState, callQuantity, callRank);
      }
    })

    socket.on('message-send', function(data) {
      $('#messages').append($('<li>').text(data.username + ": " + data.message));
    })

    socket.on('user-joined', function(data) {
      $('#messages').append($('<li>').text(data.username + " has joined!"));
      updateGameState(gameState);
    })

    socket.on('user-left', function(data) {
      $('#messages').append($('<li>').text(data.username + " has left!"));
      updateGameState(gameState);
    })

    socket.on('update-status', function(state) {
      gameState.status = state.status;
      if(gameState.status == 'open') {
        $('#start').show();
        $('#bs').hide();
        $('#call').prop('disabled', true);
      } else {
        $('#start').hide();
        $('#bs').show();
      }
      console.log('update status: ' + gameState.status);
    })

    socket.on('update-number-of-players', function(state) {
      gameState.numberOfPlayers = state.numberOfPlayers;
      $('#numPlayers').text("Current # of players: " + gameState.numberOfPlayers);
      console.log('update numplayers: ' + gameState.numberOfPlayers);
    })

    socket.on('update-cards-in-deck', function(state) {
      gameState.cardsInDeck = state.cardsInDeck;
      $('#deck').text(gameState.cardsInDeck);
      console.log('update deck: ' + gameState.cardsInDeck);
    })

    socket.on('update-players', function(state) {

      //current user is always p1
      myPlayers = [myInfo.username];
      gameState.players = state.players;

      //push other users
      for(var i=0; i<gameState.players.length; i++) {
        if(myPlayers[myPlayers.indexOf(myInfo.username)] != gameState.players[i].username) {
          myPlayers.push(gameState.players[i].username);
        }
      }
      switch(myPlayers.length) {
        case 1:
          $('#playerone').text(myPlayers[0]);
          break;
        case 2:
          $('#playerone').text(myPlayers[0]);
          $('#playertwo').text(myPlayers[1]);
          break;
        case 3:
          $('#playerone').text(myPlayers[0]);
          $('#playertwo').text(myPlayers[1]);
          $('#playerthree').text(myPlayers[2]);
          break;
        case 4:
          $('#playerone').text(myPlayers[0]);
          $('#playertwo').text(myPlayers[1]);
          $('#playerthree').text(myPlayers[2]);
          $('#playerfour').text(myPlayers[3]);
          break;
      }
      console.log('update players: ' + gameState.players);
    })

    socket.on('update-turn', function(state) {
      gameState.turnId = state.turnId;
      gameState.turn = state.turn;
      $('#turn').text("Player's turn: " + gameState.turn);

      if (gameState.turnId == myInfo.userid) {
        $('#bs').prop('disabled', false);
        $('#call').prop('disabled', false);
        $('#callQuantity').prop('disabled', false);
        $('#callRank').prop('disabled', false);
      } else {
        $('#bs').prop('disabled', true);
        $('#call').prop('disabled', true);
        $('#callQuantity').prop('disabled', true);
        $('#callRank').prop('disabled', true);
      }
      console.log('update turnId: ' + gameState.turnId);
      console.log('update turn: ' + gameState.turn);
    })

    socket.on('update-last-hand-called', function(state) {
      gameState.lastHandCalled = state.lastHandCalled;
      gameState.lastHandCalledId = state.lastHandCalledId;
      if(gameState.lastHandCalled == '') {
        $('#lastHand').text('none');
      } else {
        $('#lastHand').text(gameState.lastHandCalled);
      }
      console.log('update last hand: ' + gameState.lastHandCalled);
    })

    socket.on('update-cards', function(info, cards) {
      if(gameState.status == 'open') {
        myInfo.numberOfCards = 3;
      } else {
        myInfo.numberOfCards = info.numberOfCards;
      }
      gamecards = cards;
      if(gamecards.length > 0) {
        emptyHand();
        for(var i=0; i<myInfo.numberOfCards; i++) {
          console.log(gamecards[i].cardid)
          renderCard(gamecards[i].cardid);
        }
      }
    })

    socket.on('update-opponent-cards', function(opponentCards) {

    })

    socket.on('start', function(data) {
      $('#start').hide();
      $('#bs').show();
      emptyHand();
      socket.emit('draw-cards', myInfo);
    })

    socket.on('draw-cards', function(cards) {
      gamecards = cards;
      for(var i=0; i<myInfo.numberOfCards; i++) {
        renderCard(gamecards[i].cardid);
      }
      updateGameState(gameState);
    })

    socket.on('next-players-turn', function(info, state) {
      $('#messages').append($('<li>').text("System: " + info.username + " has called " + state.lastHandCalled));
      updateGameState(gameState);
    })

    socket.on('call-hand-too-low', function() {
      alert("Your call is too low! Call something higher");
    })

    socket.on('new-round', function(info, state) {
      $('#messages').append($('<li>').text("System: " + info.username + " has called BS"));
      emptyHand();
      socket.emit('draw-cards', myInfo);
    })

  })
})

function sendMessage() {
  myInfo.message = $('#chatinput').val();
  socket.emit('message-send', myInfo);
  $('#chatinput').val('');
}

function emptyHand() {
  $('#playeronecards').text('');
}

function updateGameState(gameState) {
  socket.emit('update-status', gameState);
  socket.emit('update-number-of-players', gameState);
  socket.emit('update-cards-in-deck', gameState);
  socket.emit('update-players', gameState);
  socket.emit('update-turn', gameState);
  socket.emit('update-last-hand-called', gameState);
}

function renderCard(cardid) {
  switch (cardid) {
    case 1:
      $('#playeronecards').append("<img src='/images/cardDiamonds2.png' class='card'>")
      break;
    case 2:
      $('#playeronecards').append("<img src='/images/cardClubs2.png' class='card'>")
      break;
    case 3:
      $('#playeronecards').append("<img src='/images/cardHearts2.png' class='card'>")
      break;
    case 4:
      $('#playeronecards').append("<img src='/images/cardSpades2.png' class='card'>")
      break;
    case 5:
      $('#playeronecards').append("<img src='/images/cardDiamonds3.png' class='card'>")
      break;
    case 6:
      $('#playeronecards').append("<img src='/images/cardClubs3.png' class='card'>")
      break;
    case 7:
      $('#playeronecards').append("<img src='/images/cardHearts3.png' class='card'>")
      break;
    case 8:
      $('#playeronecards').append("<img src='/images/cardSpades3.png' class='card'>")
      break;
    case 9:
      $('#playeronecards').append("<img src='/images/cardDiamonds4.png' class='card'>")
      break;
    case 10:
      $('#playeronecards').append("<img src='/images/cardClubs4.png' class='card'>")
      break;
    case 11:
      $('#playeronecards').append("<img src='/images/cardHearts4.png' class='card'>")
      break;
    case 12:
      $('#playeronecards').append("<img src='/images/cardSpades4.png' class='card'>")
      break;
    case 13:
      $('#playeronecards').append("<img src='/images/cardDiamonds5.png' class='card'>")
      break;
    case 14:
      $('#playeronecards').append("<img src='/images/cardClubs5.png' class='card'>")
      break;
    case 15:
      $('#playeronecards').append("<img src='/images/cardHearts5.png' class='card'>")
      break;
    case 16:
      $('#playeronecards').append("<img src='/images/cardSpades5.png' class='card'>")
      break;
    case 17:
      $('#playeronecards').append("<img src='/images/cardDiamonds6.png' class='card'>")
      break;
    case 18:
      $('#playeronecards').append("<img src='/images/cardClubs6.png' class='card'>")
      break;
    case 19:
      $('#playeronecards').append("<img src='/images/cardHearts6.png' class='card'>")
      break;
    case 20:
      $('#playeronecards').append("<img src='/images/cardSpades6.png' class='card'>")
      break;
    case 21:
      $('#playeronecards').append("<img src='/images/cardDiamonds7.png' class='card'>")
      break;
    case 22:
      $('#playeronecards').append("<img src='/images/cardClubs7.png' class='card'>")
      break;
    case 23:
      $('#playeronecards').append("<img src='/images/cardHearts7.png' class='card'>")
      break;
    case 24:
      $('#playeronecards').append("<img src='/images/cardSpades7.png' class='card'>")
      break;
    case 25:
      $('#playeronecards').append("<img src='/images/cardDiamonds8.png' class='card'>")
      break;
    case 26:
      $('#playeronecards').append("<img src='/images/cardClubs8.png' class='card'>")
      break;
    case 27:
      $('#playeronecards').append("<img src='/images/cardHearts8.png' class='card'>")
      break;
    case 28:
      $('#playeronecards').append("<img src='/images/cardSpades8.png' class='card'>")
      break;
    case 29:
      $('#playeronecards').append("<img src='/images/cardDiamonds9.png' class='card'>")
      break;
    case 30:
      $('#playeronecards').append("<img src='/images/cardClubs9.png' class='card'>")
      break;
    case 31:
      $('#playeronecards').append("<img src='/images/cardHearts9.png' class='card'>")
      break;
    case 32:
      $('#playeronecards').append("<img src='/images/cardSpades9.png' class='card'>")
      break;
    case 33:
      $('#playeronecards').append("<img src='/images/cardDiamonds10.png' class='card'>")
      break;
    case 34:
      $('#playeronecards').append("<img src='/images/cardClubs10.png' class='card'>")
      break;
    case 35:
      $('#playeronecards').append("<img src='/images/cardHearts10.png' class='card'>")
      break;
    case 36:
      $('#playeronecards').append("<img src='/images/cardSpades10.png' class='card'>")
      break;
    case 37:
      $('#playeronecards').append("<img src='/images/cardDiamondsJ.png' class='card'>")
      break;
    case 38:
      $('#playeronecards').append("<img src='/images/cardClubsJ.png' class='card'>")
      break;
    case 39:
      $('#playeronecards').append("<img src='/images/cardHeartsJ.png' class='card'>")
      break;
    case 40:
      $('#playeronecards').append("<img src='/images/cardSpadesJ.png' class='card'>")
      break;
    case 41:
      $('#playeronecards').append("<img src='/images/cardDiamondsQ.png' class='card'>")
      break;
    case 42:
      $('#playeronecards').append("<img src='/images/cardClubsQ.png' class='card'>")
      break;
    case 43:
      $('#playeronecards').append("<img src='/images/cardHeartsQ.png' class='card'>")
      break;
    case 44:
      $('#playeronecards').append("<img src='/images/cardSpadesQ.png' class='card'>")
      break;
    case 45:
      $('#playeronecards').append("<img src='/images/cardDiamondsK.png' class='card'>")
      break;
    case 46:
      $('#playeronecards').append("<img src='/images/cardClubsK.png' class='card'>")
      break;
    case 47:
      $('#playeronecards').append("<img src='/images/cardHeartsK.png' class='card'>")
      break;
    case 48:
      $('#playeronecards').append("<img src='/images/cardSpadesK.png' class='card'>")
      break;
    case 49:
      $('#playeronecards').append("<img src='/images/cardDiamondsA.png' class='card'>")
      break;
    case 50:
      $('#playeronecards').append("<img src='/images/cardClubsA.png' class='card'>")
      break;
    case 51:
      $('#playeronecards').append("<img src='/images/cardHeartsA.png' class='card'>")
      break;
    case 52:
      $('#playeronecards').append("<img src='/images/cardSpadesA.png' class='card'>")
      break
    case 53:
      $('#playeronecards').append("<img src='/images/cardJokerRed.png' class='card'>")
      break;
    case 54:
      $('#playeronecards').append("<img src='/images/cardJokerRed.png' class='card'>")
      break;
  }
}