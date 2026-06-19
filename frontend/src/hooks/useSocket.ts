import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { announceNumber, fireConfetti, fireworksConfetti } from '../utils/effects';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

export function getSocket() { return socket; }

export function useSocket() {
  const token = useAuthStore(s => s.token);
  const { setRoom, addWinner, updateWinnerStatus, addPlayer, removePlayer, drawNumber, setPlayers } = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!token || initialized.current) return;
    initialized.current = true;

    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });

    socket.on('roomState', ({ room, players }) => {
      setRoom(room);
      setPlayers(players);
    });

    socket.on('playerJoined', (player) => {
      addPlayer(player);
      toast(`${player.name} joined!`, { icon: '👋' });
    });

    socket.on('gameStarted', ({ room }) => {
      setRoom(room);
      toast.success('Game started!');
    });

    socket.on('numberDrawn', ({ number, drawnNumbers }) => {
      drawNumber(number, drawnNumbers);
      announceNumber(number);
    });

    socket.on('numberMarked', ({ markedNumbers }) => {
      useGameStore.getState().setTicket({
        ...useGameStore.getState().ticket!,
        markedNumbers,
      });
    });

    socket.on('winnerAdded', (winner) => {
      addWinner(winner);
      if (winner.prizeName !== 'Full House') {
        toast(`🎉 ${winner.userName} claimed ${winner.prizeName}!`);
        fireConfetti();
      }
    });

    socket.on('fullHouseWinner', ({ userName, avatar }: { userName: string; avatar: string }) => {
      useGameStore.getState().setFullHouseWinner({ userName, avatar });
      fireworksConfetti();
      toast(`🏆 HOUSIE! ${userName} won Full House! Game Over!`, {
        duration: 8000,
        style: { background: '#7c3aed', color: '#fff', fontWeight: 'bold', fontSize: '14px' },
      });
    });

    socket.on('winnerStatusChanged', ({ winnerId, status }) => {
      updateWinnerStatus(winnerId, status);
    });

    socket.on('playerRemoved', ({ playerId }) => {
      removePlayer(playerId);
    });

    socket.on('gamePaused', () => {
      const room = useGameStore.getState().room;
      if (room) setRoom({ ...room, status: 'paused' });
      toast('Game paused', { icon: '⏸' });
    });

    socket.on('gameResumed', () => {
      const room = useGameStore.getState().room;
      if (room) setRoom({ ...room, status: 'playing' });
      toast.success('Game resumed!');
    });

    socket.on('gameEnded', ({ winners }) => {
      const room = useGameStore.getState().room;
      if (room) setRoom({ ...room, status: 'ended' });
      useGameStore.getState().setWinners(winners);
    });

    socket.on('error', ({ message }) => toast.error(message));
    socket.on('claimError', ({ message }) => {
      // handled by TicketCard once listener
    });
    socket.on('claimSuccess', () => {
      // handled by TicketCard once listener
    });

    return () => {
      socket?.disconnect();
      socket = null;
      initialized.current = false;
    };
  }, [token]);

  return socket;
}
