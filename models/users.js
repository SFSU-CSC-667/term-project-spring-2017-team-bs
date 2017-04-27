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
      console.log("found " + user.username + " by id");
      cb(null, user);
    })
    .catch((err) => {
      console.log(err);
      cb(err, 'could not find user by id');
    });
};

exports.findByUsername = function(username, cb) {
  db.one('SELECT * FROM users WHERE username=$1', [username])
    .then((user) => {
      console.log("found " + user.username + " by username");
      cb(null, user);
    })
    .catch((err) => {
      console.log(err);
      cb(err, 'could not find user by username');
    });
};