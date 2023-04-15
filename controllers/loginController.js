const db = require('../database');
const md5 = require('md5');
const uniqid = require('uniqid');
const { isValidEmail } = require('../helpers');

const login = (req, res) => {
  const username = req.body.username;
  const password = md5(req.body.password);
  
  if (username.length === 0 || req.body.password.length === 0) {
    res.json({
      code: 400,
      status: 'error',
      error: 'No username or password provided',
      message: 'Use both username and password to login',
    });
  } else {
    db.get(`
      SELECT *
      FROM users
      WHERE username = ? OR email = ?
    `, [
      username,
      username,
    ], (err, row) => {
      if (err) {
        console.log(err);
      } else {
        const key = md5(uniqid());

        if (row) {
          if (row.password === password) {
            db.run(`
              UPDATE users SET key = ? WHERE id = ?
            `, [
              key,
              row.id,
            ], (err) => {
              if (err) {
                console.log(err);
              } else {
                res.json({
                  code: 200,
                  status: 'ok',
                  key,
                });
              }
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

          db.run(`
            INSERT INTO users (${emailGiven ? 'email' : 'username'}, password, key) VALUES (?, ?, ?)
          `, [
            username,
            password,
            key,
          ], (err) => {
            if (err) {
              console.log(err);
            }

            res.json({
              code: 200,
              status: 'ok',
              key,
            });
          });
        }
      }
    });
  }
};

module.exports = {
  login,
};