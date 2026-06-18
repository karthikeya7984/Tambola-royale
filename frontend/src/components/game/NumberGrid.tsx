import { motion } from 'framer-motion';

interface Props {
  drawnNumbers: number[];
  currentNumber: number | null;
}

const ROWS = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 10 }, (_, c) => r * 10 + c + 1)
);

export default function NumberGrid({ drawnNumbers, currentNumber }: Props) {
  return (
    <div className="w-full h-full flex flex-col gap-1">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-xs text-white/60">Number Board</h2>
        <div className="flex items-center gap-3 text-[9px] text-white/40">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Drawn
          </span>
          <span className="font-bold text-white/60">{drawnNumbers.length}/90</span>
        </div>
      </div>

      {/* 9 rows × 10 circles — each row stretches full width */}
      <div className="flex-1 flex flex-col gap-[3px]">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex-1 flex gap-[3px]">
            {row.map(n => {
              const isCurrent = n === currentNumber;
              const isDrawn = drawnNumbers.includes(n) && !isCurrent;

              return (
                <motion.div
                  key={n}
                  animate={isCurrent ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.35 }}
                  className={`
                    flex-1 rounded-full flex items-center justify-center
                    font-bold select-none transition-colors duration-300
                    text-[clamp(6px,0.9vw,12px)]
                    ${isCurrent
                      ? 'bg-red-500 text-white ring-2 ring-white shadow-md shadow-red-500/50'
                      : isDrawn
                      ? 'bg-amber-400 text-gray-900'
                      : 'bg-white/10 text-white/40'
                    }
                  `}
                >
                  {n}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
