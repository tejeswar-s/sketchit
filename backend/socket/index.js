const { Server } = require('socket.io');
const roomHandler = require('./roomHandler');
const gameHandler = require('./gameHandler');
const moderationHandler = require('./moderationHandler');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  io.on('connection', (socket) => {
    roomHandler(io, socket);
    gameHandler(io, socket);
    moderationHandler(io, socket);
  });

  return io;
}

module.exports = initSocket; 