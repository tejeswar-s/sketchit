const Room = require('../models/Room');

module.exports = function moderationHandler(io, socket) {
  // Mute player
  socket.on('moderation:mute', async ({ code, userId }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    const player = room.players.find(p => p.userId === userId);
    if (player) player.isMuted = true;
    await room.save();
    io.to(code).emit('room:update', room);
    callback && callback({ message: 'Player muted' });
  });

  // Kick player
  socket.on('moderation:kick', async ({ code, userId }, callback) => {
    const room = await Room.findOne({ code });
    if (!room) return callback && callback({ error: 'Room not found' });
    room.players = room.players.filter(p => p.userId !== userId);
    await room.save();
    io.to(code).emit('room:update', room);
    callback && callback({ message: 'Player kicked' });
  });
}; 