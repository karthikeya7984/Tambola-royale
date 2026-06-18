import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../utils/api';

declare global {
  interface Window { google: any; }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
  const { setAuth, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const btnRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const handleCredential = useCallback(async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{ token: string; user: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: response.credential }),
      });
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [navigate, setAuth]);

  // Render Google button once script is ready
  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google Client ID not configured');
      return;
    }

    function tryInit() {
      if (!window.google || initialized.current) return;
      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          width: 300,
        });
      }
    }

    // Poll until google script is loaded
    const interval = setInterval(() => {
      if (window.google) { tryInit(); clearInterval(interval); }
    }, 100);

    // Also try immediately
    tryInit();

    return () => clearInterval(interval);
  }, [handleCredential]);

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
        {/* Hero */}
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

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass p-8 w-full flex flex-col items-center gap-5"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">Play Now</h2>
            <p className="text-sm text-white/40 mt-1">Sign in with your Google account</p>
          </div>

          {error && (
            <div className="w-full bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-2.5 text-red-300 text-sm text-center">
              ❌ {error}
            </div>
          )}

          {loading && (
            <div className="text-white/60 text-sm animate-pulse">Signing in...</div>
          )}

          {/* Google renders its button here */}
          <div ref={btnRef} className="flex justify-center min-h-[44px]" />

          {!CLIENT_ID && (
            <p className="text-red-400 text-xs">VITE_GOOGLE_CLIENT_ID not set in .env</p>
          )}

          <p className="text-xs text-white/20">No password needed • Secure OAuth 2.0</p>
        </motion.div>
      </div>

      {/* Google GSI script */}
      <script src="https://accounts.google.com/gsi/client" async defer />
    </div>
  );
}
