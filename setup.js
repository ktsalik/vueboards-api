const Database = require('better-sqlite3');

const db = new Database('database.db', { verbose: console.log });

const createTables = db.transaction(() => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      key TEXT
    );
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date_created TEXT
    );
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS board_users (
      board_id INTEGER,
      user_id INTEGER,
      permissions TEXT NOT NULL DEFAULT 'read',
      PRIMARY KEY (board_id, user_id)
    );
  `).run();
  
  db.prepare(`
    CREATE TABLE IF NOT EXISTS board_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER,
      name TEXT
    );
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id INTEGER,
      name TEXT,
      date TEXT,
      type TEXT,
      state INTEGER,
      points INTEGER,
      description TEXT
    );
  `).run();
});

createTables();
