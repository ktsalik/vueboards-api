const users = require('./users');
const db = require('./database');
const queue = [];

setInterval(() => {
  const notification = queue.shift();
  if (notification) {
    console.log(notification);
    const usersKeys = db.prepare(`
      SELECT key
      FROM users
      JOIN board_users ON users.id = board_users.user_id
      WHERE board_id = ? AND users.id != ?
    `).all(notification.boardId, notification.userId);

    usersKeys.map((r) => r.key).forEach((userKey) => {
      const user = users.find((u) => u.key === userKey);
      if (user) {
        user.socket.emit('board-change', notification);
      }
    });
  }
}, 1000);

module.exports = queue;