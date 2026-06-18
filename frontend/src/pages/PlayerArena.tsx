import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useSocket, getSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../utils/api';
import toast from 'react-hot-toast';
import PrizePanel from '../components/game/PrizePanel';
import TicketCard from '../components/game/TicketCard';
import NumberHistory from '../components/game/NumberHistory';
import GameEndModal from '../components/game/GameEndModal';
import { setAnnouncementMuted, isAnnouncementMuted } from '../utils/effects';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerArena() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { room, ticket, winners, setRoom, setTicket, setWinners, reset, fullHouseWinner } = useGameStore();
  const socket = useSocket();
  const [showEnd, setShowEnd] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [mobileView, setMobileView] = useState<'ticket' | 'prizes' | 'history'>('ticket');
  const [muted, setMuted] = useState(isAnnouncementMuted());

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setAnnouncementMuted(next);
    toast(next ? '🔇 Announcements off' : '🔊 Announcements on', { duration: 1500 });
  }

  useEffect(() => {
    if (!roomCode || !token) return;

    apiRequest<any>(`/rooms/${roomCode}`, { token: token! }).then(r => setRoom(r)).catch(() => navigate('/dashboard'));
    apiRequest<any>(`/rooms/${roomCode}/ticket`, { token: token! }).then(t => setTicket(t)).catch(() => {});
    apiRequest<any[]>(`/game/${roomCode}/winners`, { token: token! }).then(w => setWinners(w)).catch(() => {});

    if (socket) socket.emit('joinRoom', { roomCode });

    return () => { reset(); };
  }, [roomCode, socket]);

  useEffect(() => {
    if (room?.status === 'ended') setShowEnd(true);
  }, [room?.status]);

  const drawnNumbers = room?.drawnNumbers || [];

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎟️</span>
          <div>
            <h1 className="font-bold text-sm">{room?.name || 'Loading...'}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded">{roomCode}</span>
              <GameStatusBadge status={room?.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Latest number display in header */}
          {room?.currentNumber && (
            <motion.div
              key={room.currentNumber}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center font-black text-sm shadow-lg"
            >
              {room.currentNumber}
            </motion.div>
          )}
          <button onClick={() => setShowBoard(!showBoard)} className="btn-secondary text-xs py-1.5 px-3">
            📊 Board
          </button>
          <button
            onClick={toggleMute}
            title={muted ? 'Unmute announcements' : 'Mute announcements'}
            className={`text-xl px-2 py-1.5 rounded-xl transition-all ${muted ? 'opacity-40 hover:opacity-70' : 'hover:bg-white/10'}`}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Slide-down number board — scrollable, full height */}
      <AnimatePresence>
        {showBoard && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-white/10 bg-[#0f0f1a]"
          >
            <div className="p-3 mx-3 my-2 glass rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Number Board</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[9px] text-white/40">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Current</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Drawn</span>
                    <span className="font-bold text-white/60">{drawnNumbers.length}/90</span>
                  </div>
                  <button onClick={() => setShowBoard(false)} className="text-white/50 hover:text-white text-lg leading-none">×</button>
                </div>
              </div>
              {/* Scrollable grid — end-to-end across all screen sizes */}
              <div className="overflow-y-auto max-h-[55vh]">
                <div className="flex flex-col gap-1.5">
                  {Array.from({ length: 9 }, (_, r) =>
                    Array.from({ length: 10 }, (_, c) => r * 10 + c + 1)
                  ).map((row, ri) => (
                    <div key={ri} className="flex gap-1.5 w-full">
                      {row.map(n => {
                        const isCurrent = n === (room?.currentNumber || null);
                        const isDrawn = drawnNumbers.includes(n) && !isCurrent;
                        return (
                          <div
                            key={n}
                            style={{ aspectRatio: '1 / 1' }}
                            className={`
                              flex-1 min-w-0 rounded-full flex items-center justify-center
                              text-[clamp(8px,2vw,13px)] font-bold select-none transition-colors duration-300
                              ${isCurrent
                                ? 'bg-red-500 text-white ring-2 ring-white shadow shadow-red-500/50'
                                : isDrawn
                                ? 'bg-amber-400 text-gray-900'
                                : 'bg-white/10 text-white/40'
                              }
                            `}
                          >
                            {n}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full House Winner Banner */}
      <AnimatePresence>
        {fullHouseWinner && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-gray-900 px-4 py-3 text-center font-black text-sm shadow-lg"
          >
            🏆 HOUSIE! <span className="underline">{fullHouseWinner.userName}</span> won Full House! Game Completed!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game paused banner */}
      {room?.status === 'paused' && (
        <div className="bg-orange-500/20 border-b border-orange-500/30 text-center py-2 text-orange-300 text-sm">
          ⏸ Game is paused by host
        </div>
      )}

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-white/10">
        {(['ticket', 'prizes', 'history'] as const).map(v => (
          <button key={v} onClick={() => setMobileView(v)} className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${mobileView === v ? 'text-violet-400 border-b-2 border-violet-500' : 'text-white/40'}`}>
            {v === 'ticket' ? '🎟️ Ticket' : v === 'prizes' ? '🏆 Prizes' : '📋 History'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 game-layout grid lg:grid-cols-[240px_1fr_280px] gap-4 overflow-y-auto">
        {/* Left: Prizes */}
        <div className={`${mobileView !== 'prizes' ? 'hidden lg:block' : ''} overflow-y-auto`}>
          <PrizePanel prizes={room?.prizes || []} winners={winners} />
        </div>

        {/* Center: Ticket */}
        <div className={`${mobileView !== 'ticket' ? 'hidden lg:block' : ''}`}>
          {ticket && room ? (
            <TicketCard
              ticket={ticket}
              drawnNumbers={drawnNumbers}
              prizes={room.prizes}
              winners={winners}
              roomCode={roomCode!}
            />
          ) : (
            <div className="glass p-8 text-center text-white/40">Loading ticket...</div>
          )}
        </div>

        {/* Right: History + Winner Button */}
        <div className={`${mobileView !== 'history' ? 'hidden lg:block' : ''} flex flex-col gap-3`}>
          <NumberHistory drawnNumbers={drawnNumbers} />
          {/* Full House Winner Button */}
          <AnimatePresence>
            {fullHouseWinner && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => { reset(); navigate('/dashboard'); }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-black py-3 px-4 rounded-xl shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform text-sm"
              >
                🏆 Winner: {fullHouseWinner.userName}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showEnd && <GameEndModal winners={winners} onClose={() => setShowEnd(false)} />}

      {/* Mobile Winner Button — fixed at bottom */}
      <AnimatePresence>
        {fullHouseWinner && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden fixed bottom-4 left-4 right-4 z-40"
          >
            <button
              onClick={() => { reset(); navigate('/dashboard'); }}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-black py-4 px-4 rounded-2xl shadow-xl shadow-amber-500/40 text-sm"
            >
              🏆 Winner: {fullHouseWinner.userName} — Tap to go back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameStatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-500/20 text-yellow-300',
    playing: 'bg-green-500/20 text-green-300 animate-pulse',
    paused: 'bg-orange-500/20 text-orange-300',
    ended: 'bg-red-500/20 text-red-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status || 'waiting'] || ''}`}>
      {status === 'playing' ? '● LIVE' : status || 'waiting'}
    </span>
  );
}
