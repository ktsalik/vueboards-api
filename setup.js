const sqlite3 = require('sqlite3');

let db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Database created');
    createTables();
  }

  db.close();
});

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      email TEXT,
      key TEXT
    );
  `, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('users table created');
    }
  });
}