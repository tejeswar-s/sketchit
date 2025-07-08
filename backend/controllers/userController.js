const Player = require('../models/Player');

// Get user profile
async function getUser(req, res) {
  const { userId } = req.params;
  const player = await Player.findOne({ userId });
  if (!player) return res.status(404).json({ message: 'User not found' });
  res.json(player);
}

// Update user profile
async function updateUser(req, res) {
  const { userId } = req.params;
  const { name, avatar } = req.body;
  const player = await Player.findOneAndUpdate(
    { userId },
    { name, avatar },
    { new: true, upsert: true }
  );
  res.json(player);
}

module.exports = { getUser, updateUser }; 