const db = require('./index');

exports.create = function(room_name, password, cb) {
  db.none('INSERT INTO games(room_name, password) VALUES($1, $2)', [room_name, password])
    .then(() => {
      cb(null, 'created a new game');
    })
    .catch(err => {
      cb(err, 'could not create new game');
    });
};

exports.findByName = function(room_name, cb) {
  db.one('SELECT * FROM games WHERE room_name=$1', [room_name])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find a game by name');
    });
};

exports.findById = function(id, cb) {
  db.one('SELECT * FROM games WHERE gameid=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find a game by id');
    });
};

exports.getAllGames = function(cb) {
  db.any('SELECT * FROM games')
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'err in getAllGames');
    })
};