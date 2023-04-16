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
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT NOT NULL,
        email TEXT,
        key TEXT
      );
    `, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Table users created');
      }
    });

  
    db.run(`
      CREATE TABLE IF NOT EXISTS boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date_created TEXT
      );
    `, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Table boards created');
      }
    });

  
    db.run(`
      CREATE TABLE IF NOT EXISTS board_users (
        board_id INTEGER,
        user_id INTEGER,
        permissions TEXT NOT NULL DEFAULT 'read',
        PRIMARY KEY (board_id, user_id)
      );
    `, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('Table board_users created');
      }
    });
  });
}