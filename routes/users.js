var express = require('express');
var router = express.Router();

const db = require('../db')

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
	db.any("SELECT username FROM users")
  		.then(users => {
  			console.log(users);
  			res.send(users);
  		})
  		.catch(error => {
  			console.log("error");
  		});
});

module.exports = router;
