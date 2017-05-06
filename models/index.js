const pgp = require('pg-promise')();

const localConnection = {
	database: 'bspoker',
	user: 'postgres',
	password: 'bspoker'
};

const connection = process.env.DATABASE_URL || localConnection;

const db = pgp(connection);

db.connect()
	.then(() => {
		console.log("Successfully connected to database");
	})
	.catch(error => {
		console.log(error);
	});

module.exports = db;