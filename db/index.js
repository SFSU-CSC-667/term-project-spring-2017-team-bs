const pgp = require('pg-promise')();

const connection = {
	database: 'bspoker',
	user: 'postgres',
	password: 'bspoker'
};

const db = pgp(connection);

db.connect()
	.then(() => {
		console.log("Successfully connected to database");
	})
	.catch(error => {
		console.log(error);
	});

module.exports = db;