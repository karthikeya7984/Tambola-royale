import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { apiRequest } from '../utils/api';
import toast from 'react-hot-toast';

export default function JoinGame() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setRoom, setTicket } = useGameStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (code.trim().length < 6) return toast.error('Enter a valid room code');
    setLoading(true);
    try {
      const data = await apiRequest<any>('/rooms/join', {
        method: 'POST', token: token!,
        body: JSON.stringify({ roomCode: code.toUpperCase() }),
      });
      setRoom(data.room);
      setTicket(data.ticket);
      navigate(`/play/${data.room.roomCode}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button onClick={() => navigate('/dashboard')} className="text-white/50 hover:text-white mb-6 flex items-center gap-2">
          ← Back
        </button>

        <div className="glass p-8 space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🎟️</div>
            <h1 className="text-2xl font-bold">Join Game</h1>
            <p className="text-white/50 mt-1">Enter the room code from your host</p>
          </div>

          <div>
            <input
              className="input text-center text-3xl font-bold tracking-widest uppercase"
              placeholder="ABCD12"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={6}
            />
          </div>

          <button onClick={handleJoin} disabled={loading || code.length < 6} className="btn-primary w-full text-lg py-4 disabled:opacity-50">
            {loading ? 'Joining...' : 'Join Game 🎮'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
