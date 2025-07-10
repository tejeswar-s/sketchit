const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerSchema = new mongoose.Schema({
  userId: String,
  name: String,
  avatar: { type: Schema.Types.Mixed },
  score: { type: Number, default: 0 },
  isHost: { type: Boolean, default: false },
  isDrawing: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isKicked: { type: Boolean, default: false },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  players: [playerSchema],
  chat: [{
    userId: String,
    name: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    system: { type: Boolean, default: false },
  }],
  gameState: {
    round: { type: Number, default: 1 },
    maxRounds: { type: Number, default: 3 },
    currentWord: { type: String, default: '' },
    drawingPlayerId: { type: String, default: '' },
    phase: { type: String, default: 'waiting' }, // waiting, drawing, guessing, ended
    timer: { type: Number, default: 0 },
    guesses: [{ userId: String, guess: String, correct: Boolean }],
    wordChoices: [String],
    hint: { type: String, default: '' },
  },
  settings: {
    maxPlayers: { type: Number, default: 8 },
    roundTime: { type: Number, default: 80 },
    language: { type: String, default: 'en' },
    customWords: { type: [String], default: [] },
    hintIntervals: { type: [Number], default: [0.33, 0.66] },
    maxRounds: { type: Number, default: 3 },
    wordCount: { type: Number, default: 3 },
    allowUndo: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    showTimerBar: { type: Boolean, default: true },
  },
  status: { type: String, default: 'waiting' }, // waiting, in-progress, ended
  currentRound: { type: Number, default: 1 },
  drawerIndex: { type: Number, default: 0 },
  playerOrder: [String], // userIds in drawing order
  createdAt: { type: Date, default: Date.now },
}, {
  versionKey: false  // ✅ Disable Mongoose versioning to avoid VersionError
});

module.exports = mongoose.model('Room', roomSchema);
