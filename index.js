const Server = require('./server');
const db = require('./database');

const server = new Server();
const io = server.start();

initIo(io);

process.on('exit', function() {
  db.close();
});

function initIo(io) {
  
}
