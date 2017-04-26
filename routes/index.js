var express = require('express');
var router = express.Router();

const passport = require('passport');

const users = require('../models/users.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.user) {
    res.render('index', {
      title: 'BS Poker'
    });
  } else {
  res.render('index', {
    title: 'BS Poker',
    username: req.user.username });
  }
});

router.get('/register', function(req, res, next) {
  res.render('register', { message: ''});
});

router.post('/register', function(req, res, next) {
  users.create(req.body.username, req.body.password);
  res.redirect('login');
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
  res.send('/games');
});

module.exports = router;
