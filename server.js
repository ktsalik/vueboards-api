const express = require('express');
const cors = require('cors');
const loginController = require('./controllers/loginController');
const { createBoard, getBoards, updateBoard, getBoard } = require('./controllers/boardsController');
const db = require('./database');

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

    app.post('/login', loginController.login);

    const apiRouter = express.Router();

    apiRouter.use((req, res, next) => {
      const key = req.query.key || req.body.key;

      db.get(`SELECT id FROM users WHERE key = ?`, [key], (err, row) => {
        if (err) {
          res.json({
            code: 500,
            status: 'error',
            error: err.message,
            message: 'Contact support',
          });
        } else {
          if (row) {
            res.locals.userId = row.id;
            next();
          } else {
            res.json({
              code: 401,
              status: 'error',
              error: 'Invalid API key',
              message: 'Try to login',
            });
          }
        }
      });
    });

    apiRouter.get('/', (req, res) => {
      res.json({
        name: 'Vueboards API',
        version: '0.0.1',
      });
    });

    apiRouter.post('/boards/new', createBoard);
    apiRouter.get('/boards/:boardId', getBoard);
    apiRouter.get('/boards', getBoards);
    apiRouter.post('/boards/:boardId/update', updateBoard);

    app.use('/api', apiRouter);

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
