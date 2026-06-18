const express = require('express');
const Room = require('../models/Room');
const Winner = require('../models/Winner');
const Ticket = require('../models/Ticket');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/:roomCode/winners', async (req, res) => {
  const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const winners = await Winner.find({ roomId: room._id })
    .populate('userId', 'name avatar')
    .sort('claimTime');
  res.json(winners);
});

router.patch('/:roomCode/winners/:winnerId', async (req, res) => {
  const { status } = req.body;
  const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
  if (!room || room.hostId.toString() !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  const winner = await Winner.findByIdAndUpdate(req.params.winnerId, { status }, { new: true });
  res.json(winner);
});

module.exports = router;
