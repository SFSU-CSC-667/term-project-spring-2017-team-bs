const db = require('./index');

exports.findById = function(id, cb) {
  db.one('SELECT * FROM hands WHERE handid=$1', [id])
    .then(data => {
      cb(null, data);
    })
    .catch(err => {
      cb(err, 'could not find hand by id');
    });
};