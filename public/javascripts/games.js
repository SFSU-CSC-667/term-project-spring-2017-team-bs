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
  playersOut: 0,
  cardsInDeck: 0,
  players: null,
  turn: null,
  lastHandCalledId: 1,
  lastHandCalled: '',
  lastHandCalledPlayer: null,
  bsState: false,
  readyCount: 0
}

$(function () {
  $('#start').hide();
  $('#bs').hide();
  $('#ready').hide();
  $('#draw').hide();
  $('#start').prop('disabled', true);
  $('#bs').prop('disabled', true);
  $('#call').prop('disabled', true);
  $('#playerone').text(username);
  $('#room').text('Room ' + gameState.gameid)

  socket.on('connect', function() {

    socket.emit('join-room', myInfo);
    socket.emit('user-joined', myInfo, gameState);
    socket.emit('update-cards', myInfo, gamecards);
    
    //confirm that client wants to leave
    $('#leave').click(function() {
      $('#leaveModal').modal();
    })

    $('#leaveModalLeave').click(function() {
      window.location = '/';
    })

    $('#logout').click(function() {
      $('#leaveModal').modal();
      return false;
    })

    $('#logo').click(function() {
      $('#leaveModal').modal();
      return false;
    })

    //chat
    $('#chatform').submit(function(){
      sendMessage();
      return false;
    })

    $('#send').click(function(){
      sendMessage();
      return false;
    })

    //in-game buttons
    $('#bs').click(function() {
      if($('#bs').prop('disabled')) {
      } else {
        socket.emit('call-bs', myInfo, gameState);
      }
      return false;
    })

    $('#call').click(function() {
      if($('#call').prop('disabled')) {
      } else {
        var callQuantity = $('#callQuantity').val();
        var callRank = $('#callRank').val();
        socket.emit('call-hand', myInfo, gameState, callQuantity, callRank);
      }
      return false;
    })

    $('#draw').click(function() {
      $('#draw').hide();
      $('#bs').show();
      socket.emit('draw-cards', myInfo);
    })

    $('#ready').click(function() {
      $('#ready').prop('disabled', true)
      socket.emit('ready', gameState)
    })

    $('#start').click(function() {
      if($('#start').prop('disabled')) {
        return false;
      } else {
        socket.emit('start', myInfo);
      }
    })

    //events
    socket.on('call-hand-too-low', function() {
      $('#callTooLowModal').modal();
    })

    socket.on('draw-cards', function(cards) {
      gamecards = cards;
      for(var i=0; i<myInfo.numberOfCards; i++) {
        renderCard('one', gamecards[i].cardid);
      }
      updateGameState(gameState);
    })

    socket.on('get-all-cards', function() {
      socket.emit('get-all-cards', myInfo, gamecards, gameState)
    })

    socket.on('message-send', function(info) {
      $('#messages').append($('<li>').text(info.username + ": " + info.message));
      $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
    })

    socket.on('new-round', function(state) {
      emptyHand('one');
      gameState.readyCount = 0;
      gameState.lastHandCalledPlayer = null;
      $('#ready').hide();
      $('#ready').prop('disabled', false);
      $('#draw').show();
    })

    socket.on('next-players-turn', function(info, state) {
      gameState.lastHandCalledPlayer = state.lastHandCalledPlayer;
      gameState.turn = state.turn;
      $('#messages').append($('<li class="system">').text(info.username + " has called " + state.lastHandCalled));
      $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
      updateGameState(gameState);
    })

    socket.on('ready-up', function(info, state) {
      gameState.players = state.players;
      $('#messages').append($('<li class="system">').text(info.username + " BSed " + state.lastHandCalledPlayer));
      $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
      if(state.bsState == true) {
        if(info.username == myInfo.username)
          myInfo.numberOfCards--;
        $('#messages').append($('<li class="system">').text(info.username + " loses a card!"));
        $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
      } else {
        if(state.lastHandCalledPlayer == myInfo.username)
          myInfo.numberOfCards--;
        $('#messages').append($('<li class="system">').text(state.lastHandCalledPlayer + " loses a card!"));
        $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
      }
      $('#bs').hide();
      $('#ready').show()
      $('#call').prop('disabled', true)
      $('#callQuantity').prop('disabled', true)
      $('#callRank').prop('disabled', true)
    })

    socket.on('render-all-cards', function(state) {
      var indexOfPlayer = 0;
      for(var i=0; i<state.players.length; i++) {
        for(var j=i; j<myPlayers.length; j++) {
          if(state.players[i].username == myInfo.username) {
            //do not append cards to myself
          } else if(state.players[i].username == myPlayers[j]) {
            indexOfPlayer = myPlayers.indexOf(myPlayers[j])
            var playerNumber;
            switch(indexOfPlayer) {
              case 0:
                playerNumber = 'one';
                break;
              case 1:
                playerNumber = 'two';
                break;
              case 2:
                playerNumber = 'three';
                break;
              case 3:
                playerNumber = 'four';
                break;
            }
            emptyHand(playerNumber)
            for(var k=0; k<state.players[i].gameCards.length; k++) {
              renderCard(playerNumber, state.players[i].gameCards[k])
            }
          }
        }
      }
    })

    socket.on('start', function(data) {
      $('#start').hide();
      $('#draw').show();
      emptyHand('one');
      $('#messages').append($('<li class="system">').text('The game has started!'));
      $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
    })

    socket.on('update-cards', function(info, cards) {
      if(gameState.status == 'open')
        myInfo.numberOfCards = 3;
      else
        myInfo.numberOfCards = info.numberOfCards;
      gamecards = cards;
      if(gamecards.length > 0) {
        emptyHand('one');
        for(var i=0; i<myInfo.numberOfCards; i++) {
          renderCard('one', gamecards[i].cardid);
        }
      }
    })

    socket.on('update-cards-in-deck', function(state) {
      gameState.cardsInDeck = state.cardsInDeck;
      $('#deck').text(gameState.cardsInDeck + " cards in deck");
    })

    socket.on('update-last-hand-called', function(state) {
      gameState.lastHandCalled = state.lastHandCalled;
      gameState.lastHandCalledId = state.lastHandCalledId;
      if(gameState.lastHandCalled == '') {
        $('#lastHand').text('none');
        $('#bs').prop('disabled', true);
      } else
        $('#lastHand').text(gameState.lastHandCalled);
    })

    socket.on('update-number-of-players', function(state) {
      gameState.numberOfPlayers = state.numberOfPlayers;
      $('#numPlayers').text("Current # of players: " + gameState.numberOfPlayers);
      if(gameState.numberOfPlayers >= 2)
        $('#start').prop('disabled', false)
      else 
        $('#start').prop('disabled', true)
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
          $('#playertwo').text('empty');
          $('#playerthree').text('empty');
          $('#playerfour').text('empty');
          emptyHand('two');
          emptyHand('three');
          emptyHand('four');
          break;
        case 2:
          $('#playerone').text(myPlayers[0]);
          $('#playertwo').text(myPlayers[1]);
          $('#playerthree').text('empty');
          $('#playerfour').text('empty');
          emptyHand('three');
          emptyHand('four');
          break;
        case 3:
          $('#playerone').text(myPlayers[0]);
          $('#playertwo').text(myPlayers[1]);
          $('#playerthree').text(myPlayers[2]);
          $('#playerfour').text('empty');
          emptyHand('four');
          break;
        case 4:
          $('#playerone').text(myPlayers[0]);
          $('#playertwo').text(myPlayers[1]);
          $('#playerthree').text(myPlayers[2]);
          $('#playerfour').text(myPlayers[3]);
          break;
      }

      var indexOfPlayer, playerNumber;
      for(var i=0; i<gameState.players.length; i++) {
        for(var j=i; j<myPlayers.length; j++) {
          if(gameState.players[i].username == myInfo.username) {
            //do not append card backs to myself
          } else if(gameState.players[i].username == myPlayers[j]) {
            indexOfPlayer = myPlayers.indexOf(myPlayers[j])
            switch(indexOfPlayer) {
              case 0:
                playerNumber = 'one';
                break;
              case 1:
                playerNumber = 'two';
                break;
              case 2:
                playerNumber = 'three';
                break;
              case 3:
                playerNumber = 'four';
                break;
            }
            emptyHand(playerNumber);
            //render cardBacks for each opponent
            for(var k=0; k<gameState.players[i].numberOfCards; k++) {
                $('#player' + playerNumber + 'cards').append('<img class="card" src="/images/cardBack.png">')
            }
          }
        }
      }
    })

    socket.on('update-player-cards', function() {
      socket.emit('update-players', gameState)
      socket.emit('update-turn', gameState)
      socket.emit('update-cards-in-deck', gameState)
      socket.emit('update-last-hand-called', gameState)
    })

    socket.on('update-ready-count', function(state) {
      gameState.readyCount = state.readyCount;
    })

    socket.on('update-status', function(state) {
      gameState.status = state.status;
      if(gameState.status == 'open')
        $('#start').show();
      else
        $('#start').hide();
    })

    socket.on('update-turn', function(state) {
      gameState.turn = state.turn;
      $('#turn').text('Player\'s Turn: ' + gameState.turn);
      if($('#playerone').text() == gameState.turn) {
        $('#playerone').css('font-weight', 'bold');
        $('#playerone').css('text-decoration', 'underline');
        $('#playertwo').css('font-weight', 'normal');
        $('#playertwo').css('text-decoration', 'none');
        $('#playerthree').css('font-weight', 'normal');
        $('#playerthree').css('text-decoration', 'none');
        $('#playerfour').css('font-weight', 'normal');
        $('#playerfour').css('text-decoration', 'none');
      } else if($('#playertwo').text() == gameState.turn) {
        $('#playerone').css('font-weight', 'normal');
        $('#playerone').css('text-decoration', 'none');
        $('#playertwo').css('font-weight', 'bold');
        $('#playertwo').css('text-decoration', 'underline');
        $('#playerthree').css('font-weight', 'normal');
        $('#playerthree').css('text-decoration', 'none');
        $('#playerfour').css('font-weight', 'normal');
        $('#playerfour').css('text-decoration', 'none');
      } else if($('#playerthree').text() == gameState.turn) {
        $('#playerone').css('font-weight', 'normal');
        $('#playerone').css('text-decoration', 'none');
        $('#playertwo').css('font-weight', 'normal');
        $('#playertwo').css('text-decoration', 'none');
        $('#playerthree').css('font-weight', 'bold');
        $('#playerthree').css('text-decoration', 'underline');
        $('#playerfour').css('font-weight', 'normal');
        $('#playerfour').css('text-decoration', 'none');
      } else if($('#playerfour').text() == gameState.turn) {
        $('#playerone').css('font-weight', 'normal');
        $('#playerone').css('text-decoration', 'none');
        $('#playertwo').css('font-weight', 'normal');
        $('#playertwo').css('text-decoration', 'none');
        $('#playerthree').css('font-weight', 'normal');
        $('#playerthree').css('text-decoration', 'none');
        $('#playerfour').css('font-weight', 'normal');
        $('#playerfour').css('text-decoration', 'underline');
      }
      if (gameState.turn == myInfo.username && gameState.status == 'open') {
        $('#bs').prop('disabled', true);
        $('#call').prop('disabled', true);
        $('#callQuantity').prop('disabled', true);
        $('#callRank').prop('disabled', true);
      } else if (gameState.turn == myInfo.username && gameState.status == 'in-progress') {
        $('#bs').prop('disabled', false);
        $('#call').prop('disabled', false);
        $('#callQuantity').prop('disabled', false);
        $('#callRank').prop('disabled', false);
      } else {
        $('#start').prop('disabled', true);
        $('#bs').prop('disabled', true);
        $('#call').prop('disabled', true);
        $('#callQuantity').prop('disabled', true);
        $('#callRank').prop('disabled', true);
      }
    })

    socket.on('user-joined', function(info) {
      $('#messages').append($('<li class="system">').text(info.username + " has joined!"));
      $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
      updateGameState(gameState);
    })

    socket.on('user-left', function(info) {
      $('#messages').append($('<li class="system">').text(info.username + " has left!"));
      $('#messages').animate( { scrollTop: $('#messages').prop('scrollHeight') }, 1000)
      updateGameState(gameState);
    })

    socket.on('user-left-ready-up', function(info) {
      $('#messages').append($('<li class="system">').text("Starting new round since it was " + info.username + "'s turn"));
      $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
      $('#bs').hide();
      $('#ready').show()
      $('#call').prop('disabled', true)
      $('#callQuantity').prop('disabled', true)
      $('#callRank').prop('disabled', true)
    })

    socket.on('win-message', function(info, state) {
      for(var i=0; i<state.players.length; i++) {
        if(state.players[i].numberOfCards > 0) {
          $('#messages').append($('<li class="system">').text(state.players[i].username + " wins!"));
          $('#messages').animate({scrollTop: $('#messages').prop('scrollHeight')}, 1000)
        }
      }
      $('#bs').prop('disabled', true);
      $('#callQuantity').prop('disabled', true);
      $('#callRank').prop('disabled', true);
      $('#call').prop('disabled', true);
      $('#draw').prop('disabled', true);
      $('#ready').prop('disabled', true);
    })

  })
})

function emptyHand(playerNumber) {
  $('#player' + playerNumber + 'cards').text('');
}

function sendMessage() {
  myInfo.message = $('#chatinput').val();
  socket.emit('message-send', myInfo);
  $('#chatinput').val('');
}

function updateGameState(gameState) {
  socket.emit('update-status', gameState);
  socket.emit('update-number-of-players', gameState);
  socket.emit('update-cards-in-deck', gameState);
  socket.emit('update-players', gameState);
  socket.emit('update-turn', gameState);
  socket.emit('update-last-hand-called', gameState);
}

function renderCard(playerNumber, cardid) {
  switch (cardid) {
    case 1:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds2.png' class='card'>")
      break;
    case 2:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs2.png' class='card'>")
      break;
    case 3:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts2.png' class='card'>")
      break;
    case 4:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades2.png' class='card'>")
      break;
    case 5:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds3.png' class='card'>")
      break;
    case 6:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs3.png' class='card'>")
      break;
    case 7:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts3.png' class='card'>")
      break;
    case 8:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades3.png' class='card'>")
      break;
    case 9:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds4.png' class='card'>")
      break;
    case 10:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs4.png' class='card'>")
      break;
    case 11:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts4.png' class='card'>")
      break;
    case 12:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades4.png' class='card'>")
      break;
    case 13:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds5.png' class='card'>")
      break;
    case 14:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs5.png' class='card'>")
      break;
    case 15:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts5.png' class='card'>")
      break;
    case 16:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades5.png' class='card'>")
      break;
    case 17:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds6.png' class='card'>")
      break;
    case 18:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs6.png' class='card'>")
      break;
    case 19:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts6.png' class='card'>")
      break;
    case 20:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades6.png' class='card'>")
      break;
    case 21:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds7.png' class='card'>")
      break;
    case 22:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs7.png' class='card'>")
      break;
    case 23:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts7.png' class='card'>")
      break;
    case 24:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades7.png' class='card'>")
      break;
    case 25:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds8.png' class='card'>")
      break;
    case 26:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs8.png' class='card'>")
      break;
    case 27:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts8.png' class='card'>")
      break;
    case 28:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades8.png' class='card'>")
      break;
    case 29:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds9.png' class='card'>")
      break;
    case 30:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs9.png' class='card'>")
      break;
    case 31:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts9.png' class='card'>")
      break;
    case 32:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades9.png' class='card'>")
      break;
    case 33:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamonds10.png' class='card'>")
      break;
    case 34:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubs10.png' class='card'>")
      break;
    case 35:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHearts10.png' class='card'>")
      break;
    case 36:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpades10.png' class='card'>")
      break;
    case 37:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamondsJ.png' class='card'>")
      break;
    case 38:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubsJ.png' class='card'>")
      break;
    case 39:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHeartsJ.png' class='card'>")
      break;
    case 40:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpadesJ.png' class='card'>")
      break;
    case 41:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamondsQ.png' class='card'>")
      break;
    case 42:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubsQ.png' class='card'>")
      break;
    case 43:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHeartsQ.png' class='card'>")
      break;
    case 44:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpadesQ.png' class='card'>")
      break;
    case 45:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamondsK.png' class='card'>")
      break;
    case 46:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubsK.png' class='card'>")
      break;
    case 47:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHeartsK.png' class='card'>")
      break;
    case 48:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpadesK.png' class='card'>")
      break;
    case 49:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardDiamondsA.png' class='card'>")
      break;
    case 50:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardClubsA.png' class='card'>")
      break;
    case 51:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardHeartsA.png' class='card'>")
      break;
    case 52:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardSpadesA.png' class='card'>")
      break
    case 53:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardJokerRed.png' class='card'>")
      break;
    case 54:
      $('#player' + playerNumber + 'cards').append("<img src='/images/cardJokerBlack.png' class='card'>")
      break;
  }
}