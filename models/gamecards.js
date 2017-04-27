const db = require('./index');

exports.findCardsInPlay = function(gameid, cb) {
  db.any('SELECT * FROM game_cards WHERE gameid=$1 AND userid!=0', [gameid])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'err in gamecards.findCardsInPlay');
    });
};

exports.findCardsByUserId = function(gameid, userid, cb) {
  db.any('SELECT * FROM game_cards WHERE gameid=$1 AND userid=$2', [gameid, userid])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'err in gamecards.findCardsByUserId');
    });
};

exports.resetDeck = function(gameid, cb) {
  db.none('UPDATE game_cards SET userid = 0 WHERE gameid=$1', [gameid])
    .then(() => {
      cb(null, 'deck has been reset');
    })
    .catch(err => {
      cb(err, 'err in gamecards.resetDeck');
    });
};