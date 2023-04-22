const Database = require('better-sqlite3');

const db = new Database('database.db', {
  
});
console.log('Connected to database');

module.exports = db;