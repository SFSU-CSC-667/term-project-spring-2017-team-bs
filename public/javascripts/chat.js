const socket = io();

const url = window.location.pathname;

var gamecards = [];

if(url.search("games")) {
  gameid = url.split("/")[2];
  userid = $('#userid').text();
  username = $('#username').text();

  myInfo = {
    gameid: gameid,
    userid: userid,
    username: username,
    numberOfCards: 3
  }

  gameState = {
    gameid: gameid,
    status: 'open',
    numberOfPlayers: 0,
    cardsInDeck: 0,
    players: null,
    turn: null,
    lastHandCalledId: 1,
    lastHandCalled: ''
  }

}

$(function () {
  $('#start').hide();
  $('#bs').hide();
  $('#playerone').text(username);

  for(var i = 0; i < myInfo.numberOfCards; i++) {
    $('#playeronecards').append("<img src='/images/cardBack.png' class='card'>");
    $('#playertwocards').append("<img src='/images/cardBack.png' class='card'>");
    $('#playerthreecards').append("<img src='/images/cardBack.png' class='card'>");
    $('#playerfourcards').append("<img src='/images/cardBack.png' class='card'>");
  }

  socket.on('connect', function() {

    socket.emit('join-room', myInfo);
    socket.emit('user-joined', myInfo);
    updateGameState(gameState);
    
    $('#start:not([disabled])').click(function() {
      socket.emit('start', myInfo);
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
        socket.emit('user-left', myInfo);
        window.location = '/';
      }
    })

    $('#bs:not([disabled])').click(function() {
      socket.emit('call-bs', gameState);
    })

    $('#call:not([disabled])').click(function() {
      var callQuantity = $('#callQuantity').val();
      var callRank = $('#callRank').val();
      socket.emit('call-hand', gameState, callQuantity, callRank);
    })

    socket.on('message-send', function(data) {
      $('#messages').append($('<li>').text(data.username + ": " + data.message));
    })

    socket.on('user-joined', function(data, state) {
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
      } else {
        $('#start').hide();
        $('#bs').show();
      }
    })

    socket.on('update-number-of-players', function(state) {
      gameState.numberOfPlayers = state.numberOfPlayers;
      $('#numPlayers').text("Current # of players: " + gameState.numberOfPlayers);
    })

    socket.on('update-cards-in-deck', function(state) {
      gameState.cardsInDeck = state.cardsInDeck;
      $('#deck').text(gameState.cardsInDeck);
    })

    socket.on('update-players', function(state) {
      gameState.players = state.players;
      console.log('players: ' + gameState.players);
    })

    socket.on('update-turn', function(state) {
      gameState.turn = state.turn;
      $('#turn').text("Player's turn: " + gameState.turn);

      if (gameState.turn == myInfo.username) {
        $('#bs').removeClass('disabled');
        $('#call').removeClass('disabled');
        $('#callQuantity').removeClass('disabled');
        $('#callRank').removeClass('disabled');
      } else {
        $('#bs').attr('disabled', 'disabled');
        $('#call').attr('disabled', 'disabled');
        $('#callQuantity').attr('disabled', 'disabled');
        $('#callRank').attr('disabled', 'disabled');
      }
    })

    socket.on('update-last-hand-called', function(state) {
      gameState.lastHandCalled = state.lastHandCalled;
      gameState.lastHandCalledId = state.lastHandCalledId;
      $('#lastHand').text(gameState.lastHandCalled);
    })

    socket.on('start', function(data) {
      $('#start').hide();
      $('#bs').show();
      emptyHand();
      socket.emit('draw-cards', myInfo);
    })

    socket.on('draw-cards', function(cards) {
      gamecards = cards;
      console.log(myInfo.numberOfCards);
      console.log(gamecards);
      for(var i=0; i<myInfo.numberOfCards; i++) {
        renderCard(gamecards[i].cardid);
      }
      updateGameState(gameState);
    })

    socket.on('next-players-turn', function(state) {
      updateGameState(gameState);
    })

    socket.on('call-hand-too-low', function() {
      alert("Your call is too low! Call something higher");
    })

    socket.on('new-round', function(state) {
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