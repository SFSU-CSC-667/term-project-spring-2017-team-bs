var express = require('express');
var router = express.Router();

const db = require('../db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'BS Poker' });
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Create an account'});
});

module.exports = router;
