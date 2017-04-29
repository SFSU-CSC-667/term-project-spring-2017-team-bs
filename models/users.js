const db = require('./index');

exports.create = function(username, password, cb) {
  db.none('INSERT INTO users(username, password) VALUES($1, $2)', [username, password])
    .then(() => {
      cb(null, 'created new user')
    })
    .catch((err) => {
      cb(err, 'could not create new user');
    });
};

exports.findById = function(id, cb) {
  db.one('SELECT * FROM users WHERE userid=$1', [id])
    .then((user) => {
      cb(null, user);
    })
    .catch((err) => {
      cb(err, 'could not find user by id');
    });
};

exports.findByUsername = function(username, cb) {
  db.one('SELECT * FROM users WHERE username=$1', [username])
    .then((user) => {
      cb(null, user);
    })
    .catch((err) => {
      cb(err, 'could not find user by username');
    });
};