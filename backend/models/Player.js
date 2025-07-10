const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: { 
    id: { type: String },
    emoji: { type: String },
    name: { type: String }
  },
  score: { type: Number, default: 0 },
  isHost: { type: Boolean, default: false },
  isDrawing: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isKicked: { type: Boolean, default: false },
  roomCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Player', playerSchema); 