import { create } from 'zustand';
import type { Room, Ticket, Winner } from '../types';

interface GameState {
  room: Room | null;
  ticket: Ticket | null;
  winners: Winner[];
  players: { userId: string; name: string; avatar: string }[];
  fullHouseWinner: { userName: string; avatar: string } | null;
  setRoom: (room: Room) => void;
  setTicket: (ticket: Ticket) => void;
  setWinners: (winners: Winner[]) => void;
  addWinner: (winner: Winner) => void;
  updateWinnerStatus: (winnerId: string, status: 'approved' | 'rejected') => void;
  setPlayers: (players: { userId: string; name: string; avatar: string }[]) => void;
  addPlayer: (player: { userId: string; name: string; avatar: string }) => void;
  removePlayer: (playerId: string) => void;
  markNumber: (number: number) => void;
  drawNumber: (number: number, drawnNumbers: number[]) => void;
  setFullHouseWinner: (winner: { userName: string; avatar: string }) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  room: null,
  ticket: null,
  winners: [],
  players: [],
  fullHouseWinner: null,
  setRoom: (room) => set({ room }),
  setTicket: (ticket) => set({ ticket }),
  setWinners: (winners) => set({ winners }),
  addWinner: (winner) => set((s) => ({ winners: [...s.winners, winner] })),
  updateWinnerStatus: (winnerId, status) =>
    set((s) => ({ winners: s.winners.map(w => w._id === winnerId ? { ...w, status } : w) })),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) => set((s) => {
    if (s.players.find(p => p.userId === player.userId)) return s;
    return { players: [...s.players, player] };
  }),
  removePlayer: (playerId) => set((s) => ({ players: s.players.filter(p => p.userId !== playerId) })),
  markNumber: (number) => set((s) => {
    if (!s.ticket || s.ticket.markedNumbers.includes(number)) return s;
    return { ticket: { ...s.ticket, markedNumbers: [...s.ticket.markedNumbers, number] } };
  }),
  drawNumber: (number, drawnNumbers) => set((s) => {
    if (!s.room) return s;
    return { room: { ...s.room, currentNumber: number, drawnNumbers } };
  }),
  setFullHouseWinner: (winner) => set({ fullHouseWinner: winner }),
  reset: () => set({ room: null, ticket: null, winners: [], players: [], fullHouseWinner: null }),
}));
