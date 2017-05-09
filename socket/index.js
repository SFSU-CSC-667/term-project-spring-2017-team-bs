const socketio = require('socket.io');

const db = require('../models/index.js')
const cards = require('../models/cards.js')
const gamecards = require('../models/gamecards.js')
const games = require('../models/games.js')
const hands = require('../models/hands.js')
const messages = require('../models/messages.js')
const users = require('../models/users.js')

const init = ( app, server ) => {
  const io = socketio( server )

  app.set( 'io', io )

  io.on( 'connection', function(socket) {
    console.log( 'A client connected to a game' );

    socket.on( 'disconnect', function() {
      console.log( 'A client disconnected from a game' );
      var info = {};
      info.username = socket.username;

      games.findById(socket.gameid)
        .then(data => {
          if(data.players_turn == socket.userid) {
            socket.to(socket.gameid).emit('user-left-ready-up', info)
          }
          return gamecards.deleteUser(socket.userid, socket.gameid)
        })
        .then(() => {
          return gamecards.findDistinctUsers(socket.gameid)
        })
        .then(data1 => {
          if(data1.length <= 0) {
            return gamecards.deleteGame(socket.gameid)
          } else {
            socket.to(socket.gameid).emit('user-left', info);
            return games.updateTurn(data1[0].userid, socket.gameid)
          }
        })
        .then(data2 => {
          //if games.updateTurn is returned, skip deleting game/messages
          if(data2) {
            return new Promise(function(resolve, reject) {
              reject('')
            })
          }
          else
            return messages.delete(socket.gameid)
        })
        .then(() => {
          return games.deleteGame(socket.gameid)
        })
        .then(() => {
          socket.to(socket.gameid).emit('user-left', info);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'call-bs', function(info, state) {
      gamecards.findCardsInPlay(state.gameid)
        .then(cards => {
          return doesHandExist(cards, state.lastHandCalledId)
        })
        .then(exists => {
          state.bsState = exists;
          var done = false;
          var out = false;
          var playerIdWhoLostCard;
          if(exists) {
            for(var i=0; i<state.players.length; i++) {
              if(state.players[i].username == info.username) {
                state.players[i].numberOfCards--;
                playerIdWhoLostCard = state.players[i].userid;
                if(state.players[i].numberOfCards == 0) {
                  state.players.splice(i, 1);
                  state.playersOut++;
                  out = true;
                }
                done = true;
              }
            }
          } else {
            for(var i=0; i<state.players.length; i++) {
              if(state.players[i].username == state.lastHandCalledPlayer) {
                state.players[i].numberOfCards--;
                playerIdWhoLostCard = state.players[i].userid;
                if(state.players[i].numberOfCards == 0) {
                  state.players.splice(i, 1);
                  state.playersOut++;
                  out = true;
                }
                done = true;
              }
            }
          }
          if(done) {
            if(out) {
              var currentTurnIndex = 0;
              for(var i=0; i<state.players.length; i++) {
                if(state.players[i].username == info.username)
                  currentTurnIndex = i;
              }
              var next = (currentTurnIndex + 1) % state.players.length
              state.turn = state.players[next].username
              return games.updateTurn(state.players[next].userid, state.gameid)
            } else {
              state.turn = playerIdWhoLostCard;
              return games.updateTurn(playerIdWhoLostCard, state.gameid)
            }
          }
        })
        .then(() => {
          return games.updateLastHandCalled(1, state.gameid)
        })
        .then(() => {
          io.to(state.gameid).emit('get-all-cards')
          if(state.numberOfPlayers - state.playersOut == 1) {
            io.to(state.gameid).emit('win-message', info, state)
          } else {
            io.to(state.gameid).emit('ready-up', info, state)
          }
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'call-hand', function(info, state, callQuantity, callRank) {
      state.lastHandCalled = '' + callQuantity + " " + callRank;
      state.lastHandCalledPlayer = info.username;
      hands.findByDescription(callQuantity + " " + callRank)
        .then(data => {
          if(data.handid <= state.lastHandCalledId) {
            socket.emit('call-hand-too-low')
            return new Promise(function(resolve, rejected) {
              rejected('call-hand-too-low event')
            })
          } else {
            state.lastHandCalledId = data.handid;
            return games.updateLastHandCalled(data.handid, state.gameid)
          }
        })
        .then(() => {
          var currentTurnIndex = 0;
          for(var i=0; i<state.players.length; i++) {
            if(state.players[i].username == info.username)
              currentTurnIndex = i;
          }
          var next = (currentTurnIndex + 1) % state.players.length
          state.turn = state.players[next].username
          return games.updateTurn(state.players[next].userid, state.gameid)
        })
        .then(() => {
          io.to(state.gameid).emit('next-players-turn', info, state)
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'draw-cards', function(info) {
      gamecards.drawHandAndAdd(info.userid, info.gameid, info.numberOfCards)
        .then(cards => {
          socket.emit('draw-cards', cards);
          io.to(info.gameid).emit('update-player-cards');
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'get-all-cards', function(info, cards, state) {
      gamecards.findCardsInPlay(state.gameid)
        .then(data => {
          var done = false;
          for(var i=0; i<state.players.length; i++) {
            state.players[i].gameCards = [];
            for(var j=0; j<data.length; j++) {
              if(state.players[i].userid == data[j].userid) {
                state.players[i].gameCards.push(data[j].cardid);
                if(i == state.players.length-1 && j == data.length-1){
                  done = true;
                }
              }
            }
          }
          if(done){
            return new Promise(function(resolve, reject) {
              resolve(true)
            })
          }
        })
        .then(() => {
          io.to(state.gameid).emit('render-all-cards', state)
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'join-room', function(info) {
      socket.userid = info.userid;
      socket.username = info.username;
      socket.gameid = info.gameid
      socket.join(info.gameid);
    })

    socket.on( 'message-send', function(info) {
      messages.add(info.gameid, info.userid, info.message)
        .then(() => {
          io.to(info.gameid).emit('message-send', info);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'ready', function(state) {
      state.readyCount++;
      if(state.readyCount >= state.numberOfPlayers) {
        gamecards.reset(state.gameid)
          .then(() => {
            io.to(state.gameid).emit('new-round', state)
          })
          .catch(err => {
            console.log(err)
          })
      } else {
        io.to(state.gameid).emit('update-ready-count', state)
      }
    })

    socket.on( 'start', function(state) {
      games.changeStatus('in-progress', state.gameid)
        .then(() => {
          io.to(state.gameid).emit('start', state);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-cards', function(info, cards) {
      gamecards.findNumberOfCardsByUserId(info.gameid, info.userid)
        .then(data1 => {
          info.numberOfCards = data1[0].count;
          return gamecards.findCardsByUserId(info.gameid, info.userid)
        })
        .then(data2 => {
          cards = data2;
          socket.emit('update-cards', info, cards);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-cards-in-deck', function(state) {
      gamecards.findCardsNotInPlay(state.gameid)
        .then(data => {
          state.cardsInDeck = data[0].count
          socket.emit('update-cards-in-deck', state)
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-last-hand-called', function(state) {
      games.findById(state.gameid)
        .then(data1 => {
          state.lastHandCalledId = data1.last_hand_called;
          return hands.findById(data1.last_hand_called)
        })
        .then(data2 => {
          state.lastHandCalled = data2.description;
          socket.emit('update-last-hand-called', state);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-number-of-players', function(state) {
      gamecards.findNumberOfUsers(state.gameid)
        .then(data => {
          state.numberOfPlayers = data[0].count
          socket.emit('update-number-of-players', state)
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-players', function(state) {
      gamecards.findDistinctUsers(state.gameid)
        .then(data1 => {
          return Promise.all(data1.map(playerPromise))
        })
        .then(data2 => {
          state.players = data2;
          return gamecards.findCardsInPlay(state.gameid)
        })
        .then(data3 => {
          var done = false;
          for(var i=0; i<state.players.length; i++) {
            state.players[i].numberOfCards = 0;
            for(var j=0; j<data3.length; j++) {
              if(state.players[i].userid == data3[j].userid) {
                state.players[i].numberOfCards++;
                if(i == state.players.length-1 && j == data3.length-1)
                  done = true;
              }
              
            }
          }
          if(done){
            return new Promise(function(resolve, reject) {
              resolve(true)
            })
          }
        })
        .then(() => {
          socket.emit('update-players', state)
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-status', function(state) {
      games.findById(state.gameid)
        .then(data => {
          state.status = data.status;
          socket.emit('update-status', state);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'update-turn', function(state) {
      games.findById(state.gameid)
        .then(data1 => {
          return users.findById(data1.players_turn)
        })
        .then(data2 => {
          state.turn = data2.username;
          socket.emit('update-turn', state);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'user-joined', function(info) {
      io.to(info.gameid).emit('user-joined', info);
    })

    socket.on( 'user-left', function(info) {
      gamecards.deleteUser(info.userid, info.gameid)
        .then(() => {
          return gamecards.findDistinctUsers(info.gameid)
        })
        .then(data1 => {
          if(data1.length <= 0) {
            return gamecards.deleteGame(info.gameid)
          } else {
            socket.to(info.gameid).emit('user-left', info);
            return games.updateTurn(data1[0].userid, info.gameid)
          }
        })
        .then(data2 => {
          //if games.updateTurn is returned, skip deleting game/messages
          if(data2) {
            return new Promise(function(resolve, reject) {
              reject('')
            })
          } else {
            return messages.delete(info.gameid)
          }
        })
        .then(() => {
          return games.deleteGame(info.gameid)
        })
        .then(() => {
          socket.to(info.gameid).emit('user-left', info);
        })
        .catch(err => {
          console.log(err)
        })
    })

    socket.on( 'win-message', function(info, state) {
      socket.emit('win-message', info, state)
    })

  });

};

function cardPromise(card) {
  return cards.findById(card.cardid)
}

function playerCardsPromise(gameid, player) {
  return gamecards.findCardsByUserId(gameid, player.userid)
}

function playerPromise(player) {
  return users.findById(player.userid)
}

function doesHandExist(cards, handid) {
  var exists = false;
  var fours = 0
  var fives = 0
  var sixes = 0
  var sevens = 0
  var eights = 0
  var nines = 0 
  var tens = 0 
  var jacks = 0
  var queens = 0
  var kings = 0
  var aces = 0
  var wilds = 0

  var cardPromises = cards.map(cardPromise);

  return Promise.all(cardPromises)
    .then(data => {
      for(var i=0; i<data.length; i++) {
        switch(data[i].rank) {
          case 4:
            fours++;
            break;
          case 5:
            fives++;
            break;
          case 6:
            sixes++;
            break;
          case 7:
            sevens++;
            break;
          case 8:
            eights++;
            break;
          case 9:
            nines++;
            break;
          case 10:
            tens++;
            break;
          case 11:
            jacks++;
            break;
          case 12:
            queens++;
            break;
          case 13:
            kings++;
            break;
          case 14:
            aces++;
            break;
        }
        if(data[i].wild)
          wilds++;
      }
      return new Promise(function(resolve, reject) {
        resolve(true)
      })
    })
    .then(() => {
      switch(handid) {
        case 1: //''
          console.log('error bsing blank')
          return true;
          break;
        case 2: //one 4
          if ((fours + wilds) >= 1)
            exists = true;
          break;
        case 3: //one 5
          if ((fives + wilds) >= 1)
            exists = true;
          break;
        case 4: //one 6
          if ((sixes + wilds) >= 1)
            exists = true;
          break;
        case 5: //one 7
          if ((sevens + wilds) >= 1)
            exists = true;
          break;
        case 6: //one 8
          if ((eights + wilds) >= 1)
            exists = true;
          break;
        case 7: //one 9
          if ((nines + wilds) >= 1)
            exists = true;
          break;
        case 8: //one 10
          if ((tens + wilds) >= 1)
            exists = true;
          break;
        case 9: //one J
          if ((jacks + wilds) >= 1)
            exists = true;
          break;
        case 10: //one Q
          if ((queens + wilds) >= 1)
            exists = true;
          break;
        case 11: //one K
          if (kings + wilds >= 1)
            exists = true
          break;
        case 12: //one A
          if ((aces + wilds) >= 1)
            exists = true;
          break;
        case 13: //two 4
          if ((fours + wilds) >= 2)
            exists = true;
          break;
        case 14: //two 5
          if ((fives + wilds) >= 2)
            exists = true;
          break;
        case 15: //two 6
          if ((sixes + wilds) >= 2)
            exists = true;
          break;
        case 16: //two 7
          if ((sevens + wilds) >= 2)
            exists = true;
          break;
        case 17: //two 8
          if ((eights + wilds) >= 2)
            exists = true;
          break;
        case 18: //two 9
          if ((nines + wilds) >= 2)
            exists = true;
          break;
        case 19: //two 10
          if ((tens + wilds) >= 2)
            exists = true;
          break;
        case 20: //two J
          if ((jacks + wilds) >= 2)
            exists = true;
          break;
        case 21: //two Q
          if ((queens + wilds) >= 2)
            exists = true;
          break;
        case 22: //two K
          if (kings + wilds >= 2)
            exists = true
          break;
        case 23: //two A
          if ((aces + wilds) >= 2)
            exists = true;
          break;
        case 24: //three 4
          if ((fours + wilds) >= 3)
            exists = true;
          break;
        case 25: //three 5
          if ((fives + wilds) >= 3)
            exists = true;
          break;
        case 26: //three 6
          if ((sixes + wilds) >= 3)
            exists = true;
          break;
        case 27: //three 7
          if ((sevens + wilds) >= 3)
            exists = true;
          break;
        case 28: //three 8
          if ((eights + wilds) >= 3)
            exists = true;
          break;
        case 29: //three 9
          if ((nines + wilds) >= 3)
            exists = true;
          break;
        case 30: //three 10
          if ((tens + wilds) >= 3)
            exists = true;
          break;
        case 31: //three J
          if ((jacks + wilds) >= 3)
            exists = true;
          break;
        case 32: //three Q
          if ((queens + wilds) >= 3)
            exists = true;
          break;
        case 33: //three K
          if (kings + wilds >= 3)
            exists = true
          break;
        case 34: //three A
          if ((aces + wilds) >= 3)
            exists = true;
          break;
        case 35: //straight
          break;
        case 36: //flush D
          break;
        case 37: //flush C
          break;
        case 38: //flush H
          break;
        case 39: //flush S
          break;
        case 40: //full house 4
          break;
        case 41: //full house 5
          break;
        case 42: //full house 6
          break;
        case 43: //full house 7
          break;
        case 44: //full house 8
          break;
        case 45: //full house 9
          break;
        case 46: //full house 10
          break;
        case 47: //full house J
          break;
        case 48: //full house Q
          break;
        case 49: //full house K
          break;
        case 50: //full house A
          break;
        case 51: //four 4
          if ((fours + wilds) >= 4)
            exists = true;
          break;
        case 52: //four 5
          if ((fives + wilds) >= 4)
            exists = true;
          break;
        case 53: //four 6
          if ((sixes + wilds) >= 4)
            exists = true;
          break;
        case 54: //four 7
          if ((sevens + wilds) >= 4)
            exists = true;
          break;
        case 55: //four 8
          if ((eights + wilds) >= 4)
            exists = true;
          break;
        case 56: //four 9
          if ((nines + wilds) >= 4)
            exists = true;
          break;
        case 57: //four 10
          if ((tens + wilds) >= 4)
            exists = true;
          break;
        case 58: //four J
          if ((jacks + wilds) >= 4)
            exists = true;
          break;
        case 59: //four Q
          if ((queens + wilds) >= 4)
            exists = true;
          break;
        case 60: //four K
          if (kings + wilds >= 4)
            exists = true
          break;
        case 61: //four A
          if ((aces + wilds) >= 4)
            exists = true;
          break;
        case 62: //straight flush
          break;
        case 63: //five 4
          if ((fours + wilds) >= 5)
            exists = true;
          break;
        case 64: //five 5
          if ((fives + wilds) >= 5)
            exists = true;
          break;
        case 65: //five 6
          if ((sixes + wilds) >= 5)
            exists = true;
          break;
        case 66: //five 7
          if ((sevens + wilds) >= 5)
            exists = true;
          break;
        case 67: //five 8
          if ((eights + wilds) >= 5)
            exists = true;
          break;
        case 68: //five 9
          if ((nines + wilds) >= 5)
            exists = true;
          break;
        case 69: //five 10
          if ((tens + wilds) >= 5)
            exists = true;
          break;
        case 70: //five J
          if ((jacks + wilds) >= 5)
            exists = true;
          break;
        case 71: //five Q
          if ((queens + wilds) >= 5)
            exists = true;
          break;
        case 72: //five K
          if (kings + wilds >= 5)
            exists = true
          break;
        case 73: //five A
          if ((aces + wilds) >= 5)
            exists = true;
          break;
        case 74: //six 4
          if ((fours + wilds) >= 6)
            exists = true;
          break;
        case 75: //six 5
          if ((fives + wilds) >= 6)
            exists = true;
          break;
        case 76: //six 6
          if ((sixes + wilds) >= 6)
            exists = true;
          break;
        case 77: //six 7
          if ((sevens + wilds) >= 6)
            exists = true;
          break;
        case 78: //six 8
          if ((eights + wilds) >= 6)
            exists = true;
          break;
        case 79: //six 9
          if ((nines + wilds) >= 6)
            exists = true;
          break;
        case 80: //six 10
          if ((tens + wilds) >= 6)
            exists = true;
          break;
        case 81: //six J
          if ((jacks + wilds) >= 6)
            exists = true;
          break;
        case 82: //six Q
          if ((queens + wilds) >= 6)
            exists = true;
          break;
        case 83: //six K
          if (kings + wilds >= 6)
            exists = true
          break;
        case 84: //six A
          if ((aces + wilds) >= 6)
            exists = true;
          break;
        case 85: //seven 4
          if ((fours + wilds) >= 7)
            exists = true;
          break;
        case 86: //seven 5
          if ((fives + wilds) >= 7)
            exists = true;
          break;
        case 87: //seven 6
          if ((sixes + wilds) >= 7)
            exists = true;
          break;
        case 88: //seven 7
          if ((sevens + wilds) >= 7)
            exists = true;
          break;
        case 89: //seven 8
          if ((eights + wilds) >= 7)
            exists = true;
          break;
        case 90: //seven 9
          if ((nines + wilds) >= 7)
            exists = true;
          break;
        case 91: //seven 10
          if ((tens + wilds) >= 7)
            exists = true;
          break;
        case 92: //seven J
          if ((jacks + wilds) >= 7)
            exists = true;
          break;
        case 93: //seven Q
          if ((queens + wilds) >= 7)
            exists = true;
          break;
        case 94: //seven K
          if (kings + wilds >= 7)
            exists = true
          break;
        case 95: //seven A
          if ((aces + wilds) >= 7)
            exists = true;
          break;
        case 96: //eight 4
          if ((fours + wilds) >= 8)
            exists = true;
          break;
        case 97: //eight 5
          if ((fives + wilds) >= 8)
            exists = true;
          break;
        case 98: //eight 6
          if ((sixes + wilds) >= 8)
            exists = true;
          break;
        case 99: //eight 7
          if ((sevens + wilds) >= 8)
            exists = true;
          break;
        case 100: //eight 8
          if ((eights + wilds) >= 8)
            exists = true;
          break;
        case 101: //eight 9
          if ((nines + wilds) >= 8)
            exists = true;
          break;
        case 102: //eight 10
          if ((tens + wilds) >= 8)
            exists = true;
          break;
        case 103: //eight J
          if ((jacks + wilds) >= 8)
            exists = true;
          break;
        case 104: //eight Q
          if ((queens + wilds) >= 8)
            exists = true;
          break;
        case 105: //eight K
          if (kings + wilds >= 8)
            exists = true
          break;
        case 106: //eight A
          if ((aces + wilds) >= 8)
            exists = true;
          break;
        case 107: //nine 4
          if ((fours + wilds) >= 9)
            exists = true;
          break;
        case 108: //nine 5
          if ((fives + wilds) >= 9)
            exists = true;
          break;
        case 109: //nine 6
          if ((sixes + wilds) >= 9)
            exists = true;
          break;
        case 110: //nine 7
          if ((sevens + wilds) >= 9)
            exists = true;
          break;
        case 111: //nine 8
          if ((eights + wilds) >= 9)
            exists = true;
          break;
        case 112: //nine 9
          if ((nines + wilds) >= 9)
            exists = true;
          break;
        case 113: //nine 10
          if ((tens + wilds) >= 9)
            exists = true;
          break;
        case 114: //nine J
          if ((jacks + wilds) >= 9)
            exists = true;
          break;
        case 115: //nine Q
          if ((queens + wilds) >= 9)
            exists = true;
          break;
        case 116: //nine K
          if (kings + wilds >= 9)
            exists = true
          break;
        case 117: //nine A
          if ((aces + wilds) >= 9)
            exists = true;
          break;
        case 118: //ten 4
          if ((fours + wilds) >= 10)
            exists = true;
          break;
        case 119: //ten 5
          if ((fives + wilds) >= 10)
            exists = true;
          break;
        case 120: //ten 6
          if ((sixes + wilds) >= 10)
            exists = true;
          break;
        case 121: //ten 7
          if ((sevens + wilds) >= 10)
            exists = true;
          break;
        case 122: //ten 8
          if ((eights + wilds) >= 10)
            exists = true;
          break;
        case 123: //ten 9
          if ((nines + wilds) >= 10)
            exists = true;
          break;
        case 124: //ten 10
          if ((tens + wilds) >= 10)
            exists = true;
          break;
        case 125: //ten J
          if ((jacks + wilds) >= 10)
            exists = true;
          break;
        case 126: //ten Q
          if ((queens + wilds) >= 10)
            exists = true;
          break;
        case 127: //ten K
          if (kings + wilds >= 10)
            exists = true
          break;
        case 128: //ten A
          if ((aces + wilds) >= 10)
            exists = true;
          break;
        case 129: //eleven 4
          if ((fours + wilds) >= 11)
            exists = true;
          break;
        case 130: //eleven 5
          if ((fives + wilds) >= 11)
            exists = true;
          break;
        case 131: //eleven 6
          if ((sixes + wilds) >= 11)
            exists = true;
          break;
        case 132: //eleven 7
          if ((sevens + wilds) >= 11)
            exists = true;
          break;
        case 133: //eleven 8
          if ((eights + wilds) >= 11)
            exists = true;
          break;
        case 134: //eleven 9
          if ((nines + wilds) >= 11)
            exists = true;
          break;
        case 135: //eleven 10
          if ((tens + wilds) >= 11)
            exists = true;
          break;
        case 136: //eleven J
          if ((jacks + wilds) >= 11)
            exists = true;
          break;
        case 137: //eleven Q
          if ((queens + wilds) >= 11)
            exists = true;
          break;
        case 138: //eleven K
          if (kings + wilds >= 11)
            exists = true
          break;
        case 139: //eleven A
          if ((aces + wilds) >= 11)
            exists = true;
          break;
        case 140: //twelve 4
          if ((fours + wilds) >= 12)
            exists = true;
          break;
        case 141: //twelve 5
          if ((fives + wilds) >= 12)
            exists = true;
          break;
        case 142: //twelve 6
          if ((sixes + wilds) >= 12)
            exists = true;
          break;
        case 143: //twelve 7
          if ((sevens + wilds) >= 12)
            exists = true;
          break;
        case 144: //twelve 8
          if ((eights + wilds) >= 12)
            exists = true;
          break;
        case 145: //twelve 9
          if ((nines + wilds) >= 12)
            exists = true;
          break;
        case 146: //twelve 10
          if ((tens + wilds) >= 12)
            exists = true;
          break;
        case 147: //twelve J
          if ((jacks + wilds) >= 12)
            exists = true;
          break;
        case 148: //twelve Q
          if ((queens + wilds) >= 12)
            exists = true;
          break;
        case 149: //twelve K
          if (kings + wilds >= 12)
            exists = true
          break;
        case 150: //twelve A
          if ((aces + wilds) >= 12)
            exists = true;
          break;
        case 151: //thirteen 4
          if ((fours + wilds) >= 13)
            exists = true;
          break;
        case 152: //thirteen 5
          if ((fives + wilds) >= 13)
            exists = true;
          break;
        case 153: //thirteen 6
          if ((sixes + wilds) >= 13)
            exists = true;
          break;
        case 154: //thirteen 7
          if ((sevens + wilds) >= 13)
            exists = true;
          break;
        case 155: //thirteen 8
          if ((eights + wilds) >= 13)
            exists = true;
          break;
        case 156: //thirteen 9
          if ((nines + wilds) >= 13)
            exists = true;
          break;
        case 157: //thirteen 10
          if ((tens + wilds) >= 13)
            exists = true;
          break;
        case 158: //thirteen J
          if ((jacks + wilds) >= 13)
            exists = true;
          break;
        case 159: //thirteen Q
          if ((queens + wilds) >= 13)
            exists = true;
          break;
        case 160: //thirteen K
          if (kings + wilds >= 13)
            exists = true
          break;
        case 161: //thirteen A
          if ((aces + wilds) >= 13)
            exists = true;
          break;
        case 162: //fourteen 4
          if ((fours + wilds) >= 14)
            exists = true;
          break;
        case 163: //fourteen 5
          if ((fives + wilds) >= 14)
            exists = true;
          break;
        case 164: //fourteen 6
          if ((sixes + wilds) >= 14)
            exists = true;
          break;
        case 165: //fourteen 7
          if ((sevens + wilds) >= 14)
            exists = true;
          break;
        case 166: //fourteen 8
          if ((eights + wilds) >= 14)
            exists = true;
          break;
        case 167: //fourteen 9
          if ((nines + wilds) >= 14)
            exists = true;
          break;
        case 168: //fourteen 10
          if ((tens + wilds) >= 14)
            exists = true;
          break;
        case 169: //fourteen J
          if ((jacks + wilds) >= 14)
            exists = true;
          break;
        case 170: //fourteen Q
          if ((queens + wilds) >= 14)
            exists = true;
          break;
        case 171: //fourteen K
          if (kings + wilds >= 14)
            exists = true
          break;
        case 172: //fourteen A
          if ((aces + wilds) >= 14)
            exists = true;
          break;
      }
      return new Promise(function(resolve, reject) {
        resolve(exists)
      })
    })
}

module.exports = { init };