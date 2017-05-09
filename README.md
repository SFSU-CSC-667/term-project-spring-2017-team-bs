# term-project-spring-2017-team-bs

## BS Poker Game
[https://bspoker.herokuapp.com](https://bspoker.herokuapp.com)

### Local DB Setup:
1. Install postgres
2. Switch to the postgres user (`sudo -i -u postgres`)
3. Do `psql bspoker` to create a database named `bspoker`
4. While in psql, do `ALTER ROLE postgres WITH PASSWORD 'bspoker';`
5. Exit psql (`\q`), and do `psql bspoker < bspoker`, where the latter bspoker is the name of the database dump located at `/models/bspoker`

### Instructions:
1. `git clone https://github.com/SFSU-CSC-667/term-project-spring-2017-team-bs.git`
2. `cd term-project-spring-2017-team-bs`
3. `npm install`
4. `npm start`
5. Open a browser and go to `localhost:3000`

### Things to fix:
* Turn order is not representative of what the client sees (not clockwise)
* The host can make calls before everyone draws their cards
* Player turn timer
