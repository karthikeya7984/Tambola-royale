import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎱</span>
          <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-amber-400 bg-clip-text text-transparent">
            Tambola Royale
          </span>
        </div>
        <div className="flex items-center gap-3">
          <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full border border-white/20" />
          <span className="text-sm text-white/70 hidden sm:block">{user?.name}</span>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-white/50 hover:text-white transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-white/50 mt-2">Ready to play Tambola?</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <GameCard
            icon="🎮"
            title="Create Game"
            description="Host a new Tambola room and invite friends"
            color="from-violet-600 to-violet-800"
            delay={0.1}
            onClick={() => navigate('/create')}
          />
          <GameCard
            icon="🎟️"
            title="Join Game"
            description="Enter a room code to join an existing game"
            color="from-amber-500 to-orange-600"
            delay={0.2}
            onClick={() => navigate('/join')}
          />
        </div>
      </main>
    </div>
  );
}

function GameCard({ icon, title, description, color, delay, onClick }: {
  icon: string; title: string; description: string; color: string; delay: number; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="glass p-8 flex flex-col items-center gap-4 cursor-pointer group text-left w-full"
    >
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-4xl shadow-lg group-hover:shadow-violet-500/30 transition-shadow`}>
        {icon}
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-white/50 text-sm mt-1">{description}</p>
      </div>
    </motion.button>
  );
}
