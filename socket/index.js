const socketio = require('socket.io');
const { CALL_BS, CALL_HAND, LOBBY, MESSAGE_SEND, USER_JOINED, USER_LEFT } = require('../constants/events.js');

const db = require('../models/index.js');

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

    socket.on(USER_JOINED, function(data) {
      socket.to(data.gameid).emit(USER_JOINED, data);
    });

    socket.on(USER_LEFT, function(data) {
      socket.to(data.gameid).emit(USER_LEFT, data);
    });

    socket.on(MESSAGE_SEND, function(data) {
      db.none('INSERT INTO messages(gameid, userid, message) VALUES($1, $2, $3)', [data.gameid, data.userid, data.message])
        .then(() => {
          console.log('added a message to messages table');
        })
        .catch(err => {
          console.log(err);
        });
      io.to(data.gameid).emit(MESSAGE_SEND, data);
    });

  });

};

module.exports = { init };