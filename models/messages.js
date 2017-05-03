const db = require('./index');

const ADD = 'INSERT INTO messages(gameid, userid, message) VALUES($1, $2, $3)'
const FIND_BY_GAMEID = 'SELECT * FROM messages WHERE gameid=$1'
const FIND_BY_USERID = 'SELECT * FROM messages WHERE userid=$1'

module.exports = {
  add: function(gameid, userid, message) {
    return db.none( ADD, [gameid, userid, message] )
  },

  findByGameId: function(id) {
    return db.any( FIND_BY_GAMEID, id )
  },

  findByUserId: function(id) {
    return db.any( FIND_BY_USERID, id )
  }
}