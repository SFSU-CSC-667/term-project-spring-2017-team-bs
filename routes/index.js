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
      .catch(err => {
        console.log(err)
      })
  } else {
    games.allOpen()
      .then(data => {
        res.render('index', {
          message: req.flash('error'),
          username: req.user.username,
          openGames: data
        })
      })
      .catch(err => {
        console.log(err)
      })
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
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      return users.create(req.body.username, hash)
    })
    .then(user => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err)
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
        .then(data1 => {
          return gamecards.create(data1.gameid)
        })
        .then(data2 => {
          return gamecards.addUser(req.user.userid, data2[0].gameid)
        })
        .then(data3 => {
          res.redirect('/games/' + data3.gameid)
        })
        .catch(err => {
          console.log(err)
        })
    } else {
      bcrypt.hash(req.body.password, 10)
        .then(hash => {
          return games.create(req.body.room_name, hash, req.user.userid)
        })
        .then(data1 => {
          return gamecards.create(data1.gameid)
        })
        .then(data2 => {
          res.redirect('/games/' + data2.gameid)
        })
        .catch(err => {
          console.log(err)
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
          return bcrypt.compare(req.body.joinPassword, data1.password)
        } else {
          return new Promise(function(resolve, reject) {
            resolve(true)
          })
        }
      })
      .then(match => {
        if (match == true)
          return gamecards.isUserInGame(req.user.userid, req.body.gameid)
        else {
          req.flash('error', 'Incorrect password')
          res.redirect('/')
          return new Promise(function(resolve, reject) {
            reject('')
          })
        }
      })
      .then(data2 => {
        if (data2) {
          req.flash('error', 'You are already in this game')
          res.redirect('/')
          return new Promise(function(resolve, reject) {
            reject('');
          })
        } else {
          return gamecards.addUser(req.user.userid, req.body.gameid)
        }
      })
      .then(data3 => {
        res.redirect('/games/' + data3.gameid)
      })
      .catch(err => {
        console.log(err)
      })
  }
});

module.exports = router;