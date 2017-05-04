var express = require('express');
var router = express.Router();

const passport = require('passport');
const bcrypt = require('bcrypt');

const users = require('../models/users.js');
const games = require('../models/games.js');
const gamecards = require('../models/gamecards.js');
const messages = require('../models/messages.js');

//home page
router.get('/', function(req, res, next) {
  if(!req.user) {
    games.allOpen()
      .then(data => {
        res.render('index', {
          message: req.flash('error'),
          openGames: data
        })
      })
      .catch(err => {})
  } else {
    games.allOpen()
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
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    users.create(req.body.username, hash)
      .then(user => {
        res.redirect('/login');
      })
      .catch(err => {})
  })
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
    if(req.body.password == '') {
      games.create(req.body.room_name, req.body.password, req.user.userid)
        .then(data => {
          gamecards.create(data.gameid)
            .then(() => {
              res.redirect('/games/' + data.gameid)
            })
            .catch(err => {})
        })
    } else {
      bcrypt.hash(req.body.password, 10, function(err, hash) {
        games.create(req.body.room_name, hash, req.user.userid)
          .then(data => {
            gamecards.create(data.gameid)
              .then(() => {
                res.redirect('/games/' + data.gameid)
              })
              .catch(err => {})
          })
          .catch(err => {})
      })
    }
  }
});

//join game
router.post('/games/join', function(req, res, next) {
  if(!req.user) {
    req.flash('error', 'You must log in first');
    res.redirect('/');
  } else {
    games.findById(req.body.gameid)
      .then(data1 => {
        if(data1.password !== '') {
          bcrypt.compare(req.body.joinPassword, data1.password, function(err, match) {
            if (match == true) {
              gamecards.addUser(req.user.userid, req.body.gameid)
                .then(data2 => {
                  res.redirect('/games/' + req.body.gameid);
                })
                .catch(err => {console.log(err)})
            } else {
              req.flash('error', 'Incorrect password');
              res.redirect('/');
            }
          })
        } else {
          gamecards.addUser(req.user.userid, req.body.gameid)
            .then(data2 => {
              res.redirect('/games/' + req.body.gameid);
            })
            .catch(err => {console.log(err)})
        }
      })
      .catch(err => {console.log(err)})
  }
});

module.exports = router;