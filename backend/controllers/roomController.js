const Room = require('../models/Room');
const { generateRoomCode } = require('../shared/utils');
const { MAX_PLAYERS } = require('../shared/constants');

// Create a new room
async function createRoom(req, res) {
  const { name, avatar } = req.body;
  const code = generateRoomCode();
  
  try {
    const room = new Room({
      code,
      players: [{ userId: req.body.userId, name, avatar, isHost: true }],
    });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    // console.error(`Error creating room:`, error);
    res.status(500).json({ message: 'Failed to create room' });
  }
}

// Join an existing room
async function joinRoom(req, res) {
  const { code, name, avatar, userId } = req.body;
  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.players.length >= MAX_PLAYERS) return res.status(400).json({ message: 'Room is full' });
  if (room.players.some(p => p.userId === userId)) return res.status(400).json({ message: 'Already joined' });
  room.players.push({ userId, name, avatar });
  await room.save();
  res.json(room);
}

// Leave a room
async function leaveRoom(req, res) {
  const { code, userId } = req.body;
  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  room.players = room.players.filter(p => p.userId !== userId);
  await room.save();
  res.json({ message: 'Left room' });
}

// Get room info
async function getRoom(req, res) {
  const { code } = req.params;
  
  try {
    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    // console.error(`Error finding room ${code}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update room settings
async function updateSettings(req, res) {
  const { code } = req.params;
  const { settings } = req.body;
  const room = await Room.findOne({ code });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  room.settings = { ...room.settings, ...settings };
  await room.save();
  // Emit update to all sockets
  const io = req.app.get('io');
  if (io) io.to(code).emit('room:update', room);
  res.json(room);
}

module.exports = { createRoom, joinRoom, leaveRoom, getRoom, updateSettings }; 