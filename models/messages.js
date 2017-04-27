const db = require('./index');

exports.findByUserId = function(id, cb) {
  db.any('SELECT * FROM messages WHERE userid=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'err in messages.findByUserId');
    })
};

exports.findByGameId = function(id, cb) {
  db.any('SELECT * FROM messages WHERE gameid=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'err in messages.findByGameId');
    });
};