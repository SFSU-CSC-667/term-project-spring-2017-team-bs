const db = require('./index');

const ALL = 'SELECT * FROM games'
const CHANGE_STATUS = 'UPDATE games SET status=$1 WHERE gameid=$2'
const CREATE = 'INSERT INTO games(room_name, password, status, players_turn) VALUES($1, $2, $3, $4) RETURNING *'
const FIND_BY_ID = 'SELECT * FROM games WHERE gameid=$1'
const FIND_BY_NAME = 'SELECT * FROM games WHERE room_name=$1'
const UPDATE_LAST_HAND_CALLED = 'UPDATE games SET last_hand_called=$1 WHERE gameid=$2 RETURNING *'

module.exports = {
  all: function() {
    return db.any( ALL )
  },

  changeStatus: function(status, gameid) {
    return db.any( CHANGE_STATUS, [status, gameid] )
  },

  create: function(room_name, password, players_turn) {
    return db.one( CREATE, [room_name, password, 'open', players_turn] )
  },

  findById: function(id) {
    return db.one( FIND_BY_ID, id )
  },

  findByName: function(room_name) {
    return db.one( FIND_BY_NAME, room_name )
  },

  updateLastHandCalled: function(handid, gameid) {
    return db.one( UPDATE_LAST_HAND_CALLED, [handid, gameid] )
  }
  
}