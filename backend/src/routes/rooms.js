const express = require('express');
const Room = require('../models/Room');
const Ticket = require('../models/Ticket');
const authMiddleware = require('../middleware/auth');
const { generateRoomCode, generateTicket } = require('../utils/gameUtils');

const router = express.Router();
router.use(authMiddleware);

router.post('/create', async (req, res) => {
  try {
    const { name, maxPlayers, isPublic, prizes } = req.body;
    let roomCode;
    do { roomCode = generateRoomCode(); } while (await Room.findOne({ roomCode }));

    const defaultPrizes = [
      { name: 'Jaldi-5', winnerLimit: 1, multipleWinners: false, order: 0 },
      { name: 'Top Line', winnerLimit: 1, multipleWinners: false, order: 1 },
      { name: 'Middle Line', winnerLimit: 1, multipleWinners: false, order: 2 },
      { name: 'Bottom Line', winnerLimit: 1, multipleWinners: false, order: 3 },
      { name: 'Full House', winnerLimit: 1, multipleWinners: false, order: 4 },
    ];

    const room = await Room.create({
      roomCode,
      name,
      hostId: req.user.userId,
      maxPlayers: maxPlayers || 50,
      isPublic: isPublic !== false,
      prizes: prizes?.length ? prizes : defaultPrizes,
    });

    // Host gets a ticket too
    const hostTicket = await Ticket.create({
      roomId: room._id,
      userId: req.user.userId,
      ticket: generateTicket(),
    });

    res.json({ room, ticket: hostTicket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { roomCode } = req.body;
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status === 'ended') return res.status(400).json({ error: 'Game has ended' });
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ error: 'Room is full' });

    const existing = await Ticket.findOne({ roomId: room._id, userId: req.user.userId });
    if (existing) return res.json({ room, ticket: existing });

    const ticket = await Ticket.create({
      roomId: room._id,
      userId: req.user.userId,
      ticket: generateTicket(),
    });

    if (!room.players.includes(req.user.userId)) {
      room.players.push(req.user.userId);
      await room.save();
    }

    res.json({ room, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:roomCode', async (req, res) => {
  const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    .populate('hostId', 'name avatar');
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

router.get('/:roomCode/ticket', async (req, res) => {
  const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const ticket = await Ticket.findOne({ roomId: room._id, userId: req.user.userId });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

router.get('/:roomCode/players', async (req, res) => {
  const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    .populate('players', 'name avatar email');
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room.players);
});

module.exports = router;
