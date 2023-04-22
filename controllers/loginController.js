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

        db
          .prepare(`INSERT INTO users (${emailGiven ? 'email' : 'username'}, password, key) VALUES (?, ?, ?)`)
          .run(username, password, key);
        
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