import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const BALLS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 30 + Math.random() * 40,
  duration: 4 + Math.random() * 6,
  delay: Math.random() * 3,
  color: ['#7c3aed','#f59e0b','#ef4444','#10b981','#3b82f6','#ec4899'][i % 6],
  num: Math.floor(Math.random() * 90) + 1,
}));

export default function LandingPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
    setLoading(true);
    const userId = crypto.randomUUID();
    try {
      const data = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: name.trim() }),
      }).then(r => r.json());
      if (data.error) { setError(data.error); return; }
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch {
      setError('Could not connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] relative overflow-hidden flex items-center justify-center">
      {/* Animated balls */}
      {BALLS.map(b => (
        <motion.div
          key={b.id}
          className="absolute rounded-full flex items-center justify-center font-bold text-white/70 select-none pointer-events-none"
          style={{
            width: b.size, height: b.size,
            background: b.color + '33',
            border: `2px solid ${b.color}55`,
            left: `${b.x}%`, top: `${b.y}%`,
            fontSize: b.size * 0.35,
          }}
          animate={{ y: [0, -30, 0], x: [0, 15, -10, 0], rotate: [0, 180, 360] }}
          transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {b.num}
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f1a]/60 via-transparent to-[#0f0f1a]/80 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center max-w-md w-full">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-7xl mb-4">🎱</div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent pb-1">
            Tambola Royale
          </h1>
          <p className="text-white/50 mt-3 text-lg">Real-Time Multiplayer Housie</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-white/25">
            <span>🎮 Multiplayer</span><span>•</span>
            <span>📱 PWA</span><span>•</span>
            <span>🌐 LAN Play</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass p-8 w-full flex flex-col gap-5"
        >
          <div>
            <h2 className="text-xl font-bold text-white">Enter Your Name</h2>
            <p className="text-sm text-white/40 mt-1">No sign-in required — just play!</p>
          </div>

          <input
            className="input text-center text-lg font-semibold"
            placeholder="Your name..."
            value={name}
            maxLength={30}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleContinue()}
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm text-center -mt-2">❌ {error}</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleContinue}
            disabled={loading}
            className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? 'Connecting...' : 'Continue →'}
          </motion.button>
        </motion.div>

        <p className="text-white/20 text-sm">No account needed • Works on LAN • PWA installable</p>
      </div>
    </div>
  );
}
