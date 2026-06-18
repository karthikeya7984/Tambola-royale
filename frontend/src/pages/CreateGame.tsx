import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { apiRequest } from '../utils/api';
import toast from 'react-hot-toast';

const DEFAULT_PRIZES = [
  { name: 'Jaldi-5', winnerLimit: 1, multipleWinners: false },
  { name: 'Top Line', winnerLimit: 1, multipleWinners: false },
  { name: 'Middle Line', winnerLimit: 1, multipleWinners: false },
  { name: 'Bottom Line', winnerLimit: 1, multipleWinners: false },
  { name: 'Full House', winnerLimit: 1, multipleWinners: false },
];

export default function CreateGame() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { setRoom, setTicket } = useGameStore();

  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [isPublic, setIsPublic] = useState(true);
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES.map(p => ({ ...p })));
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ roomCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function updatePrize(i: number, field: string, value: any) {
    setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function addPrize() {
    setPrizes(prev => [...prev, { name: '', winnerLimit: 1, multipleWinners: false }]);
  }

  function removePrize(i: number) {
    setPrizes(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!name.trim()) return toast.error('Enter a game name');
    setLoading(true);
    try {
      const data = await apiRequest<any>('/rooms/create', {
        method: 'POST', token: token!,
        body: JSON.stringify({ name, maxPlayers, isPublic, prizes }),
      });
      setRoom(data.room);
      setTicket(data.ticket);
      setCreated({ roomCode: data.room.roomCode });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(created!.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (created) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Room Created!</h2>
          <p className="text-white/50 mb-6">Share this code with players</p>

          <div className="bg-violet-600/20 border border-violet-500/40 rounded-2xl p-6 mb-6">
            <p className="text-sm text-white/50 mb-2">Room Code</p>
            <p className="text-4xl font-extrabold tracking-widest text-violet-300">{created.roomCode}</p>
          </div>

          <div className="flex gap-3 mb-6">
            <button onClick={copyCode} className="btn-secondary flex-1">
              {copied ? '✅ Copied!' : '📋 Copy Code'}
            </button>
            <button
              onClick={() => navigator.share?.({ title: 'Tambola Royale', text: `Join my Tambola game! Code: ${created.roomCode}` })}
              className="btn-secondary flex-1"
            >
              📤 Share
            </button>
          </div>

          <button onClick={() => navigate(`/host/${created.roomCode}`)} className="btn-primary w-full">
            Go to Game Arena →
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-white/50 hover:text-white mb-6 flex items-center gap-2">
          ← Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-8">Create Game 🎮</h1>

          <div className="space-y-6">
            {/* Game Settings */}
            <div className="glass p-6 space-y-4">
              <h2 className="font-semibold text-lg">Game Settings</h2>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Game Name</label>
                <input className="input" placeholder="My Tambola Game" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Max Players</label>
                  <input type="number" className="input" value={maxPlayers} onChange={e => setMaxPlayers(+e.target.value)} min={2} max={200} />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Room Type</label>
                  <select className="input" value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')}>
                    <option value="public">🌍 Public</option>
                    <option value="private">🔒 Private</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prizes */}
            <div className="glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Prizes</h2>
                <button onClick={addPrize} className="text-sm text-violet-400 hover:text-violet-300">+ Add Prize</button>
              </div>

              <div className="space-y-3">
                {prizes.map((prize, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex gap-3 items-center">
                      <input
                        className="input flex-1"
                        placeholder="Prize Name"
                        value={prize.name}
                        onChange={e => updatePrize(i, 'name', e.target.value)}
                      />
                      <button onClick={() => removePrize(i)} className="text-red-400 hover:text-red-300 text-xl px-2">×</button>
                    </div>
                    <div className="flex gap-3 items-center">
                      <label className="text-sm text-white/60 whitespace-nowrap">Winners:</label>
                      <input
                        type="number" min={1} max={10}
                        className="input w-20"
                        value={prize.winnerLimit}
                        onChange={e => updatePrize(i, 'winnerLimit', +e.target.value)}
                      />
                      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                        <input
                          type="checkbox" checked={prize.multipleWinners}
                          onChange={e => updatePrize(i, 'multipleWinners', e.target.checked)}
                          className="rounded"
                        />
                        Multiple Winners
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading} className="btn-primary w-full text-lg py-4">
              {loading ? 'Creating...' : 'Create Room 🚀'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
