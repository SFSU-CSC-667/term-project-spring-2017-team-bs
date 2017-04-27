var express = require('express');
var router = express.Router();

const passport = require('passport');

const users = require('../models/users.js');
const games = require('../models/games.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.user) {
    res.render('index', { message: ''} );
  } else {
    res.render('index', {
      message : '',
      username: req.user.username } );
  }
});

router.get('/register', function(req, res, next) {
  res.render('register', { message: ''});
});

router.post('/register', function(req, res, next) {
  users.create(req.body.username, req.body.password, function(err, data) {
    if(err) {
      console.log(err);
      res.render('register', { message: 'Username has already been taken' } );
    } else {
      console.log(data)
      res.redirect('/login');
    }
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', { message: req.flash('error') });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

router.post('/games', function(req, res, next) {
  games.create(req.body.room_name, req.body.password, function(err, data) {
    if (err) { res.render('index', { message: data } ); }
    else {
      console.log(data);
      games.findByName(req.body.room_name, function(err, data) {
        if (err) {
          console.log(err);
          res.render('index', { message: data } );
        } else { res.redirect('/games/' + data.gameid); }
      });
    }
  });
});

module.exports = router;