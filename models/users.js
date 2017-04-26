const db = require('./index');

exports.create = function(username, password) {
  // db.task(t => {
  //   return t.none('SELECT * FROM users WHERE username=$1' [username])
  //     .then(() => {
  //         return t.none('INSERT INTO users(username, password) VALUES($1, $2)', [username, password])
  //     });
  // })
  //   .then(() => {
  //     console.log("Added a user to db");
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  db.none('INSERT INTO users(username, password) VALUES($1, $2)', [username, password])
    .then(() => {
      console.log("Added a user to db");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.findById = function(id, cb) {
  db.one('SELECT * FROM users WHERE userid=$1', [id])
    .then((user) => {
      console.log("Found " + user.username + " by id");
      cb(null, user);
    })
    .catch((err) => {
      console.log(err);
      cb(null, false);
    });
};

exports.findByUsername = function(username, cb) {
  db.one('SELECT * FROM users WHERE username=$1', [username])
    .then((user) => {
      console.log("Found " + user.username + " by username");
      cb(null, user);
    })
    .catch((err) => {
      console.log(err);
      cb(null, false);
    });
};