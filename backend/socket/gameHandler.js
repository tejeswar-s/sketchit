const Room = require('../models/Room');
const { wordCategories, defaultCategory } = require('../shared/words');
const { shuffleArray, getHint, calculateScore, isCloseGuess } = require('../shared/utils');

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
    if (room.players.length < 2) return callback && callback({ error: 'At least 2 players are required to start the game.' });
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
    
    const guessLower = guess.trim().toLowerCase();
    const correctWord = room.gameState.currentWord.toLowerCase();
    const correct = guessLower === correctWord;
    
    // Check if guess is close (differs by only one character)
    const isClose = !correct && isCloseGuess(guessLower, correctWord);
    
    let score = 0;
    if (correct) {
      score = calculateScore(room.gameState.timer, room.settings.roundTime);
      const player = room.players.find(p => p.userId === userId);
      if (player) player.score += score;
    }
    
    room.gameState.guesses.push({ userId, guess, correct, isClose, time: Date.now(), score });
    await room.save();
    
    // Emit to all players with different data for the guesser vs others
    io.to(code).emit('guess-result', { 
      userId, 
      guess, 
      correct, 
      isClose,
      score,
      // Only show close status to the user who made the guess
      showCloseToUser: userId 
    });
    
    callback && callback({ correct, isClose, score });
    
    // End round if all non-drawers guessed
    const nonDrawers = room.players.filter(p => p.userId !== room.gameState.drawingPlayerId && !p.pending && !p.nextRoundPending);
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
    room.status = 'waiting';
    room.currentRound = 1;
    room.drawerIndex = 0;
    // Do NOT start the game or call startRound here
    await room.save();
    io.to(code).emit('room:update', room);
    io.to(code).emit('room:replay');
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

  socket.on('force-end-round', async ({ code }) => {
    await endRound(io, code);
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

  // Activate only those who were marked nextRoundPending at the end of the previous round
  let newPlayers = false;
  room.players.forEach(p => {
    if (p.nextRoundPending) {
      p.pending = false;
      p.nextRoundPending = false;
      p.score = 0;
      if (!room.playerOrder.includes(p.userId)) {
        room.playerOrder.push(p.userId);
      }
      newPlayers = true;
    }
  });
  if (newPlayers) {
    // Shuffle new players into the order after current drawer
    // (or just append for simplicity)
  }

  // Rotate drawer
  const drawerId = room.playerOrder[room.drawerIndex];
  const wordCount = room.settings.wordCount || 3;
  
  // Get theme from settings, default to general
  const theme = room.settings?.theme || defaultCategory;
  const availableWords = wordCategories[theme] || wordCategories[defaultCategory];
  const wordChoices = shuffleArray([...availableWords]).slice(0, wordCount);

  room.gameState = {
    ...room.gameState,
    round: room.currentRound,
    maxRounds: room.settings.maxRounds,
    drawingPlayerId: drawerId,
    wordChoices,
    currentWord: '',
    guesses: [],
    phase: 'selecting-word',
    timer: 10,
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
  if (room.status === 'ended' || room.currentRound >= room.settings.maxRounds) {
    room.status = 'ended';
    room.gameState.phase = 'ended';
    const safeMaxRounds = typeof room.settings.maxRounds === 'number' && !isNaN(room.settings.maxRounds) ? room.settings.maxRounds : 1;
    room.gameState.round = safeMaxRounds;
    await room.save();
    await emitGameEnd(io, code, room);
    return;
  }
  const word = room.gameState.wordChoices[0];
  if (!word) {
    console.error('No word available for auto-select!');
    return;
  }
  await startDrawingPhase(io, code, word);
  const updatedRoom = await Room.findOne({ code });
  io.to(code).emit('room:update', updatedRoom); // Emit updated room state after auto-select
}

// Utility: Randomized hint generator
function getHintRandom(word, level, revealedIndexes) {
  const revealable = word.split('').map((c, i) => (c !== ' ' ? i : null)).filter(i => i !== null);
  // Reveal only one new letter per interval
  if (revealedIndexes.length < revealable.length) {
    let idx;
    do {
      idx = revealable[Math.floor(Math.random() * revealable.length)];
    } while (revealedIndexes.includes(idx));
    revealedIndexes.push(idx);
  }
  return word
    .split('')
    .map((char, idx) => (char === ' ' ? ' ' : revealedIndexes.includes(idx) ? char : '_'))
    .join(' ');
}

async function startDrawingPhase(io, code, word) {
  if (!word) {
    console.error('No word provided to startDrawingPhase!');
    return;
  }
  clearRoomTimers(code);
  const room = await Room.findOne({ code });
  if (!room) return;
  if (!room || room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    room.status = 'ended';
    room.gameState.phase = 'ended';
    room.gameState.round = room.settings.maxRounds;
    await room.save();
    await emitGameEnd(io, code, room);
    return;
  }
  
  
  console.log('startDrawingPhase called for code:', code, 'with word:', word);
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
  // Use hintIntervals from settings, convert fractions to seconds, sort descending
  const hintIntervals = (room.settings.hintIntervals || [0.33, 0.66])
    .map(f => Math.floor(roundTime * f))
    .sort((a, b) => b - a);
  let revealedIndexes = [];
  let hintLevel = 0;
  roomTimers[code] = setInterval(async () => {
    const room = await Room.findOne({ code });
    if (!room) return;
    if (room.status === 'ended') { clearRoomTimers(code); return; }
    room.gameState.timer--;
    await room.save();
    io.to(code).emit('timer-update', { timeLeft: room.gameState.timer });
    // Reveal next hint at each interval
    if (hintLevel < hintIntervals.length && room.gameState.timer === hintIntervals[hintLevel]) {
      hintLevel++;
      room.gameState.hintLevel = hintLevel;
      const hint = getHintRandom(word, hintLevel, revealedIndexes);
      room.gameState.hint = hint;
      await room.save();
      // Only emit to guessers (not drawer)
      const guessers = room.players.filter(p => p.userId !== room.gameState.drawingPlayerId);
      let delivered = 0;
      console.log(`[HINT] Timer triggered for room ${code}, hintLevel=${hintLevel}, hint='${hint}'`);
      guessers.forEach(p => {
        if (p.socketId) {
          io.to(p.socketId).emit('hint-update', { hint });
          delivered++;
          console.log(`[HINT] Sent to guesser ${p.userId} (socketId=${p.socketId})`);
        } else {
          console.log(`[HINT] No socketId for guesser ${p.userId}`);
        }
      });
      if (delivered === 0) {
        // Fallback: emit to room (all guessers will see, including drawer, but better than nothing)
        io.to(code).emit('hint-update', { hint });
        console.log(`[HINT] Fallback: emitted to room ${code}`);
      } else {
        console.log(`[HINT] Sent to ${delivered} guessers in room ${code}`);
      }
    }
    if (room.gameState.timer <= 0) {
      clearRoomTimers(code);
      if (room.status === 'ended') return;
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

  // Normal round end logic
  room.gameState.phase = 'round-end';
  // Award drawer points: e.g., 50 * number of correct guessers
  const correctGuessers = room.gameState.guesses.filter(g => g.correct).map(g => g.userId);
  const drawer = room.players.find(p => p.userId === room.gameState.drawingPlayerId);
  const drawerScore = correctGuessers.length * 50;
  if (drawer) drawer.score += drawerScore;
  
  // Add drawer's score to guesses array for round summary display
  const drawerGuess = {
    userId: room.gameState.drawingPlayerId,
    guess: '',
    correct: false,
    isClose: false,
    time: Date.now(),
    score: drawerScore,
    isDrawer: true
  };
  room.gameState.guesses.push(drawerGuess);
  
  await room.save(); // Save updated scores before emitting
  io.to(code).emit('room:update', room); // Emit updated room state
  console.log('Emitting round-end with guesses:', room.gameState.guesses);
  io.to(code).emit('round-end', {
    word: room.gameState.currentWord,
    scores: room.players.map(p => ({ userId: p.userId, score: p.score })),
    guesses: room.gameState.guesses,
  });
  setTimeout(async () => {
    const latestRoom = await Room.findOne({ code });
    if (!latestRoom) return;
    if (latestRoom.status === 'ended') return;
    nextRoundOrEnd(io, code);
  }, 4000);
}

async function nextRoundOrEnd(io, code) {
  const room = await Room.findOne({ code });
  if (!room) return;

  room.drawerIndex++;

  // If all players have drawn, increment round and reset drawerIndex
  if (room.drawerIndex >= room.playerOrder.length) {
    room.currentRound++;
    room.drawerIndex = 0;
    room.gameState.round = room.currentRound;
  }

  // End game if all rounds complete (after all players have drawn in the last round)
  if (room.status === 'ended' || room.currentRound > room.settings.maxRounds) {
    room.status = 'ended';
    room.gameState.phase = 'ended';
    room.gameState.round = room.currentRound;
    await room.save();
    console.log(`[nextRoundOrEnd] Game ended at round limit (currentRound=${room.currentRound}, maxRounds=${room.settings.maxRounds})`);
    await emitGameEnd(io, code, room);
    return;
  }

  await room.save(); // save changes before next round
  startRound(io, code);
}

