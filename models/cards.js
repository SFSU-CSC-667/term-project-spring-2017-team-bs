const db = require('./index');

const FIND_BY_ID = 'SELECT * FROM cards WHERE cardid=$1'
const FIND_BY_RANK = 'SELECT * FROM cards WHERE rank=$1'
const FIND_BY_SUIT = 'SELECT * FROM cards WHERE suit=$1'
const FIND_BY_WILD = 'SELECT * FROM cards WHERE wild=$1'

module.exports = {
  findById: function(id) {
    return db.one( FIND_BY_ID, id )
  },

  findByRank: function(rank) {
    return db.many( FIND_BY_RANK, rank )
  },

  findBySuit: function(suit) {
    return db.many( FIND_BY_SUIT, suit )
  },

  findByWild: function(wild) {
    return db.many( FIND_BY_WILD, wild )
  }
}