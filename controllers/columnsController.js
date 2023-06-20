const db = require('../database');
const notificationsQueue = require('../notifications');

const addColumn = (req, res) => {
  const boardId = parseInt(req.params.boardId);
  const columnName = req.body.name.trim();

  try {
    const isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);

    if (isAllowed) {
      if (columnName.length > 0) {
        const columnAdd = db
          .prepare(`INSERT INTO board_columns (board_id, name) VALUES (?, ?)`)
          .run(boardId, columnName);
        
        notificationsQueue.push({
          userId: res.locals.userId,
          boardId,
          type: 'column-add',
          data: {
            id: columnAdd.lastInsertRowid,
            name: columnName,
          },
        });

        res.json({
          code: 200,
          status: 'ok',
          data: {
            newColumnId: columnAdd.lastInsertRowid,
          },
        });
      } else {
        res.json({
          code: 400,
          status: 'error',
          error: 'No column name provided',
          message: 'Please provide a valid column name',
        });
      }
    } else {
      res.json({
        code: 401,
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

const updateColumn = async (req, res) => {
  const boardId = parseInt(req.params.boardId);
  const columnId = parseInt(req.params.columnId);

  try {
    const isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);

    if (isAllowed) {
      const boardColumn = db
        .prepare(`SELECT * FROM board_columns WHERE id = ? AND board_id = ?`)
        .get(columnId, boardId);
      
      if (boardColumn) {
        if (req.body.name.trim().length > 0) {
          db
            .prepare(`UPDATE board_columns SET name = ? WHERE id = ?`)
            .run(req.body.name.trim(), boardColumn.id)

          notificationsQueue.push({
            userId: res.locals.userId,
            boardId,
            type: 'column-update',
            data: {
              id: boardColumn.id,
              name: req.body.name.trim(),
            },
          });

          res.json({
            code: 200,
            status: 'ok',
          });
        } else {
          res.json({
            code: 200,
            status: 'error',
            error: 'Invalid column name provided',
            message: 'Please provide a valid column name',
          });
        }
      } else {
        res.json({
          code: 404,
          status: 'Not found',
          error: `Board column with id ${columnId} not found`,
        });
      }
    } else {
      res.json({
        code: 401,
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

const deleteColumn = (req, res) => {
  const boardId = parseInt(req.params.boardId);
  const columnId = parseInt(req.params.columnId);

  try {
    const isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);

    if (isAllowed) {
      db
        .prepare(`DELETE FROM board_columns WHERE id = ? AND board_id = ?`)
        .run(columnId, boardId);
      
      notificationsQueue.push({
        userId: res.locals.userId,
        boardId,
        type: 'column-delete',
        data: {
          id: columnId,
        },
      });

      res.json({
        code: 200,
        status: 'ok',
      });
    } else {
      res.json({
        code: 401,
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

function hasPermissionsToBoard(userId, boardId, permissions) {
  const query = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM boards
      JOIN board_users ON boards.id = board_users.board_id
      WHERE id = ? AND user_id = ? AND permissions IN (${permissions.map((p) => '?').join(',')})
    `)
    .get(boardId, userId, ...permissions);

  return query.count === 1;
}

module.exports = {
  addColumn,
  updateColumn,
  deleteColumn,
};
