const Room = require('../models/Room');
const words = require('../shared/words');
const { shuffleArray, getHint, calculateScore } = require('../shared/utils');

// In-memory timers (reset on server restart)
const roomTimers = {};
const hintTimers = {};

module.exports = function gameHandler(io, socket) {
  // Host starts the game
  socket.on('start-game', async ({ code, userId }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    const host = room.players.find(p => p.isHost);
    if (!host || host.userId !== userId) return callback && callback({ error: 'Only host can start' });
    // Shuffle player order
    const playerOrder = shuffleArray(room.players.map(p => p.userId));
    room.status = 'in-progress';
    room.currentRound = 1;
    room.drawerIndex = 0;
    room.playerOrder = playerOrder;
    await room.save();
    startRound(io, code);
    callback && callback({ success: true });
  });

  // Drawer selects a word
  socket.on('word-select', async ({ code, userId, word }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    const drawerId = room.playerOrder[room.drawerIndex];
    if (userId !== drawerId) return callback && callback({ error: 'Not your turn' });
    if (!room.gameState.wordChoices.includes(word)) return callback && callback({ error: 'Invalid word' });
    clearRoomTimers(code); // Clear the word select timer before starting drawing phase
    console.log(`[word-select] Timer cleared for code: ${code}`);
    await startDrawingPhase(io, code, word);
    // Emit updated room state to all clients
    const updatedRoom = await Room.findOne({ code });
    io.to(code).emit('room:update', updatedRoom);
    callback && callback({ success: true });
  });

  // Drawing data relay
  socket.on('draw-data', ({ code, data }) => {
    socket.to(code).emit('draw-data', data);
  });

  // Player submits a guess
  socket.on('guess', async ({ code, userId, guess }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    if (room.status !== 'in-progress') return callback && callback({ error: 'Game not in progress' });
    if (userId === room.gameState.drawingPlayerId) return callback && callback({ error: 'Drawer cannot guess' });
    // If already guessed correctly, ignore
    if (room.gameState.guesses.find(g => g.userId === userId && g.correct)) return callback && callback({ error: 'Already guessed' });
    const correct = guess.trim().toLowerCase() === room.gameState.currentWord.toLowerCase();
    let score = 0;
    if (correct) {
      score = calculateScore(room.gameState.timer, room.settings.roundTime);
      const player = room.players.find(p => p.userId === userId);
      if (player) player.score += score;
    }
    room.gameState.guesses.push({ userId, guess, correct, time: Date.now(), score });
    await room.save();
    io.to(code).emit('guess-result', { userId, guess, correct, score });
    callback && callback({ correct, score });
    // End round if all non-drawers guessed
    const nonDrawers = room.players.filter(p => p.userId !== room.gameState.drawingPlayerId);
    const correctGuessers = room.gameState.guesses.filter(g => g.correct).map(g => g.userId);
    if (nonDrawers.every(p => correctGuessers.includes(p.userId))) {
      endRound(io, code);
    }
  });

  // Replay game
  socket.on('replay', async ({ code }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    room.players.forEach(p => { p.score = 0; });
    room.status = 'in-progress';
    room.currentRound = 1;
    room.drawerIndex = 0;
    // Shuffle player order for new game
    room.playerOrder = shuffleArray(room.players.map(p => p.userId));
    await room.save();
    startRound(io, code);
    io.to(code).emit('game:reset');
    callback && callback({ success: true });
  });

  // Exit game handler
  socket.on('exit-game', async ({ code, userId }) => {
    const room = await Room.findOne({ code });
    if (!room) return;
    room.players = room.players.filter(p => p.userId !== userId);
    if (room.players.length === 0) {
      await Room.deleteOne({ code });
    } else {
      await room.save();
      io.to(code).emit('room:update', room);
    }
  });

  socket.on('fill', ({ x, y, color }) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    // Broadcast to all clients in the room (including sender for consistency)
    io.to(roomCode).emit('fill', { x, y, color });
  });
};

// --- Helper Functions ---

async function emitGameEnd(io, code, room) {
  // Sort leaderboard by score descending
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  io.to(code).emit('game-end', {
    leaderboard: sorted.map(p => ({ userId: p.userId, name: p.name, score: p.score, avatar: p.avatar })),
  });
}

async function startRound(io, code) {
  clearRoomTimers(code);
  const room = await Room.findOne({ code });
  if (!room) return;
  // HARD GUARD: If game is ended or rounds exceeded, do nothing
  if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    room.status = 'ended';
    room.gameState.phase = 'ended';
    room.gameState.round = room.currentRound;
    await room.save();
    console.log(`[startRound] ABORT: Game ended or rounds exceeded (currentRound=${room.currentRound}, maxRounds=${room.settings.maxRounds}, status=${room.status})`);
    await emitGameEnd(io, code, room);
    return;
  }
  // If all players have drawn, increment round and reset drawerIndex
  if (room.drawerIndex >= room.playerOrder.length) {
    room.currentRound++;
    room.drawerIndex = 0;
    room.gameState.round = room.currentRound;
    // End game if all rounds complete (check immediately after increment)
    if (room.currentRound > room.settings.maxRounds) {
      room.status = 'ended';
      room.gameState.phase = 'ended';
      room.gameState.round = room.currentRound;
      await room.save();
      console.log(`[startRound] Emitting game-end (currentRound > maxRounds)`);
      await emitGameEnd(io, code, room);
      return;
    }
  }
  room.gameState.round = room.currentRound;
  const drawerId = room.playerOrder[room.drawerIndex];
  const wordChoices = shuffleArray([...words]).slice(0, 3);
  room.gameState = {
    ...room.gameState,
    round: room.currentRound,
    maxRounds: room.settings.maxRounds,
    drawingPlayerId: drawerId,
    wordChoices,
    currentWord: '',
    guesses: [],
    phase: 'selecting-word',
    timer: 10, // word select timer
    hint: '',
  };
  await room.save();
  io.to(code).emit('room:update', room);
  io.to(code).emit('round-start', {
    drawerId,
    wordChoices,
    round: room.currentRound,
    maxRounds: room.settings.maxRounds,
    playerOrder: room.playerOrder,
  });
  roomTimers[code] = setTimeout(() => {
    autoSelectWord(io, code);
  }, 10000);
}

async function autoSelectWord(io, code) {
  clearRoomTimers(code); // Always clear timers before proceeding
  const room = await Room.findOne({ code });
  if (!room) return;
  // HARD GUARD: If game is ended or rounds exceeded, do nothing
  if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    console.log(`[autoSelectWord] ABORT: Game ended or rounds exceeded (currentRound=${room.currentRound}, maxRounds=${room.settings.maxRounds}, status=${room.status})`);
    return;
  }
  const word = room.gameState.wordChoices[0];
  console.log('autoSelectWord called, auto-selecting word:', word);
  await startDrawingPhase(io, code, word);
  const updatedRoom = await Room.findOne({ code });
  io.to(code).emit('room:update', updatedRoom); // Emit updated room state after auto-select
}

// Utility: Randomized hint generator
function getHintRandom(word, level, revealedIndexes) {
  const revealable = word.split('').map((c, i) => (c !== ' ' ? i : null)).filter(i => i !== null);
  const numToReveal = Math.floor(revealable.length * (level / 3));
  while (revealedIndexes.length < numToReveal) {
    const idx = revealable[Math.floor(Math.random() * revealable.length)];
    if (!revealedIndexes.includes(idx)) {
      revealedIndexes.push(idx);
    }
  }
  return word
    .split('')
    .map((char, idx) => (char === ' ' ? ' ' : revealedIndexes.includes(idx) ? char : '_'))
    .join(' ');
}

async function startDrawingPhase(io, code, word) {
  console.log('startDrawingPhase called for code:', code, 'with word:', word);
  clearRoomTimers(code);
  const room = await Room.findOne({ code });
  if (!room) return;
  if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    console.log(`[startDrawingPhase] ABORT: Game ended or rounds exceeded (currentRound=${room.currentRound}, maxRounds=${room.settings.maxRounds}, status=${room.status})`);
    return;
  }
  room.gameState.currentWord = word;
  room.gameState.phase = 'drawing';
  room.gameState.timer = room.settings.roundTime;
  room.gameState.hint = maskWord(word);
  room.gameState.guesses = [];
  room.gameState.wordChoices = [];
  room.gameState.hintLevel = 0;
  await room.save();
  io.to(code).emit('word-selected', {
    maskedWord: maskWord(word),
    roundTime: room.settings.roundTime,
    autoSelected: false,
    word: word,
    drawerId: room.gameState.drawingPlayerId
  });
  // Dynamic randomized hint system
  const roundTime = room.settings.roundTime;
  const hintIntervals = [Math.floor(roundTime / 3), Math.floor((2 * roundTime) / 3), 0];
  let revealedIndexes = [];
  let hintLevel = 0;
  roomTimers[code] = setInterval(async () => {
    const room = await Room.findOne({ code });
    if (!room) return;
    if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
      clearRoomTimers(code);
      return;
    }
    room.gameState.timer--;
    await room.save();
    io.to(code).emit('timer-update', { timeLeft: room.gameState.timer });
    // Reveal next hint at each interval
    if (hintLevel < 3 && room.gameState.timer === hintIntervals[hintLevel]) {
      hintLevel++;
      room.gameState.hintLevel = hintLevel;
      const hint = getHintRandom(word, hintLevel, revealedIndexes);
      room.gameState.hint = hint;
      await room.save();
      // Only emit to guessers (not drawer)
      const guessers = room.players.filter(p => p.userId !== room.gameState.drawingPlayerId);
      let delivered = 0;
      guessers.forEach(p => {
        if (p.socketId) {
          io.to(p.socketId).emit('hint-update', { hint });
          delivered++;
        }
      });
      if (delivered === 0) {
        // Fallback: emit to room (all guessers will see, including drawer, but better than nothing)
        io.to(code).emit('hint-update', { hint });
        console.log(`[hint-update] Fallback: emitted to room ${code}`);
      } else {
        console.log(`[hint-update] Sent to ${delivered} guessers in room ${code}`);
      }
    }
    if (room.gameState.timer <= 0) {
      clearRoomTimers(code);
      if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) return;
      endRound(io, code);
    }
  }, 1000);
}

function maskWord(word) {
  return word.split('').map(c => (c === ' ' ? ' ' : '_')).join(' ');
}

function clearRoomTimers(code) {
  let cleared = false;
  if (roomTimers[code]) {
    clearTimeout(roomTimers[code]);
    clearInterval(roomTimers[code]);
    delete roomTimers[code];
    cleared = true;
  }
  if (hintTimers[code]) {
    clearInterval(hintTimers[code]);
    delete hintTimers[code];
    cleared = true;
  }
  if (cleared) {
    console.log(`[clearRoomTimers] Cleared timers for code: ${code}`);
  }
}

async function endRound(io, code) {
  clearRoomTimers(code);
  const room = await Room.findOne({ code });
  if (!room) return;
  // HARD GUARD: If game is ended or rounds exceeded, do nothing
  if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    room.status = 'ended';
    room.gameState.phase = 'ended';
    room.gameState.round = room.currentRound;
    await room.save();
    console.log(`[endRound] ABORT: Game ended or rounds exceeded (currentRound=${room.currentRound}, maxRounds=${room.settings.maxRounds}, status=${room.status})`);
    await emitGameEnd(io, code, room);
    return;
  }
  room.gameState.phase = 'round-end';
  // Award drawer points: e.g., 500 * number of correct guessers
  const correctGuessers = room.gameState.guesses.filter(g => g.correct).map(g => g.userId);
  const drawer = room.players.find(p => p.userId === room.gameState.drawingPlayerId);
  if (drawer) drawer.score += correctGuessers.length * 500;
  await room.save(); // Save updated scores before emitting
  io.to(code).emit('room:update', room); // Emit updated room state
  io.to(code).emit('round-end', {
    word: room.gameState.currentWord,
    scores: room.players.map(p => ({ userId: p.userId, score: p.score })),
    guesses: room.gameState.guesses,
  });
  console.log(`[endRound] Emitted round-end with updated scores for code: ${code}`);
  // Next round or end game after short pause
  setTimeout(async () => {
    const latestRoom = await Room.findOne({ code });
    if (!latestRoom) return;
    if (latestRoom.status === 'ended' || latestRoom.currentRound > latestRoom.settings.maxRounds) {
      latestRoom.status = 'ended';
      latestRoom.gameState.phase = 'ended';
      latestRoom.gameState.round = latestRoom.currentRound;
      await latestRoom.save();
      console.log(`[endRound->setTimeout] ABORT: Game ended or rounds exceeded (currentRound=${latestRoom.currentRound}, maxRounds=${latestRoom.settings.maxRounds}, status=${latestRoom.status})`);
      await emitGameEnd(io, code, latestRoom);
      return;
    }
    nextRoundOrEnd(io, code);
  }, 4000);
}

async function nextRoundOrEnd(io, code) {
  const room = await Room.findOne({ code });
  if (!room) return;
  // HARD GUARD: If game is ended or rounds exceeded, do nothing
  if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    room.status = 'ended';
    room.gameState.phase = 'ended';
    room.gameState.round = room.currentRound;
    await room.save();
    console.log(`[nextRoundOrEnd] ABORT: Game ended or rounds exceeded (currentRound=${room.currentRound}, maxRounds=${room.settings.maxRounds}, status=${room.status})`);
    await emitGameEnd(io, code, room);
    return;
  }
  room.drawerIndex++;
  if (room.drawerIndex >= room.playerOrder.length) {
    room.currentRound++;
    room.drawerIndex = 0;
    room.gameState.round = room.currentRound;
    if (room.currentRound > room.settings.maxRounds) {
      room.status = 'ended';
      room.gameState.phase = 'ended';
      room.gameState.round = room.currentRound;
      await room.save();
      console.log(`[nextRoundOrEnd] Emitting game-end (currentRound > maxRounds)`);
      await emitGameEnd(io, code, room);
      return;
    }
  }
  room.gameState.round = room.currentRound;
  await room.save();
  startRound(io, code);
} 