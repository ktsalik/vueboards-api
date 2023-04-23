const db = require('../database');

const addStory = (req, res) => {
  const boardId = req.params.boardId;
  const columnId = req.params.columnId;

  try {
    const isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);

    if (isAllowed) {
      const name = req.body.name.trim();
      let state = parseInt(req.body.state);
      if (state < -1 || state > 4) {
        state = 0;
      }
      let points = parseInt(req.body.points);
      if (points < -1 || points > 5) {
        points = -1;
      }
      
      db
        .prepare(`INSERT INTO stories (column_id, name, state, points) VALUES (?, ?, ?, ?)`)
        .run(columnId, name, state, points);
      
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

const updateStory = (req, res) => {
  const boardId = req.params.boardId;
  const columnId = req.params.columnId;
  const storyId = req.params.storyId;

  try {
    let isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);
    const columnBelongsToBoard = db
      .prepare(`SELECT COUNT(*) AS count FROM board_columns WHERE board_id = ? AND id = ?`)
      .get(boardId, columnId).count === 1;
    isAllowed &= columnBelongsToBoard;

    if (isAllowed) {
      const story = db
        .prepare(`SELECT * FROM stories WHERE id = ? AND column_id = ?`)
        .get(storyId, columnId);

      if (story) {
        let name = story.name, state = story.state, points = story.points, description = story.description;

        if ('name' in req.body && req.body.name.trim().length > 0) {
          name = req.body.name.trim();
        }

        if ('state' in req.body) {
          state = parseInt(req.body.state);

          if (state < -1 || state > 4) {
            state = 0;
          }
        }

        if ('points' in req.body) {
          points = parseInt(req.body.points);

          if (points < -1 || points > 5) {
            points = -1;
          }
        }

        if ('description' in req.body) {
          description = req.body.description;
        }
        
        db
          .prepare(`UPDATE stories SET name = ?, state = ?, points = ?, description = ? WHERE id = ?`)
          .run(name, state, points, description, storyId);

        res.json({
          code: 200,
          status: 'ok',
        });
      } else {
        res.json({
          code: 200,
          status: 'ok',
          message: 'No changes',
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
  addStory,
  updateStory,
};
