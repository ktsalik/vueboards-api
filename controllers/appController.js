const db = require('../database');

const searchUser = (req, res) => {
  try {
    const searchQuery = `%${req.params.searchQuery}%`;

    const users = db
      .prepare(`
        SELECT username, email
        FROM users
        WHERE username LIKE ? OR email LIKE ?
      `)
      .all(searchQuery, searchQuery);

    res.json({
      code: 200,
      status: 'ok',
      data: users,
    });
  } catch (err) {
    res.json({
      code: 500,
      status: 'error',
      error: err.message,
      message: 'Please try again or contact support',
    });
  }
};

const addUserToBoard = (req, res) => {
  const boardId = req.params.boardId;
  
  try {
    const board = db
      .prepare(`
        SELECT *
        FROM boards
        JOIN board_users ON boards.id = board_users.board_id
        WHERE id = ? AND user_id = ? AND permissions = 'admin'
      `)
      .get(boardId, res.locals.userId);
    
    if (board) {
      const user = db
        .prepare(`
          SELECT id
          FROM users
          WHERE username = ? OR email = ?
        `)
        .get(req.body.username, req.body.username);

      if (user) {
        db
          .prepare(`
            INSERT INTO board_users (board_id, user_id, permissions) VALUES (?, ?, ?)
          `)
          .run(boardId, user.id, 'admin');

        res.json({
          code: 200,
          status: 'ok',
        });
      } else {
        res.json({
          code: 400,
          status: 'error',
          error: 'user not found',
        });
      }
    }
  } catch (err) {
    res.json({
      code: 500,
      status: 'error',
      error: err.message,
      message: 'Please try again or contact support',
    });
  }
};

module.exports = {
  searchUser,
  addUserToBoard,
};