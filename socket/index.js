const socketio = require('socket.io');

const db = require('../models/index.js')
const gamecards = require('../models/gamecards.js')
const games = require('../models/games.js')
const hands = require('../models/hands.js')
const messages = require('../models/messages.js')
const users = require('../models/users.js')

const init = ( app, server ) => {
  const io = socketio( server )

  app.set( 'io', io )

  io.on( 'connection', function(socket) {
    console.log( 'A client connected' );

    socket.on( 'disconnect', function(data) {
      console.log( 'A client disconnected' );
    });

    socket.on('join-room', function(data) {
      socket.join(data.gameid);
    });

    socket.on('user-joined', function(info) {
      io.to(info.gameid).emit('user-joined', info);
    });

    socket.on('user-left', function(data) {
      gamecards.deleteUser(data.userid, data.gameid)
        .then(() => {
          socket.to(data.gameid).emit('user-left', data);
        })
        .catch(err => {})
    });

    socket.on('message-send', function(data) {
      messages.add(data.gameid, data.userid, data.message)
        .then(() => {
          console.log('added message to messages table');
        })
        .catch(err => {})
      io.to(data.gameid).emit('message-send', data);
    });

    socket.on('update-status', function(state) {
      games.findById(state.gameid)
        .then(data => {
          state.status = data.status;
          socket.emit('update-status', state);
        })
        .catch(err => {})
    })

    socket.on('update-number-of-players', function(state) {
      gamecards.findNumberOfUsers(state.gameid)
        .then(data => {
          state.numberOfPlayers = data[0].count
          socket.emit('update-number-of-players', state)
        })
        .catch(err => {})
    })

    socket.on('update-cards-in-deck', function(state) {
      gamecards.findCardsNotInPlay(state.gameid)
        .then(data => {
          state.cardsInDeck = data[0].count
          socket.emit('update-cards-in-deck', state)
        })
        .catch(err => {})
    })

    socket.on('update-players', function(state) {
      gamecards.findDistinctUsers(state.gameid)
        .then(data1 => {
          data1.forEach(function(element) {
            state.players.push(element.userid);
          })
          socket.emit('update-players', state);
        })
        .catch(err => {})
    })

    socket.on('update-turn', function(state) {
      games.findById(state.gameid)
        .then(data1 => {
          users.findById(data1.players_turn)
            .then(data2 => {
              state.turn = data2.username;
              socket.emit('update-turn', state);
            })
            .catch(err => {})
        })
        .catch(err => {})
    })

    socket.on('update-last-hand-called', function(state) {
      games.findById(state.gameid)
        .then(data1 => {
          state.lastHandCalledId = data1.last_hand_called;
          hands.findById(data1.last_hand_called)
            .then(data2 => {
              state.lastHandCalled = data2.description;
              socket.emit('update-last-hand-called', state);
            })
            .catch(err => {})
        })
        .catch(err => {})
    })

    socket.on('start', function(state) {
      games.changeStatus('in-progress', state.gameid)
        .then(() => {
          io.to(state.gameid).emit('start', state);
        })
        .catch(err => {console.log(err)})
    })

    socket.on('draw-cards', function(info) {
      gamecards.drawHandAndAdd(info.userid, info.gameid, info.numberOfCards)
        .then(cards => {
          console.log("userid" + info.userid + " from game" + info.gameid + " drew " + cards)
          socket.emit('draw-cards', cards);
        })
        .catch(err => {console.log(err)})
    })

    socket.on('next-players-turn', function(state) {

    })

    socket.on('call-hand', function(state, callQuantity, callRank) {
      hands.findByDescription(callQuantity + " " + callRank)
        .then(data => {
          if(data.handid <= state.lastHandCalledId) {
            socket.emit('call-hand-too-low')
          } else {
            state.lastHandCalledId = data.handid;
            games.updateLastHandCalled(data.handid, state.gameid)
              .then(data => {
                io.to(state.gameid).emit('next-players-turn')
              })
              .catch(err => {})
          }
        })
        .catch(err => {})
    })

    socket.on('call-bs', function(state) {
      gamecards.reset(state.gameid)
        .then(() => {
          io.to(state.gameid).emit('new-round', state);
        })
    })

  });

};

module.exports = { init };