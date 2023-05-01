const db = require('../database');

const createBoard = (req, res) => {
  const newBoardName = req.body.name.trim();

  if (newBoardName.length > 0) {
    try {
      const newBoard = db
        .prepare(`INSERT INTO boards (name, date_created) VALUES (?, ?)`)
        .run(newBoardName, Date.now());

      db
        .prepare(`INSERT INTO board_users (board_id, user_id, permissions) VALUES (?, ?, ?)`)
        .run(newBoard.lastInsertRowid, res.locals.userId, 'admin');

      res.json({
        code: 200,
        status: 'ok',
      });
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

const getBoards = (req, res) => {
  try {
    const boardsData = db
      .prepare(`
        SELECT *
        FROM boards
        JOIN board_users ON boards.id = board_users.board_id
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(res.locals.userId);

    const boards = boardsData.map((record) => {
      return {
        id: record.id,
        name: record.name,
        date: record.date_created,
      };
    });

    res.json({
      code: 200,
      status: 'ok',
      data: boards,
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

const getBoard = (req, res) => {
  try {
    const board = db
      .prepare(`
        SELECT *
        FROM boards
        JOIN board_users ON boards.id = board_users.board_id
        WHERE id = ? AND user_id = ?
      `)
      .get(req.params.boardId, res.locals.userId);

    if (board) {
      const columns = db
        .prepare(`SELECT * FROM board_columns WHERE board_id = ?`)
        .all(board.id);
      
      board.columns = columns.map((column) => {
        return {
          id: column.id,
          name: column.name,
        };
      });

      board.columns.forEach((column, i, columns) => {
        const stories = db
          .prepare(`SELECT * FROM stories WHERE column_id = ? ORDER BY position ASC, id DESC`)
          .all(column.id);
        
        columns[i].stories = stories.map((story) => {
          return {
            id: story.id,
            name: story.name,
            date: story.date,
            type: story.type,
            points: story.points,
            state: story.state,
            description: story.description,
          };
        });
      });

      res.json({
        code: 200,
        status: 'ok',
        data: board,
      });
    } else {
      res.json({
        code: 404,
        status: 'not found',
        message: `Board with id ${req.params.boardId} not found`,
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
};

const updateBoard = async (req, res) => {
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
      let newName;
      
      if (req.body.name && req.body.name.trim().length > 0) {
        newName = req.body.name.trim();
      } else {
        newName = board.name;
      }

      db
        .prepare(`UPDATE boards SET name = ? WHERE id = ?`)
        .run(newName, board.id);
      
      res.json({
        code: 200,
        status: 'ok',
      });
    } else {
      res.json({
        code: 400,
        status: 'error',
        error: 'Not authorized',
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
};

const deleteBoard = (req, res) => {
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
      db
        .prepare(`DELETE FROM boards WHERE id = ?`)
        .run(board.id);
      
      res.json({
        code: 200,
        status: 'ok',
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
};

module.exports = {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
};
