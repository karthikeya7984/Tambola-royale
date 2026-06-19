import { motion, AnimatePresence } from 'framer-motion';
import type { Winner } from '../../types';
import { fireworksConfetti } from '../../utils/effects';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  winners: Winner[];
  onClose: () => void;
}

export default function GameEndModal({ winners, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    fireworksConfetti();
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
          className="glass p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Game Over!
            </h2>
            <p className="text-white/60 mt-2">Congratulations to all winners!</p>
          </div>

          <div className="space-y-3 mb-6">
            {winners.length > 0 ? (
              winners.map((w, i) => (
                <div key={w._id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  {(w.userId as any).avatar && (
                    <img src={(w.userId as any).avatar} alt="" className="w-8 h-8 rounded-full" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{(w.userId as any).name}</p>
                    <p className="text-xs text-amber-400">{w.prizeName}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-center">No approved winners yet</p>
            )}
          </div>

          <button onClick={() => { onClose(); navigate('/dashboard'); }} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
