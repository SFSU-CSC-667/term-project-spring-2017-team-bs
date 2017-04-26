const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const users = require('../models/users.js')

const init = () => {

  passport.serializeUser(function(user, done) {
    done(null, user.userid);
  });

  passport.deserializeUser(function(id, done) {
    users.findById(id, function(err, user) {
      if (err) { 
        return done(err);
      }
      done(null, user);
    })
  })

  passport.use(new LocalStrategy(
    function(username, password, done) {
      users.findByUsername(username, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
      })
    }));
};

module.exports = { init };