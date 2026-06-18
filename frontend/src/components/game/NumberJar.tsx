import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onDraw: () => void;
  currentNumber: number | null;
  drawnCount: number;
  disabled: boolean;
}

const BALL_COLORS = ['#7c3aed','#f59e0b','#ef4444','#10b981','#3b82f6','#ec4899','#06b6d4','#84cc16'];

interface BallInJar {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export default function NumberJar({ onDraw, currentNumber, drawnCount, disabled }: Props) {
  const [balls, setBalls] = useState<BallInJar[]>([]);
  const [showNumber, setShowNumber] = useState(false);
  const [displayNum, setDisplayNum] = useState<number | null>(null);
  const animRef = useRef<number>(0);
  const ballsRef = useRef<BallInJar[]>([]);

  useEffect(() => {
    const initial: BallInJar[] = Array.from({ length: 12 }, (_elem, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: BALL_COLORS[i % BALL_COLORS.length],
    }));
    ballsRef.current = initial;
    setBalls(initial);

    function animate() {
      ballsRef.current = ballsRef.current.map(b => {
        let { x, y, vx, vy } = b;
        x += vx; y += vy;
        if (x <= 5 || x >= 85) vx *= -1;
        if (y <= 5 || y >= 85) vy *= -1;
        return { ...b, x, y, vx, vy };
      });
      setBalls([...ballsRef.current]);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current!);
  }, []);

  useEffect(() => {
    if (currentNumber !== null && currentNumber !== displayNum) {
      setDisplayNum(currentNumber);
      setShowNumber(true);
      setTimeout(() => setShowNumber(false), 3000);
    }
  }, [currentNumber]);

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="font-bold text-lg">Number Jar 🫙</h2>

      {/* Jar */}
      <motion.div
        onClick={!disabled ? onDraw : undefined}
        whileHover={!disabled ? { scale: 1.03 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        className={`relative w-48 h-56 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Jar body */}
        <div className="absolute inset-0 rounded-b-[60px] rounded-t-[20px] bg-white/5 backdrop-blur-sm border-2 border-white/20 overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-white/10 to-transparent rounded-l-2xl" />

          {/* Balls inside jar */}
          {balls.map(ball => (
            <div
              key={ball.id}
              className="absolute w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
              style={{
                left: `${ball.x}%`, top: `${ball.y}%`,
                background: ball.color,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}

          {/* Label */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-xs text-white/40">{90 - drawnCount} remaining</span>
          </div>
        </div>

        {/* Jar lid */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-white/20 rounded-full border border-white/30" />

        {/* Click hint */}
        {!disabled && (
          <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-white/40 animate-pulse">
            Click to draw
          </div>
        )}
      </motion.div>

      {/* Fullscreen number display */}
      <AnimatePresence>
        {showNumber && displayNum && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowNumber(false)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center"
            >
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center shadow-2xl mx-auto mb-6">
                <span className="text-7xl font-black text-white">{displayNum}</span>
              </div>
              <p className="text-white/60 text-lg">Tap to continue</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
