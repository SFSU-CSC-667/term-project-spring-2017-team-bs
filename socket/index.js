const socketio = require('socket.io')
const { USER_JOINED, MESSAGE_SEND } = require('../constants/events')

const init = ( app, server ) => {
  const io = socketio( server )

  app.set( 'io', io )

  io.on( 'connection', socket => {
    console.log( 'A client connected' )

    socket.on( 'disconnect', data => {
      console.log( 'A client disconnected' )
    })

    socket.on( USER_JOINED, data => {
      console.log(data);
      io.emit( USER_JOINED, data )
    })

    socket.on( MESSAGE_SEND, data => {
      console.log(data);
      io.emit( MESSAGE_SEND, data )
    })
  })
}

module.exports = { init };