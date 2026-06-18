import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Prize, Winner } from '../../types';
import { getSocket } from '../../hooks/useSocket';
import { fireConfetti } from '../../utils/effects';
import { useGameStore } from '../../store/gameStore';

interface Props {
  prizes: Prize[];
  winners: Winner[];
  isHost?: boolean;
  onApprove?: (winnerId: string, status: 'approved' | 'rejected') => void;
}

export default function PrizePanel({ prizes, winners, isHost, onApprove }: Props) {
  const socket = getSocket();
  const { room, ticket } = useGameStore();
  const [claimError, setClaimError] = useState<string | null>(null);
  const [congrats, setCongrats] = useState<string | null>(null);

  const CLAIM_TYPE_MAP: Record<string, string> = {
    'Jaldi-5': 'jaldi5',
    'Top Line': 'topLine',
    'Middle Line': 'middleLine',
    'Bottom Line': 'bottomLine',
    'Full House': 'fullHouse',
  };

  function validateLocally(ticketData: (number | null)[][] | null, markedNumbers: number[] | undefined, drawnNumbers: number[], claimType: string) {
    if (!ticketData) return { valid: false, message: 'Ticket not available' };
    const flatTicket = ticketData.flat().filter(n => n !== null) as number[];
    const validMarked = (markedNumbers || []).filter(n => drawnNumbers.includes(n) && flatTicket.includes(n));

    switch (claimType) {
      case 'jaldi5':
        if (validMarked.length >= 5) return { valid: true, message: '' };
        return { valid: false, message: `Jaldi-5: Need ${5 - validMarked.length} more valid marked number(s)` };
      case 'topLine': {
        const row = ticketData[0].filter(n => n !== null) as number[];
        const missing = row.filter(n => !validMarked.includes(n));
        if (missing.length === 0) return { valid: true, message: '' };
        return { valid: false, message: `Top Line: ${missing.length} number(s) not marked/drawn yet` };
      }
      case 'middleLine': {
        const row = ticketData[1].filter(n => n !== null) as number[];
        const missing = row.filter(n => !validMarked.includes(n));
        if (missing.length === 0) return { valid: true, message: '' };
        return { valid: false, message: `Middle Line: ${missing.length} number(s) not marked/drawn yet` };
      }
      case 'bottomLine': {
        const row = ticketData[2].filter(n => n !== null) as number[];
        const missing = row.filter(n => !validMarked.includes(n));
        if (missing.length === 0) return { valid: true, message: '' };
        return { valid: false, message: `Bottom Line: ${missing.length} number(s) not marked/drawn yet` };
      }
      case 'fullHouse': {
        const all = ticketData.flat().filter(n => n !== null) as number[];
        const missing = all.filter(n => !validMarked.includes(n));
        if (missing.length === 0) return { valid: true, message: '' };
        return { valid: false, message: `Full House: ${missing.length} number(s) not marked/drawn yet` };
      }
      default:
        return { valid: false, message: 'Unknown prize type' };
    }
  }
  function getWinnersForPrize(prizeId: string) {
    return winners.filter(w => w.prizeId === prizeId);
  }

  return (
    <div className="space-y-2">
      <h2 className="font-bold text-base px-1">Prizes 🏆</h2>
      {prizes.map(prize => {
        const prizeWinners = getWinnersForPrize(prize._id);
        const approvedCount = prizeWinners.filter(w => w.status === 'approved').length;
        const pendingCount = prizeWinners.filter(w => w.status === 'pending').length;
        const isFull = approvedCount >= prize.winnerLimit;

        return (
          <motion.div
            key={prize._id}
            layout
            className={`glass p-3 space-y-2 transition-all ${
              isFull
                ? 'border-amber-500/60 bg-amber-500/5'
                : pendingCount > 0
                ? 'border-yellow-500/40'
                : 'border-white/10'
            }`}
          >
            {/* Prize header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{isFull ? '🏆' : pendingCount > 0 ? '⏳' : '🎯'}</span>
                <span className="font-semibold text-sm">{prize.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isFull
                  ? 'bg-amber-500/25 text-amber-300'
                  : pendingCount > 0
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-white/10 text-white/40'
              }`}>
                {isFull ? 'Claimed' : `${approvedCount}/${prize.winnerLimit}`}
              </span>
            </div>

            {/* Host: brief claimant summary */}
            {isHost && (
              <div className="text-[12px] text-white/60">
                {approvedCount > 0 ? (
                  <div className="text-emerald-300">Claimed by {prizeWinners.filter(w => w.status === 'approved').map(w => ((w.userId as any)?.name || (w as any).userName)).slice(0,3).join(', ')}</div>
                ) : pendingCount > 0 ? (
                  <div className="text-yellow-300">Pending claim by {prizeWinners.filter(w => w.status === 'pending').map(w => ((w.userId as any)?.name || (w as any).userName)).slice(0,3).join(', ')}</div>
                ) : (
                  <div className="text-white/40">No claims yet</div>
                )}
              </div>
            )}

            {/* Winners list */}
            <AnimatePresence>
              {prizeWinners.map(w => (
                <motion.div
                  key={w._id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-2 rounded-lg p-2 ${
                    w.status === 'approved' ? 'bg-green-500/10 border border-green-500/20' :
                    w.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-yellow-500/10 border border-yellow-500/20'
                  }`}
                >
                  {((w.userId as any)?.avatar || (w as any).avatar) && (
                    <img
                      src={(w.userId as any)?.avatar || (w as any).avatar}
                      alt=""
                      className="w-5 h-5 rounded-full flex-shrink-0"
                    />
                  )}
                  <span className="text-xs text-white/80 flex-1 truncate">
                    {(w.userId as any)?.name || (w as any).userName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    w.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    w.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {w.status === 'approved' ? '✓' : w.status === 'rejected' ? '✗' : 'pending'}
                  </span>
                  {isHost && w.status === 'pending' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => onApprove?.(w._id, 'approved')}
                        className="text-green-400 hover:text-green-300 text-xs bg-green-500/10 hover:bg-green-500/20 px-1.5 py-0.5 rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => onApprove?.(w._id, 'rejected')}
                        className="text-red-400 hover:text-red-300 text-xs bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded"
                      >
                        ✗
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Player claim controls (only for non-hosts) */}
            {!isHost && (
              <div className="pt-1">
                <div className="flex items-center justify-center">
                  <button
                    onClick={async () => {
                      if (isFull) return;
                      const claimType = CLAIM_TYPE_MAP[prize.name] || prize.name.toLowerCase().replace(/\s+/g, '');
                      const drawn = room?.drawnNumbers || [];
                      const ticketData = ticket?.ticket || null;
                      const marked = ticket?.markedNumbers || [];
                      const { valid, message } = validateLocally(ticketData, marked, drawn, claimType);
                      if (!valid) {
                        setClaimError(message);
                        setTimeout(() => setClaimError(null), 3000);
                        return;
                      }

                      socket?.off('claimSuccess');
                      socket?.off('claimError');

                      socket?.once('claimSuccess', ({ winner }: any) => {
                        const msg = prize.name === 'Full House' ? `🎉 HOUSIE! You won Full House!` : `🎉 You claimed ${prize.name}!`;
                        setCongrats(msg);
                        fireConfetti();
                        setTimeout(() => setCongrats(null), 4000);
                      });

                      socket?.once('claimError', ({ message: err }: any) => {
                        setClaimError(err);
                        setTimeout(() => setClaimError(null), 3000);
                      });

                      socket?.emit('claimPrize', { roomCode: room?.roomCode || room?.roomCode, prizeId: prize._id, claimType });
                    }}
                    disabled={isFull}
                    className={`text-xs py-2 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 w-full
                      ${isFull ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/40 text-violet-200'}`}
                  >
                    🎯 Claim {prize.name}
                  </button>
                </div>
                {claimError && <div className="text-xs text-red-400 text-center mt-2">❌ {claimError}</div>}
                {congrats && <div className="text-xs text-emerald-300 text-center mt-2">{congrats}</div>}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
