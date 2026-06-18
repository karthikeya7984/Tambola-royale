export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Prize {
  _id: string;
  name: string;
  winnerLimit: number;
  multipleWinners: boolean;
  claimed: boolean;
  order: number;
}

export interface Room {
  _id: string;
  roomCode: string;
  name: string;
  hostId: { _id: string; name: string; avatar: string } | string;
  maxPlayers: number;
  isPublic: boolean;
  status: 'waiting' | 'playing' | 'paused' | 'ended';
  prizes: Prize[];
  drawnNumbers: number[];
  currentNumber: number | null;
  players: string[];
}

export interface Ticket {
  _id: string;
  roomId: string;
  userId: string;
  ticket: (number | null)[][];
  markedNumbers: number[];
}

export interface Winner {
  _id: string;
  userId: { _id: string; name: string; avatar: string } | string;
  userName?: string;
  avatar?: string;
  prizeName: string;
  prizeId: string;
  claimTime: string;
  status: 'pending' | 'approved' | 'rejected';
}
