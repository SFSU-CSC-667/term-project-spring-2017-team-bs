var express = require('express');
var router = express.Router();

const passport = require('passport');

const users = require('../models/users.js');
const games = require('../models/games.js');
const gamecards = require('../models/gamecards.js');
const messages = require('../models/messages.js');

//home page
router.get('/', function(req, res, next) {
  if(!req.user) {
    games.all()
      .then(data => {
        res.render('index', {
          message: req.flash('error'),
          openGames: data
        })
      })
      .catch(err => {})
  } else {
    games.all()
      .then(data => {
        res.render('index', {
          message: req.flash('error'),
          username: req.user.username,
          openGames: data
        })
      })
      .catch(err => {})
  }
});

//register page
router.get('/register', function(req, res, next) {
  if(!req.user)
    res.render('register', { message: ''} );
  else
    res.render('register', {
      message: '',
      username: req.user.username
    });
});

//user has registered
router.post('/register', function(req, res, next) {
  users.create(req.body.username, req.body.password)
    .then(user => {
      res.redirect('/login');
    })
    .catch(err => {})
});

//login page
router.get('/login', function(req, res, next) {
  res.render('login', { message: req.flash('error') });
});

//user has logged in
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

//create game
router.post('/games', function(req, res, next) {
  if(!req.user) {
    req.flash('error', 'You must log in first');
    res.redirect('/');
  } else {
    games.create(req.body.room_name, req.body.password, req.user.userid)
      .then(data => {
        gamecards.create(data.gameid)
          .then(() => {
            res.redirect('/games/' + data.gameid)
          })
          .catch(err => {})
      })
      .catch(err => {})
  }
});

//join game
router.post('/games/join', function(req, res, next) {
  if(!req.user) {
    req.flash('error', 'You must log in first');
    res.redirect('/');
  } else {
    gamecards.findNumberOfUsers(req.body.gameid)
      .then(data => {
        if(data[0].count >= 4) {
          req.flash('error', "Could not join game: room is full");
          res.redirect('/');
        } else {
          gamecards.addUser(req.user.userid, req.body.gameid)
            .then(() => {
              res.redirect('/games/' + req.body.gameid);
            })
            .catch(err => {})
        }
      })
      .catch(err => {})
  }
});

module.exports = router;