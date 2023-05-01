const express = require('express');
const cors = require('cors');
const loginController = require('./controllers/loginController');
const { createBoard, getBoards, updateBoard, getBoard } = require('./controllers/boardsController');
const db = require('./database');
const { addColumn, updateColumn, deleteColumn } = require('./controllers/columnsController');
const { addStory, updateStory, moveStory } = require('./controllers/storiesController');

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

      try {
        const user = db
          .prepare(`SELECT id FROM users WHERE key = ?`)
          .get(key);

        if (user) {
          res.locals.userId = user.id;
          next();
        } else {
          res.json({
            code: 401,
            status: 'error',
            error: 'Invalid API key',
            message: 'Try to login',
          });
        }
      } catch (err) {
        res.json({
          code: 500,
          status: 'error',
          error: err.message,
          message: 'Try again or contact support',
        });
      }
    });

    apiRouter.get('/', (req, res) => {
      res.json({
        name: 'Vueboards API',
        version: '0.0.1',
      });
    });

    apiRouter.get( '/boards', getBoards);
    apiRouter.post('/boards/new', createBoard);
    apiRouter.get( '/boards/:boardId', getBoard);
    apiRouter.post('/boards/:boardId/update', updateBoard);
    apiRouter.post('/boards/:boardId/columns/add', addColumn);
    apiRouter.post('/boards/:boardId/columns/:columnId/update', updateColumn);
    apiRouter.post('/boards/:boardId/columns/:columnId/delete', deleteColumn);
    apiRouter.post('/boards/:boardId/columns/:columnId/stories/add', addStory);
    apiRouter.post('/boards/:boardId/columns/:columnId/stories/:storyId/update', updateStory);
    apiRouter.post('/boards/:boardId/columns/:columnId/stories/:storyId/move/:toColumnId', moveStory);

    app.use('/api', apiRouter);

    app.use((req, res) => {
      res.sendFile(__dirname + '/public/index.html');
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
