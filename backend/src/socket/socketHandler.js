const Room = require('../models/Room');
const Ticket = require('../models/Ticket');
const Winner = require('../models/Winner');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const { validateTicketClaim } = require('../utils/gameUtils');

let io;

function initSocket(socketIO) {
  io = socketIO;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);

    socket.on('joinRoom', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        socket.join(roomCode);
        socket.roomCode = roomCode;

        const user = await User.findById(socket.user.userId);
        io.to(roomCode).emit('playerJoined', {
          userId: user._id,
          name: user.name,
          avatar: user.avatar,
        });

        const tickets = await Ticket.find({ roomId: room._id }).populate('userId', 'name avatar');
        const winners = await Winner.find({ roomId: room._id }).populate('userId', 'name avatar');
        socket.emit('roomState', {
          room,
          players: tickets.map(t => ({ userId: t.userId._id, name: t.userId.name, avatar: t.userId.avatar })),
          winners: winners.map(w => ({
            _id: w._id,
            userId: w.userId,
            userName: w.userId?.name || 'Unknown',
            avatar: w.userId?.avatar || '',
            prizeName: w.prizeName,
            prizeId: w.prizeId,
            claimTime: w.claimTime,
            status: w.status,
          })),
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('startGame', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        room.status = 'playing';
        await room.save();
        io.to(roomCode).emit('gameStarted', { room });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('drawNumber', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        if (room.drawnNumbers.length >= 90) {
          return socket.emit('error', { message: 'All numbers drawn' });
        }

        room.drawnNumbers = Array.isArray(room.drawnNumbers) ? room.drawnNumbers : [];
        let number;
        do { number = Math.floor(Math.random() * 90) + 1; } while (room.drawnNumbers.includes(number));

        room.drawnNumbers.push(number);
        room.currentNumber = number;
        await room.save();

        io.to(roomCode).emit('numberDrawn', { number, drawnNumbers: room.drawnNumbers });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('markNumber', async ({ roomCode, number }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        const ticket = await Ticket.findOne({ roomId: room._id, userId: socket.user.userId });
        if (!ticket) return socket.emit('error', { message: 'Ticket not found' });

        if (!ticket.markedNumbers.includes(number)) {
          ticket.markedNumbers.push(number);
          await ticket.save();
        }
        socket.emit('numberMarked', { number, markedNumbers: ticket.markedNumbers });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('claimPrize', async ({ roomCode, prizeId, claimType }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const prize = room.prizes.id(prizeId);
        if (!prize) return socket.emit('error', { message: 'Prize not found' });

        const existingCount = await Winner.countDocuments({ roomId: room._id, prizeId, status: { $in: ['pending', 'approved'] } });
        if (existingCount >= prize.winnerLimit) {
          return socket.emit('claimError', { message: `${prize.name} already fully claimed` });
        }

        // Check this user hasn't already claimed this prize
        const alreadyClaimed = await Winner.findOne({ roomId: room._id, prizeId, userId: socket.user.userId, status: { $ne: 'rejected' } });
        if (alreadyClaimed) return socket.emit('claimError', { message: 'You already claimed this prize' });

        const ticket = await Ticket.findOne({ roomId: room._id, userId: socket.user.userId });
        if (!ticket) return socket.emit('claimError', { message: 'Ticket not found' });

        const isValid = validateTicketClaim(ticket.ticket, ticket.markedNumbers, claimType, room.drawnNumbers);
        if (!isValid) return socket.emit('claimError', { message: 'Claim not valid — numbers not matched' });

        const user = await User.findById(socket.user.userId);
        // Auto-approve since server already validated
        const winner = await Winner.create({
          roomId: room._id,
          userId: socket.user.userId,
          prizeId,
          prizeName: prize.name,
          status: 'approved',
          drawnNumbersAtClaim: [...room.drawnNumbers],
        });

        const winnerData = {
          _id: winner._id,
          userId: { _id: user._id, name: user.name, avatar: user.avatar },
          userName: user.name,
          avatar: user.avatar,
          prizeName: prize.name,
          prizeId,
          claimTime: winner.claimTime,
          status: 'approved',
        };

        // Broadcast to everyone in room
        io.to(roomCode).emit('winnerAdded', winnerData);
        socket.emit('claimSuccess', { winner: winnerData });

        // If Full House — announce game winner to everyone
        if (claimType === 'fullHouse') {
          io.to(roomCode).emit('fullHouseWinner', {
            userName: user.name,
            avatar: user.avatar,
            userId: user._id,
          });
        }
      } catch (err) {
        socket.emit('claimError', { message: err.message });
      }
    });

    socket.on('approveWinner', async ({ roomCode, winnerId, status }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        const winner = await Winner.findByIdAndUpdate(winnerId, { status }, { new: true });
        io.to(roomCode).emit('winnerStatusChanged', { winnerId, status });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('removePlayer', async ({ roomCode, playerId }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        room.players = room.players.filter(p => p.toString() !== playerId);
        await room.save();
        io.to(roomCode).emit('playerRemoved', { playerId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('pauseGame', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) return;
        room.status = 'paused';
        await room.save();
        io.to(roomCode).emit('gamePaused');
      } catch {}
    });

    socket.on('resumeGame', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) return;
        room.status = 'playing';
        await room.save();
        io.to(roomCode).emit('gameResumed');
      } catch {}
    });

    socket.on('endGame', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        if (!room || room.hostId.toString() !== socket.user.userId) return;
        room.status = 'ended';
        await room.save();

        const winners = await Winner.find({ roomId: room._id, status: 'approved' })
          .populate('userId', 'name avatar');
        io.to(roomCode).emit('gameEnded', { winners });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });
}

module.exports = { initSocket };
