const db = require('./index');

const ADD_CARD = 'UPDATE game_cards SET userid=$1 WHERE gameid=$2 AND cardid=$3 RETURNING *'
const ADD_USER = 'INSERT INTO game_cards(userid, gameid) VALUES($1, $2) RETURNING *'
const CREATE = 'INSERT INTO game_cards(gameid, cardid) SELECT $1, c.cardid FROM cards c'
const DELETE_USER = 'DELETE FROM game_cards WHERE userid=$1 AND gameid=$2 RETURNING *'

const DRAW_HAND_AND_ADD = `UPDATE game_cards SET userid=$1 WHERE gameid=$2 AND cardid IN
(SELECT cardid FROM game_cards WHERE gameid=$2 AND userid IS NULL ORDER BY random() LIMIT $3) RETURNING *`

const FIND_CARDS_BY_USERID = 'SELECT * FROM game_cards WHERE gameid=$1 AND userid=$2'
const FIND_CARDS_IN_PLAY = 'SELECT * FROM game_cards WHERE gameid=$1 AND userid IS NOT NULL'
const FIND_CARDS_NOT_IN_PLAY = 'SELECT COUNT(*) AS count FROM game_cards WHERE gameid=$1 AND userid IS NULL AND cardid IS NOT NULL'
const FIND_DISTINCT_USERS = 'SELECT DISTINCT userid FROM game_cards WHERE gameid=$1 AND userid IS NOT NULL'
const FIND_NUMBER_OF_USERS = `SELECT COUNT(*) AS count FROM 
(SELECT DISTINCT userid FROM game_cards WHERE gameid=$1 AND userid IS NOT NULL) AS temp`

const GET = 'SELECT * FROM game_cards WHERE gameid=$1'
const RESET = 'UPDATE game_cards SET userid=NULL WHERE gameid=$1'

module.exports = {
  addCard: function(userid, gameid, cardid) {
    return db.one( ADD_CARD, [userid, gameid, cardid] )
  },

  addUser: function(userid, gameid) {
    return db.one( ADD_USER, [userid, gameid] )
  },

  create: function(gameid) {
    return db.none( CREATE, gameid )
  },

  deleteUser: function(userid, gameid) {
    return db.one( DELETE_USER, [userid, gameid] )
  },

  drawHandAndAdd: function(userid, gameid, numberOfCards) {
    return db.any( DRAW_HAND_AND_ADD, [userid, gameid, numberOfCards] )
  },

  findCardsByUserId: function(gameid, userid) {
    return db.any( FIND_CARDS_BY_USERID, [gameid, userid] )
  },

  findCardsInPlay: function(gameid) {
    return db.any( FIND_CARDS_IN_PLAY, gameid )
  },

  findCardsNotInPlay: function(gameid) {
    return db.any( FIND_CARDS_NOT_IN_PLAY, gameid )
  },

  findDistinctUsers: function(gameid) {
    return db.any( FIND_DISTINCT_USERS, gameid )
  },

  findNumberOfUsers: function(gameid) {
    return db.any( FIND_NUMBER_OF_USERS, gameid )
  },

  get: function(gameid) {
    return db.any( GET, gameid)
  },

  reset: function(gameid) {
    return db.none( RESET, gameid)
  }
}