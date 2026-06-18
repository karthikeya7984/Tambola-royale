import { motion } from 'framer-motion';

interface Props {
  drawnNumbers: number[];
}

const COLORS = [
  'bg-red-600', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-green-600', 'bg-teal-600', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600',
];

export default function NumberHistory({ drawnNumbers }: Props) {
  const recent = [...drawnNumbers].reverse().slice(0, 15);

  return (
    <div className="glass p-4">
      <h2 className="font-bold text-base mb-3">Recent Numbers 📋</h2>
      {drawnNumbers.length > 0 ? (
        <>
          {/* Latest number */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${COLORS[(drawnNumbers[drawnNumbers.length - 1] - 1) % 9]} flex items-center justify-center text-2xl font-black shadow-lg`}>
              {drawnNumbers[drawnNumbers.length - 1]}
            </div>
          </div>
          {/* History */}
          <div className="flex flex-wrap gap-2 justify-center">
            {recent.slice(1).map((n, i) => (
              <motion.div
                key={`${n}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`tambola-ball text-xs ${COLORS[(n - 1) % 9]} opacity-70`}
              >
                {n}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-white/30 text-sm text-center py-4">No numbers drawn yet</p>
      )}
    </div>
  );
}
