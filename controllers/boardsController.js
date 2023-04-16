const db = require('../database');

const createBoard = (req, res) => {
  const key = req.body.key;
  const newBoardName = req.body.name;

  if (newBoardName.length > 0) {
    db.run(`
      INSERT INTO boards (name, date_created) VALUES (?, ?);
    `, [
      newBoardName,
      Date.now(),
    ], function(err) {
      if (err) {
        res.json({
          code: 500,
          status: 'error',
          error: err.message,
          message: 'Contact support',
        });
      } else {
        db.run(`
          INSERT INTO board_users (board_id, user_id, permissions) VALUES (?, ?, ?)
        `, [
          this.lastID,
          res.locals.userId,
          'admin',
        ], (err) => {
          if (err) {
            console.log(err);
            res.json({
              code: 500,
              status: 'error',
              error: err.message,
              message: 'Contact support',
            });
          } else {
            res.json({
              code: 200,
              status: 'ok',
            });
          }
        })
      }
    });
  }
};

const getBoards = (req, res) => {
  db.all(`
    SELECT *
    FROM boards
    JOIN board_users ON boards.id = board_users.board_id
    WHERE user_id = ?
    ORDER BY id DESC
  `, [res.locals.userId], (err, rows) => {
    if (err) {
      console.log(err);
      res.json({
        code: 500,
        status: 'error',
        error: err,
        message: 'Contact support',
      });
    } else {
      const boards = rows.map((record) => {
        return {
          id: record.id,
          name: record.name,
          date: record.date_created,
        };
      });
      res.json(boards);
    }
  });
};

const getBoard = (req, res) => {
  db.get(`
    SELECT *
    FROM boards
    JOIN board_users ON boards.id = board_users.board_id
    WHERE id = ? AND user_id = ? AND permissions = 'admin'
  `, [
    req.params.boardId,
    res.locals.userId,
  ], (err, row) => {
    if (err) {
      console.log(err);
      res.json({
        code: 500,
        status: 'error',
        error: 'Cannot get board',
        message: 'Try again or contact support',
      });
    } else {
      res.json(row);
    }
  });
};

const updateBoard = async (req, res) => {
  const boardId = req.params.boardId;
  
  try {
    const board = await new Promise((resolve, reject) => {
      db.get(`
        SELECT *
        FROM boards
        JOIN board_users ON boards.id = board_users.board_id
        WHERE id = ? AND user_id = ? AND permissions = 'admin'
      `, [
        boardId,
        res.locals.userId,
      ], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (board) {
      if (req.body.name && req.body.name.trim().length > 0) {
        board.name = req.body.name;
      }
      
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE boards
          SET name = ?
          WHERE id = ?
        `, [
          board.name,
          boardId,
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      res.json({
        code: 200,
        status: 'ok',
      });
    } else {
      res.json({
        code: 400,
        status: 'error',
        error: 'Not authorized',
        message: 'Contact support',
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      code: 500,
      status: 'error',
      error: err.message,
      message: 'Please try again or contact support',
    });
  }
};

const deleteBoard = (req, res) => {

};

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
};
