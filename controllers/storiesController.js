const db = require('../database');
const notificationsQueue = require('../notifications');

const addStory = (req, res) => {
  const boardId = parseInt(req.params.boardId);
  const columnId = parseInt(req.params.columnId);

  try {
    const isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);

    if (isAllowed) {
      const name = req.body.name.trim();

      let type = req.body.type;
      if (['feature', 'bug', 'chore', 'release'].indexOf(type) === -1) {
        type = 'other';
      }

      let points;
      const p = parseInt(req.body.points);
      if (p >= -1 && p <= 5) {
        points = p;
      } else {
        points = -1;
      }

      let state
      const s = parseInt(req.body.state);
      if (s >= -1 && s <= 4) {
        state = s;
      } else {
        state = 0;
      }

      let description = '';
      if ('description' in req.body && typeof req.body.description === 'string') {
        description = req.body.description.trim();
      }
      
      const storyAdd = db
        .prepare(`INSERT INTO stories (column_id, name, type, points, state, description) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(columnId, name, type, points, state, description);
      
      const story = db
        .prepare(`SELECT * FROM stories WHERE id = ?`)
        .get(storyAdd.lastInsertRowid);

      notificationsQueue.push({
        userId: res.locals.userId,
        boardId: boardId,
        type: 'story-add',
        data: {
          columnId,
          story: {
            id: story.id,
            name: story.name,
            date: story.date,
            type: story.type,
            points: story.points,
            state: story.state,
            description: story.description,
            position: story.position,
          },
        },
      });

      res.json({
        code: 200,
        status: 'ok',
        data: {
          story: {
            id: story.id,
            name: story.name,
            date: story.date,
            type: story.type,
            points: story.points,
            state: story.state,
            description: story.description,
          },
        },
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
  const boardId = parseInt(req.params.boardId);
  const columnId = parseInt(req.params.columnId);
  const storyId = parseInt(req.params.storyId);

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
        let name = story.name, type = story.type, points = story.points, state = story.state, description = story.description;

        if ('name' in req.body && req.body.name.trim().length > 0) {
          name = req.body.name.trim();
        }

        if ('type' in req.body && ['feature', 'bug', 'chore', 'release', 'other'].indexOf(req.body.type) > -1) {
          type = req.body.type;
        }

        if ('points' in req.body) {
          const p = parseInt(req.body.points);

          if (p >= -1 && p <= 5) {
            points = p;
          }
        }

        if ('state' in req.body) {
          const s = parseInt(req.body.state);

          if (s >= -1 && state <= 4) {
            state = s;
          }
        }

        if ('description' in req.body && typeof req.body.description === 'string') {
          description = req.body.description.trim();
        }
        
        db
          .prepare(`UPDATE stories SET name = ?, type = ?, points = ?, state = ?, description = ? WHERE id = ?`)
          .run(name, type, points, state, description, storyId);

        notificationsQueue.push({
          userId: res.locals.userId,
          boardId: boardId,
          type: 'story-update',
          data: {
            columnId,
            story: {
              id: storyId,
              name: name,
              date: story.date,
              type: type,
              points: points,
              state: state,
              description: description,
              position: story.position,
            },
          },
        });

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

const moveStory = (req, res) => {
  const boardId = parseInt(req.params.boardId);
  const columnId = parseInt(req.params.columnId);
  const storyId = parseInt(req.params.storyId);
  const toColumnId = parseInt(req.params.toColumnId);

  try {
    let isAllowed = hasPermissionsToBoard(res.locals.userId, boardId, ['write', 'admin']);
    const columnBelongsToBoard = db
      .prepare(`SELECT COUNT(*) AS count FROM board_columns WHERE board_id = ? AND id = ?`)
      .get(boardId, columnId).count === 1;
    
    isAllowed &= columnBelongsToBoard;

    const storyBelongsToColumn = db
      .prepare(`SELECT COUNT(*) AS count FROM stories WHERE column_id = ? AND id = ?`)
      .get(columnId, storyId).count === 1;
    
    isAllowed &= storyBelongsToColumn;

    if (columnId !== toColumnId) {
      const moveToColumnBelongsToBoard = db
        .prepare(`SELECT COUNT(*) AS count FROM board_columns WHERE board_id = ? AND id = ?`)
        .get(boardId, toColumnId).count === 1;
      
      isAllowed &= moveToColumnBelongsToBoard;
    }

    if (isAllowed) {
      if (columnId !== toColumnId) {
        db
          .prepare(`UPDATE stories SET column_id = ? WHERE id = ?`)
          .run(toColumnId, storyId);
      }
      
      const storiesInColumn = db
        .prepare(`
          SELECT *
          FROM stories
          WHERE column_id = ? AND id != ?
          ORDER BY position ASC, id ASC
        `)
        .all(toColumnId, storyId);

      const positions = {
        [storyId]: req.body.position,
      };

      let pos = 1;
      if (pos === parseInt(req.body.position)) {
        pos++;
      }
      for (let i = 0; i < storiesInColumn.length; i++) {
        positions[storiesInColumn[i].id] = pos;

        pos++;
        if (pos === parseInt(req.body.position)) {
          pos++;
        }
      }

      for (let storyId in positions) {
        db
          .prepare(`UPDATE stories SET position = ? WHERE id = ?`)
          .run(positions[storyId], storyId);
      }

      notificationsQueue.push({
        userId: res.locals.userId,
        boardId: boardId,
        type: 'story-move',
        data: {
          story: {
            id: storyId,
          },
        },
      });

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
  moveStory,
};
