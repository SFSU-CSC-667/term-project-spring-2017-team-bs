const db = require('./index');

const CREATE = 'INSERT INTO users(username, password) VALUES($1, $2) RETURNING *'
const FIND_BY_ID = 'SELECT * FROM users WHERE userid=$1'
const FIND_BY_USERNAME = 'SELECT * FROM users WHERE username=$1'

module.exports = {
  create: function(username, password) {
    return db.one( CREATE, [ username, password ] )
  },

  findById: function(id) {
    return db.oneOrNone( FIND_BY_ID, id )
  },

  findByIdPassport: function(id, cb) {
    db.oneOrNone( FIND_BY_ID, id )
      .then(user => {
        cb(null, user)
      })
      .catch(err => {
        cb(err, 'could not find user by id')
      })
  },

  findByUsername: function(username) {
    return db.oneOrNone( FIND_BY_USERNAME, username )
  },

  findByUsernamePassport: function(username, cb) {
    db.oneOrNone( FIND_BY_USERNAME, username )
      .then(user => {
        cb(null, user)
      })
      .catch(err => {
        cb(err, 'could not find user by username')
      })
  }
}