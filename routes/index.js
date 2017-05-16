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
        req.flash('error', 'An internal error has occured')
        res.redirect('/')
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
        req.flash('error', 'An internal error has occured')
        res.redirect('/')
        console.log(err)
      })
  }
});

router.post('/register', function(req, res, next) {
  bcrypt.hash(req.body.registerPassword, 10)
    .then(hash => {
      return users.create(req.body.registerUsername, hash)
    })
    .then(user => {
      req.flash('error', 'Please log in');
      res.redirect('/');
    })
    .catch(err => {
      console.log(err)
      req.flash('error', 'That username already exists')
      res.redirect('/');
    })
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/',
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
          req.flash('error', 'An internal error has occured')
          res.redirect('/')
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
          req.flash('error', 'An internal error has occured')
          res.redirect('/')
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
        req.flash('error', 'An internal error has occured')
        res.redirect('/')
        console.log(err)
      })
  }
});

module.exports = router;