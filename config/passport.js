const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const users = require('../models/users.js')

const init = () => {

  passport.serializeUser(function(user, cb) {
    cb(null, user.userid);
  });

  passport.deserializeUser(function(id, cb) {
    users.findById(id, function(err, user) {
      if (err) { 
        return cb(err);
      }
      cb(null, user);
    })
  })

  passport.use(new LocalStrategy(
    function(username, password, cb) {
      users.findByUsername(username, function (err, user) {
        if (err) {
          return cb(err);
        }
        if (!user) {
          return cb(null, false, { message: 'Incorrect username' });
        }
        if (user.password !== password) {
          return cb(null, false, { message: 'Incorrect password' });
        }
        return cb(null, user);
      })
    }));
};

module.exports = { init };