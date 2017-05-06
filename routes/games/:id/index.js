var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  if(!req.user){
    req.flash('error', 'Redirected from /games/#, please use the create game and join game buttons');
    res.redirect('/');
  } else {
    res.render('games', {
      userid: req.user.userid,
      username: req.user.username
    });
  }
});

module.exports = router;
