var express = require('express');
var router = express.Router();

const gamecards = require('../../../models/gamecards.js')

router.get('/', function(req, res, next) {
  if(!req.user){
    req.flash('error', 'Redirected from /games/#, please use the create game and join game buttons');
    res.redirect('/');
  } else {
    console.log(req.baseUrl.split("/")[2])
    var gameid = req.baseUrl.split("/")[2]
    gamecards.isUserInGame(req.user.userid, gameid)
      .then(data => {
        if (data) {
          res.render('games', {
            userid: req.user.userid,
            username: req.user.username
          });
        } else {
          req.flash('error', 'This game either does not exist or you do not have permission to join this game');
          res.redirect('/');
        }
      })
      .catch(err => {
        req.flash('error', 'An internal error has occured')
        res.redirect('/')
        console.log(err)
      })
  }
});

module.exports = router;
