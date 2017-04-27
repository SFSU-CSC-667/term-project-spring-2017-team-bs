const db = require('./index');

exports.findById = function(id, cb) {
  db.one('SELECT * FROM cards WHERE cardid=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find card by id');
    });
};

exports.findByRank = function(rank, cb) {
  db.many('SELECT * FROM cards WHERE rank=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find cards by rank');
    });
};

exports.findBySuit = function(suit, cb) {
  db.many('SELECT * FROM cards WHERE suit=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find cards by suit');
    });
};

exports.findByWild = function(wild, cb) {
  db.many('SELECT * FROM cards WHERE wild=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find cards by wild');
    });
};