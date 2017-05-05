const db = require('./index');

const FIND_BY_ID = 'SELECT * FROM hands WHERE handid=$1'
const FIND_BY_DESCRIPTION = 'SELECT * FROM hands WHERE description=$1'

module.exports = {
  findById: function(id) {
    return db.oneOrNone( FIND_BY_ID, id )
  },

  findByDescription: function(description) {
    return db.oneOrNone( FIND_BY_DESCRIPTION, description )
  }
}