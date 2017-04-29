var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  req.flash('error', 'Redirected from /games, please use the create game and join game buttons');
  res.redirect('/');
});

module.exports = router;
