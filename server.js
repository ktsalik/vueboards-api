const express = require('express');
const cors = require('cors');
const loginController = require('./controllers/loginController');

class Server {
  constructor() {
    const port = process.env.PORT || 3001;
    const app = express();
    const http = require('http');
    const server = http.createServer(app);
    const SocketIo = require("socket.io");
    const io = new SocketIo.Server(server, {
      cors: {
        origin: "*",
      },
    });

    app.use(cors());
    app.use(express.json());
    app.use(express.static(__dirname + '/public'));

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/public/index.html');
    });

    app.get('/api', (req, res) => {
      res.json({
        name: 'Vueboards API',
        version: '0.0.1',
      });
    });

    app.post('/login', loginController.login);

    app.use((req, res) => {
      res.sendFile(__dirname + '/public/index.html');
    });

    io.on('connection', (socket) => {
      console.log('a user connected');

      socket.emit('foo', 'bar');
    });

    this.app = app;
    this.server = server;
    this.io = io;
    this.port = port;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Vueboards server started at ${this.port}`)
    });

    return this.io;
  }
}

module.exports = Server;
