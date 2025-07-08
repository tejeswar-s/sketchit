const Room = require('../models/Room');
const { generateRoomCode, getNextDrawer } = require('../shared/utils');
const { MAX_PLAYERS } = require('../shared/constants');

module.exports = function roomHandler(io, socket) {
  let currentRoomCode = null;
  let currentUserId = null;

  // Create room
  socket.on('room:create', async ({ name, avatar, userId }, callback) => {
    const code = generateRoomCode();
    const room = new Room({
      code,
      players: [{ userId, name, avatar, isHost: true, socketId: socket.id }],
    });
    await room.save();
    socket.join(code);
    currentRoomCode = code;
    currentUserId = userId;
    io.to(code).emit('room:update', room);
    callback && callback(room);
  });

  // Join room
  socket.on('room:join', async ({ code, name, avatar, userId }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    if (room.players.length >= MAX_PLAYERS) return callback && callback({ error: 'Room is full' });
    if (room.players.some(p => p.userId === userId)) return callback && callback({ error: 'Already joined' });
    room.players.push({ userId, name, avatar, socketId: socket.id });
    await room.save();
    socket.join(code);
    currentRoomCode = code;
    currentUserId = userId;
    io.to(code).emit('room:update', room);
    callback && callback(room);
  });

  // Leave room
  socket.on('room:leave', async ({ code, userId }, callback) => {
    await handlePlayerLeave(io, code, userId);
    socket.leave(code);
    callback && callback({ message: 'Left room' });
  });

  // Request player list
  socket.on('room:players', async ({ code }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    callback && callback(room.players);
  });

  // Update room settings (from host)
  socket.on('room:updateSettings', async ({ code, settings }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    room.settings = { ...room.settings, ...settings };
    await room.save();
    io.to(code).emit('room:update', room);
    callback && callback(room);
  });

  // Add handler for host closing the room
  socket.on('room-closed', async ({ code }) => {
    const room = await Room.findOne({ code });
    if (!room) return;
    // Notify all participants
    io.to(code).emit('room-closed');
    // Remove all players from the room
    room.players = [];
    await room.save();
    // Make all sockets leave the room
    const clients = await io.in(code).allSockets();
    clients.forEach(sid => io.sockets.sockets.get(sid)?.leave(code));
    // Delete the room
    await Room.deleteOne({ code });
    console.log(`[room-closed] Room ${code} closed and deleted.`);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    if (currentRoomCode && currentUserId) {
      await handlePlayerLeave(io, currentRoomCode, currentUserId);
    }
  });
};

// --- Helper for host/drawer reassignment ---
async function handlePlayerLeave(io, code, userId) {
  const RoomModel = require('../models/Room');
  const { getNextDrawer } = require('../shared/utils');
  const room = await RoomModel.findOne({ code });
  if (!room) return;
  const leavingPlayer = room.players.find(p => p.userId === userId);
  if (!leavingPlayer) return;
  // Remove player
  room.players = room.players.filter(p => p.userId !== userId);
  // If last player leaves, delete room
  if (room.players.length === 0) {
    await RoomModel.deleteOne({ code });
    return;
  }
  // Reassign host if needed
  let hostChanged = false;
  if (leavingPlayer.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    hostChanged = true;
  }
  // If drawer left during their turn, rotate to next eligible drawer
  let drawerChanged = false;
  if (room.gameState && room.gameState.drawingPlayerId === userId && room.players.length > 0) {
    const nextDrawerId = getNextDrawer(room.players, userId);
    room.gameState.drawingPlayerId = nextDrawerId;
    // Reset round state for new drawer
    room.gameState.wordChoices = [];
    room.gameState.currentWord = '';
    room.gameState.guesses = [];
    room.gameState.hint = '';
    room.gameState.phase = 'selecting-word';
    drawerChanged = true;
  }
  await room.save();
  io.to(code).emit('room:update', room);
  if (hostChanged) io.to(code).emit('host-changed', { newHostId: room.players[0].userId });
  if (drawerChanged) io.to(code).emit('drawer-changed', { newDrawerId: room.gameState.drawingPlayerId });
  if (drawerChanged) io.to(code).emit('round-restart', { drawerId: room.gameState.drawingPlayerId });
} 