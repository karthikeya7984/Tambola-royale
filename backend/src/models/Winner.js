const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prizeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  prizeName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  claimTime: { type: Date, default: Date.now },
  drawnNumbersAtClaim: [{ type: Number }],
}, { timestamps: true });

module.exports = mongoose.model('Winner', winnerSchema);
