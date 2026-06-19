import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSocket, getSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../utils/api';
import PrizePanel from '../components/game/PrizePanel';
import NumberGrid from '../components/game/NumberGrid';
import NumberJar from '../components/game/NumberJar';
import GameEndModal from '../components/game/GameEndModal';
import { setAnnouncementMuted, isAnnouncementMuted } from '../utils/effects';
import toast from 'react-hot-toast';

export default function HostArena() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { room, ticket, winners, players, setRoom, setTicket, setWinners, reset, fullHouseWinner } = useGameStore();
  const socket = useSocket();
  const [showEnd, setShowEnd] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [mobileView, setMobileView] = useState<'prizes' | 'board' | 'jar'>('jar');
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

  function handleDrawNumber() {
    getSocket()?.emit('drawNumber', { roomCode });
  }

  function handleStart() {
    getSocket()?.emit('startGame', { roomCode });
  }

  function handlePause() {
    if (room?.status === 'paused') getSocket()?.emit('resumeGame', { roomCode });
    else getSocket()?.emit('pauseGame', { roomCode });
  }

  function handleEnd() {
    if (confirm('End the game?')) getSocket()?.emit('endGame', { roomCode });
  }

  function handleApprove(winnerId: string, status: 'approved' | 'rejected') {
    getSocket()?.emit('approveWinner', { roomCode, winnerId, status });
  }

  function handleKickPlayer(playerId: string) {
    getSocket()?.emit('removePlayer', { roomCode, playerId });
    toast.success('Player removed');
  }

  const isPlaying = room?.status === 'playing';
  const isPaused = room?.status === 'paused';
  const canDraw = isPlaying && (room?.drawnNumbers?.length ?? 0) < 90;

  return (
    <div className="h-screen bg-[#0f0f1a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎮</span>
          <div>
            <h1 className="font-bold text-sm">{room?.name || 'Loading...'}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Host</span>
              <span className="text-xs font-mono bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded">{roomCode}</span>
              <StatusBadge status={room?.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPlayers(true)} className="btn-secondary text-xs py-1.5 px-3">
            👥 Players ({players.length})
          </button>
          <button
            onClick={toggleMute}
            title={muted ? 'Unmute announcements' : 'Mute announcements'}
            className={`text-xl px-2 py-1.5 rounded-xl transition-all ${muted ? 'opacity-40 hover:opacity-70' : 'hover:bg-white/10'}`}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          {room?.status === 'waiting' && (
            <button onClick={handleStart} className="btn-primary text-xs py-1.5 px-3">▶ Start</button>
          )}
          {(isPlaying || isPaused) && (
            <button onClick={handlePause} className="btn-secondary text-xs py-1.5 px-3">
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
          {(isPlaying || isPaused) && (
            <button onClick={handleEnd} className="btn-danger text-xs py-1.5 px-3">⏹ End</button>
          )}
        </div>
      </header>

      {/* Players List Modal */}
      {showPlayers && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPlayers(false)}>
          <div className="glass w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="font-bold text-base">Players in Room</h2>
                <p className="text-xs text-white/40 mt-0.5">{players.length} joined</p>
              </div>
              <button onClick={() => setShowPlayers(false)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
            </div>
            {/* Player list */}
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {players.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">No players yet</p>
              ) : (
                players.map((p, i) => (
                  <div key={p.userId} className="flex items-center gap-3 bg-white/5 hover:bg-white/8 rounded-xl px-4 py-2.5 transition-colors">
                    <span className="text-xs text-white/30 w-5">{i + 1}</span>
                    {p.avatar
                      ? <img src={p.avatar} alt="" className="w-8 h-8 rounded-full border border-white/10" />
                      : <div className="w-8 h-8 rounded-full bg-violet-600/40 flex items-center justify-center text-sm font-bold">{p.name[0]}</div>
                    }
                    <span className="text-sm font-medium flex-1">{p.name}</span>
                    <button
                      onClick={() => handleKickPlayer(p.userId)}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
                    >
                      Kick
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Mobile tab bar */}
      <div className="flex lg:hidden border-b border-white/10">
        {(['prizes', 'board', 'jar'] as const).map(v => (
          <button key={v} onClick={() => setMobileView(v)} className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${mobileView === v ? 'text-violet-400 border-b-2 border-violet-500' : 'text-white/40'}`}>
            {v === 'jar' ? '🫙 Jar' : v === 'board' ? '📊 Board' : '🏆 Prizes'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 p-3 game-layout grid lg:grid-cols-[220px_1fr_260px] gap-3 overflow-hidden min-h-0">
        {/* Left: Prize Panel + Winner Button */}
        <div className={`${mobileView !== 'prizes' ? 'hidden lg:block' : ''} overflow-y-auto flex flex-col gap-3`}>
          <PrizePanel prizes={room?.prizes || []} winners={winners} isHost onApprove={handleApprove} />
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

        {/* Center: Number Grid — flex col so it fills height without scrolling */}
        <div className={`${mobileView !== 'board' ? 'hidden lg:flex' : 'flex'} flex-col glass p-3 min-h-0`}>
          <NumberGrid drawnNumbers={room?.drawnNumbers || []} currentNumber={room?.currentNumber || null} />
        </div>

        {/* Right: Jar */}
        <div className={`${mobileView !== 'jar' ? 'hidden lg:block' : ''} flex flex-col items-center justify-start gap-4`}>
          <NumberJar
            onDraw={handleDrawNumber}
            currentNumber={room?.currentNumber || null}
            drawnCount={room?.drawnNumbers?.length || 0}
            disabled={!canDraw}
          />

          {room?.status === 'waiting' && (
            <div className="glass p-4 text-center w-full">
              <p className="text-white/50 text-sm mb-3">Waiting for players...</p>
              <button onClick={handleStart} className="btn-primary w-full">▶ Start Game</button>
            </div>
          )}

          {isPaused && (
            <div className="glass p-4 text-center w-full">
              <p className="text-amber-400 text-sm mb-2">Game Paused</p>
              <button onClick={handlePause} className="btn-primary w-full">▶ Resume</button>
            </div>
          )}
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

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-500/20 text-yellow-300',
    playing: 'bg-green-500/20 text-green-300',
    paused: 'bg-orange-500/20 text-orange-300',
    ended: 'bg-red-500/20 text-red-300',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status || 'waiting'] || ''}`}>
      {status || 'waiting'}
    </span>
  );
}
