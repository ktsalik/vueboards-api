const Server = require('./server');
const db = require('./database');
const users = require('./users');
const notificationsQueue = require('./notifications');

const server = new Server();
const io = server.start();

initIo(io);

process.on('exit', function() {
  db.close();
});

function initIo(io) {
  io.on('connection', (socket) => {
    console.log('a user connected');

    users.push({
      key: null,
      socket: socket,
    });

    socket.on('key', (key) => {
      const userIndex = users.findIndex((u) => u.socket.id === socket.id);
      if (userIndex > -1) {
        users[userIndex].key = key;
      }
    });

    socket.on('disconnect', () => {
      const userIndex = users.findIndex((u) => u.socket.id === socket.id);
      if (userIndex > -1) {
        users.splice(userIndex, 1);
      }
    });

    socket.emit('foo', 'bar');
  });
}
