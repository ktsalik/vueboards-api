const db = require('../database');
const md5 = require('md5');
const uniqid = require('uniqid');
const { isValidEmail } = require('../helpers');

const login = (req, res) => {
  const username = req.body.username;
  const password = md5(req.body.password);
  
  if (username.trim().length === 0 || req.body.password.length === 0) {
    res.json({
      code: 400,
      status: 'error',
      error: 'No username or password provided',
      message: 'Use both username and password to login',
    });
  } else {
    try {
      const user = db
        .prepare(`SELECT * FROM users WHERE username = ? OR email = ?`)
        .get(username, username);

      if (user) {
        if (user.password === password) {
          const key = md5(uniqid());

          db
            .prepare(`UPDATE users SET key = ? WHERE id = ?`)
            .run(key, user.id);

          res.json({
            code: 200,
            status: 'ok',
            key,
          });

        } else {
          res.json({
            code: 401,
            status: 'error',
            error: 'Invalid credentials',
            message: 'Invalid username or password',
          });
        }
      } else {
        const emailGiven = isValidEmail(username);
        const key = md5(uniqid());

        const newUser = db
          .prepare(`INSERT INTO users (${emailGiven ? 'email' : 'username'}, password, key) VALUES (?, ?, ?)`)
          .run(username, password, key);
        
        const createDemoBoard = db.transaction(() => {
          const board = db
            .prepare(`INSERT INTO boards (name, date_created) VALUES (@name, @date_created)`)
            .run({
              name: 'Demo',
              date_created: Date.now(),
            });

          db
            .prepare(`INSERT INTO board_users (board_id, user_id, permissions) VALUES (?, ?, ?)`)
            .run(board.lastInsertRowid, newUser.lastInsertRowid, 'admin');

          const columnTodo = db
            .prepare(`INSERT INTO board_columns (board_id, name) VALUES (${board.lastInsertRowid}, 'Todo')`)
            .run();

          const columnDone = db
            .prepare(`INSERT INTO board_columns (board_id, name) VALUES (${board.lastInsertRowid}, 'Done')`)
            .run();
          
          db
            .prepare(`INSERT INTO stories (column_id, name, description, type, points, state) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(columnTodo.lastInsertRowid, 'Create website header', `The website should have a header component, visible everywhere at the very top of the page.`, 'feature', 3, 1);

          db
            .prepare(`INSERT INTO stories (column_id, name, description, position, type, points, state) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(columnTodo.lastInsertRowid, 'Create website footer', `The website should have a footer component, visible everywhere at the very bottom of the page.`, 2, 'feature', 3, 1);

          db
            .prepare(`INSERT INTO stories (column_id, name, description, position, type, points, state) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(columnTodo.lastInsertRowid, 'Create a menu', `The website should have a navigation menu, visible everywhere below the header component.`, 3, 'feature', 3, 2);
        
          db
            .prepare(`INSERT INTO stories (column_id, name, type, points, state) VALUES (?, ?, ?, ?, ?)`)
            .run(columnDone.lastInsertRowid, 'Create website project directory', 'chore', 0, 4);
        });
        createDemoBoard();

        res.json({
          code: 200,
          status: 'ok',
          key,
        });
      }
    } catch (err) {
      res.json({
        code: 500,
        status: 'error',
        error: err.message,
        message: 'Please try again or contact support',
      });
    }
  }
};

module.exports = {
  login,
};