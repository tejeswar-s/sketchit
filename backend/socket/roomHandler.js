const Room = require('../models/Room');
const { generateRoomCode, getNextDrawer, shuffleArray } = require('../shared/utils');
const { MAX_PLAYERS } = require('../shared/constants');
const { wordCategories, defaultCategory } = require('../shared/words');

function generateWords(count, theme = defaultCategory) {
  const availableWords = wordCategories[theme] || wordCategories[defaultCategory];
  return shuffleArray([...availableWords]).slice(0, count);
}

module.exports = function roomHandler(io, socket) {
  let currentRoomCode = null;
  let currentUserId = null;

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

  socket.on('room:join', async ({ code, name, avatar, userId }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    if (room.players.length >= MAX_PLAYERS) return callback && callback({ error: 'Room is full' });
    if (room.players.some(p => p.userId === userId)) return callback && callback({ error: 'Already joined' });
    // If game is in-progress, add as pending and nextRoundPending
    const isPending = room.status === 'in-progress' && room.gameState && room.gameState.phase !== 'waiting';
    room.players.push({ userId, name, avatar, socketId: socket.id, pending: isPending, nextRoundPending: isPending });
    await room.save();
    socket.join(code);
    currentRoomCode = code;
    currentUserId = userId;
    io.to(code).emit('room:update', room);
    callback && callback(room);
  });

  socket.on('room:leave', async ({ code, userId }, callback) => {
    await handlePlayerLeave(io, code, userId);
    socket.leave(code);
    callback && callback({ message: 'Left room' });
  });

  socket.on('room:players', async ({ code }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    callback && callback(room.players);
  });

  socket.on('room:updateSettings', async ({ code, settings }, callback) => {
    console.log('[Settings Save] Received settings from frontend:', settings);
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    room.settings = { ...room.settings, ...settings };
    if (room.status === 'in-progress' && room.gameState) {
      if (settings.roundTime !== undefined) room.gameState.timer = settings.roundTime;
      if (settings.wordCount !== undefined) room.gameState.wordChoices = room.gameState.wordChoices ? room.gameState.wordChoices.slice(0, settings.wordCount) : [];
      if (settings.hintIntervals !== undefined) room.gameState.hintIntervals = settings.hintIntervals;
      if (settings.maxRounds !== undefined) room.gameState.maxRounds = settings.maxRounds;
    }
    await room.save();
    console.log('[Settings Save] Room after save:', room.settings);
    io.to(code).emit('room:update', room);
    callback && callback(room);
  });

  socket.on('start-game', async ({ code, userId }) => {
    const room = await Room.findOne({ code });
    if (!room) return;
    if (!room.players.find(p => p.userId === userId)?.isHost) return;

    const settings = room.settings || {};
    const { maxRounds = 3, roundTime = 60, wordCount = 3, hintIntervals = [15, 30] } = settings;

    const playerOrder = shuffleArray(room.players.map(p => p.userId));

    room.status = 'in-progress';
    room.currentRound = 1;
    room.drawerIndex = 0;
    room.playerOrder = playerOrder;
    const drawerId = playerOrder[0];

    const theme = settings.theme || defaultCategory;
    room.gameState = {
      round: 1,
      maxRounds,
      drawingPlayerId: drawerId,
      wordChoices: generateWords(wordCount, theme),
      currentWord: '',
      guesses: [],
      hint: '',
      phase: 'selecting-word',
      timer: roundTime,
      hintIntervals,
    };

    await room.save();
    io.to(code).emit('room:update', room);
    io.to(code).emit('round-start', {
      drawerId,
      round: 1,
      maxRounds,
      wordChoices: room.gameState.wordChoices,
      playerOrder,
    });
  });

  socket.on('play-again', async ({ code, userId }, callback) => {
    // No longer needed: just acknowledge
    callback && callback({ success: true });
  });

  socket.on('exit-game', async ({ code, userId }, callback) => {
    await handlePlayerLeave(io, code, userId);
    socket.leave(code);
    callback && callback({ success: true });
  });

  socket.on('room-closed', async ({ code }) => {
    const room = await Room.findOne({ code });
    if (!room) return;
    io.to(code).emit('room-closed');
    room.players = [];
    await room.save();
    const clients = await io.in(code).allSockets();
    clients.forEach(sid => io.sockets.sockets.get(sid)?.leave(code));
    await Room.deleteOne({ code });
    console.log(`[room-closed] Room ${code} closed and deleted.`);
  });

  socket.on('disconnect', async () => {
    if (currentRoomCode && currentUserId) {
      await handlePlayerLeave(io, currentRoomCode, currentUserId);
    }
  });

  // WebRTC voice chat signaling relays
  socket.on('voice-offer', ({ code, offer, from }) => {
    socket.to(code).emit('voice-offer', { offer, from });
  });
  socket.on('voice-answer', ({ code, answer, from }) => {
    socket.to(code).emit('voice-answer', { answer, from });
  });
  socket.on('voice-ice-candidate', ({ code, candidate, from }) => {
    socket.to(code).emit('voice-ice-candidate', { candidate, from });
  });

  // Mic status relay
  socket.on('mic-status', ({ code, userId, isMicOn }) => {
    io.to(code).emit('mic-status', { userId, isMicOn });
  });

  // Global mute relay
  socket.on('global-mute', ({ code, muted }) => {
    io.to(code).emit('global-mute', { muted });
  });
};

async function handlePlayerLeave(io, code, userId) {
  const RoomModel = require('../models/Room');
  const { getNextDrawer } = require('../shared/utils');
  const room = await RoomModel.findOne({ code });
  if (!room) return;
  const leavingPlayer = room.players.find(p => p.userId === userId);
  if (!leavingPlayer) return;

  room.players = room.players.filter(p => p.userId !== userId);

  if (room.players.length === 0) {
    await RoomModel.deleteOne({ code });
    return;
  }

  if (room.players.length === 1) {
    // Only one player left: close and delete the room immediately
    const lastSocketId = room.players[0].socketId;
    io.to(code).emit('room-closed');
    await RoomModel.deleteOne({ code });
    if (lastSocketId) io.sockets.sockets.get(lastSocketId)?.leave(code);
    return;
  }

  let hostChanged = false;
  let drawerWasHost = false;
  if (leavingPlayer.isHost && room.players.length > 0) {
    room.players[0].isHost = true;
    hostChanged = true;
    // Check if host was also the drawer
    if (room.gameState && room.gameState.drawingPlayerId === userId) {
      drawerWasHost = true;
    }
  }

  if (room.gameState && room.gameState.drawingPlayerId === userId && room.players.length > 0) {
    // Instead of assigning a new drawer, end the round with 0 scores and reveal the word
    // Set all guesses to incorrect and score 0
    room.gameState.guesses = room.players.map(p => ({ userId: p.userId, guess: '', correct: false, score: 0 }));
    await room.save();
    // Instead of calling gameHandler.endRound (not exported), emit a custom event to all sockets in the room
    io.to(code).emit('force-end-round');
    return; // End here, as the frontend/gameHandler should handle the next round
  }

  await room.save();
  io.to(code).emit('room:update', room);
  if (hostChanged) io.to(code).emit('host-changed', { newHostId: room.players[0].userId });
  if (drawerWasHost) io.to(code).emit('drawer-changed', { newDrawerId: room.gameState.drawingPlayerId });
  if (drawerWasHost) io.to(code).emit('round-restart', { drawerId: room.gameState.drawingPlayerId });
}
