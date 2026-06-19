const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticket: {
    type: [[{ type: Number, default: null }]],
    required: true,
  },
  markedNumbers: [{ type: Number }],
}, { timestamps: true });

ticketSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
