const Room = require('../models/Room');
const words = require('../shared/words');
const { shuffleArray } = require('../shared/utils');
const { GAME_PHASES } = require('../shared/constants');

// Start game in a room
async function startGame(req, res) {
  const { code } = req.body;
  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  room.gameState.phase = GAME_PHASES.DRAWING;
  room.gameState.round = 1;
  room.gameState.currentWord = shuffleArray([...words]).pop();
  room.gameState.wordChoices = shuffleArray([...words]).slice(0, 3);
  await room.save();
  res.json(room);
}

// Submit a guess
async function submitGuess(req, res) {
  const { code, userId, guess } = req.body;
  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  const correct = guess.toLowerCase() === room.gameState.currentWord.toLowerCase();
  room.gameState.guesses.push({ userId, guess, correct });
  await room.save();
  res.json({ correct });
}

// Get game state
async function getGameState(req, res) {
  const { code } = req.params;
  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room.gameState);
}

module.exports = { startGame, submitGuess, getGameState }; 