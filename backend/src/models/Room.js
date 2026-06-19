const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  winnerLimit: { type: Number, default: 1 },
  multipleWinners: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxPlayers: { type: Number, default: 50 },
  isPublic: { type: Boolean, default: true },
  status: { type: String, enum: ['waiting', 'playing', 'paused', 'ended'], default: 'waiting' },
  prizes: [prizeSchema],
  drawnNumbers: [{ type: Number }],
  currentNumber: { type: Number, default: null },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
