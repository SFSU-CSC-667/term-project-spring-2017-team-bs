var express = require('express');
var router = express.Router();

const passport = require('passport');

const users = require('../models/users.js');
const games = require('../models/games.js');
const gamecards = require('../models/gamecards.js');
const messages = require('../models/messages.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.user) {
    games.getAllGames(function(err, data) {
      if(err)
        res.render('index', { message: req.flash('error') } );
      else
        res.render('index', {
          message: req.flash('error'),
          openGames: data
        });
    });
  } else {
    games.getAllGames(function(err, data) {
      if(err)
        res.render('index', {
          message: req.flash('error'),
          username: req.user.username 
        });
      else
        res.render('index', {
          message: req.flash('error'),
          username: req.user.username,
          openGames: data
        });
    });
  }
});

router.get('/register', function(req, res, next) {
  if(!req.user)
    res.render('register', { message: ''} );
  else
    res.render('register', {
      message: '',
      username: req.user.username
    });
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
  if(!req.user)
    res.render('index', { message: 'You must log in first' } );
  else {
    games.create(req.body.room_name, req.body.password, function(err, data) {
      if (err) { res.render('index', { message: data } ); }
      else {
        games.findByName(req.body.room_name, function(err, data) {
          if (err)
            res.render('index', { message: data } );
          else
            res.redirect('/games/' + data.gameid);
        });
      }
    });
  }
});

router.post('/games/join', function(req, res, next) {
  //check if user is logged in
  if(!req.user) {
    req.flash('error', 'You must log in first');
    res.redirect('/');
  } else {
    //check if the room has 4 or more players (full room)
    gamecards.findNumberOfUsersByGameId(req.body.gameid, function(err, data) {
      if(err) {
        req.flash('error', 'Could not join game');
        res.redirect('/');
      } else {
        //do not add user because room is full
        if(data[0].count >= 4) {
          req.flash('error', 'Could not join game: room is full');
          res.redirect('/');          
        } else {
          //add user
          gamecards.addUser(req.user.userid, req.body.gameid, function(err, data) {
            if(err) {
              req.flash('error', 'Could not join game');
              res.redirect('/');
            } else {
              res.redirect('/games/' + req.body.gameid);
            }
          });
        }
      }
    });
  }
});

module.exports = router;