import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Prize, Ticket } from '../../types';
import { getSocket } from '../../hooks/useSocket';
import { fireworksConfetti, fireConfetti } from '../../utils/effects';
import { useGameStore as useGameStoreState } from '../../store/gameStore';

interface Props {
  ticket: Ticket;
  drawnNumbers: number[];
  prizes: Prize[];
  winners: any[];
  roomCode: string;
}

const CLAIM_TYPE_MAP: Record<string, string> = {
  'Jaldi-5': 'jaldi5',
  'Top Line': 'topLine',
  'Middle Line': 'middleLine',
  'Bottom Line': 'bottomLine',
  'Full House': 'fullHouse',
};

function validateLocally(ticket: (number | null)[][], markedNumbers: number[], drawnNumbers: number[], claimType: string): { valid: boolean; message: string } {
  // Only count marked numbers that are: (1) in the ticket, (2) drawn, and (3) marked
  const flatTicket = ticket.flat().filter(n => n !== null) as number[];
  const validMarked = markedNumbers.filter(n => drawnNumbers.includes(n) && flatTicket.includes(n));

  switch (claimType) {
    case 'jaldi5':
      if (validMarked.length >= 5) return { valid: true, message: '' };
      return { valid: false, message: `Jaldi-5: Need ${5 - validMarked.length} more valid marked number(s)` };

    case 'topLine': {
      const row = ticket[0].filter(n => n !== null) as number[];
      const missing = row.filter(n => !validMarked.includes(n));
      if (missing.length === 0) return { valid: true, message: '' };
      return { valid: false, message: `Top Line: ${missing.length} number(s) not marked/drawn yet` };
    }
    case 'middleLine': {
      const row = ticket[1].filter(n => n !== null) as number[];
      const missing = row.filter(n => !validMarked.includes(n));
      if (missing.length === 0) return { valid: true, message: '' };
      return { valid: false, message: `Middle Line: ${missing.length} number(s) not marked/drawn yet` };
    }
    case 'bottomLine': {
      const row = ticket[2].filter(n => n !== null) as number[];
      const missing = row.filter(n => !validMarked.includes(n));
      if (missing.length === 0) return { valid: true, message: '' };
      return { valid: false, message: `Bottom Line: ${missing.length} number(s) not marked/drawn yet` };
    }
    case 'fullHouse': {
      const all = ticket.flat().filter(n => n !== null) as number[];
      const missing = all.filter(n => !validMarked.includes(n));
      if (missing.length === 0) return { valid: true, message: '' };
      return { valid: false, message: `Full House: ${missing.length} number(s) not marked/drawn yet` };
    }
    default:
      return { valid: false, message: 'Unknown prize type' };
  }
}

export default function TicketCard({ ticket, drawnNumbers, prizes, winners, roomCode }: Props) {
  const socket = getSocket();
  const [congrats, setCongrats] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  function handleMark(num: number | null) {
    if (!num || !drawnNumbers.includes(num)) return;
    // Update local state immediately so validation works instantly
    useGameStoreState.getState().markNumber(num);
    socket?.emit('markNumber', { roomCode, number: num });
  }

  function handleClaim(prize: Prize) {
    const claimType = CLAIM_TYPE_MAP[prize.name] || prize.name.toLowerCase().replace(/\s+/g, '');
    const { valid, message } = validateLocally(ticket.ticket, ticket.markedNumbers, drawnNumbers, claimType);

    if (!valid) {
      setClaimError(message);
      setTimeout(() => setClaimError(null), 3000);
      return;
    }

    // Remove stale listeners before adding new ones
    socket?.off('claimSuccess');
    socket?.off('claimError');

    socket?.once('claimSuccess', ({ winner }: any) => {
      const msg = prize.name === 'Full House'
        ? `🎉 HOUSIE! You won Full House!`
        : `🎉 Congratulations! You claimed ${prize.name}!`;
      setCongrats(msg);
      prize.name === 'Full House' ? fireworksConfetti() : fireConfetti();
      setTimeout(() => setCongrats(null), 5000);
    });

    socket?.once('claimError', ({ message: err }: any) => {
      setClaimError(err);
      setTimeout(() => setClaimError(null), 3000);
    });

    socket?.emit('claimPrize', { roomCode, prizeId: prize._id, claimType });
  }

  function isPrizeClaimed(prize: Prize) {
    const count = winners.filter(w => w.prizeId === prize._id && w.status !== 'rejected').length;
    return count >= prize.winnerLimit;
  }

  function isMyPrize(prize: Prize) {
    return winners.some(w => w.prizeId === prize._id && w.status !== 'rejected' && (w.userId?._id || w.userId) === (ticket.userId));
  }

  // Highlight rows based on prize completion
  function getRowHighlight(rowIndex: number) {
    const prizeMap: Record<number, string> = { 0: 'Top Line', 1: 'Middle Line', 2: 'Bottom Line' };
    const prizeName = prizeMap[rowIndex];
    const prize = prizes.find(p => p.name === prizeName);
    if (prize && isPrizeClaimed(prize)) return 'ring-1 ring-amber-400/60';
    return '';
  }

  return (
    <div className="glass p-4 space-y-3">
      {/* Congratulations banner */}
      <AnimatePresence>
        {congrats && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-violet-600 to-amber-500 rounded-xl p-3 text-center font-bold text-white text-sm shadow-lg"
          >
            {congrats}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim error banner */}
      <AnimatePresence>
        {claimError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/20 border border-red-500/40 rounded-xl p-2.5 text-center text-red-300 text-xs"
          >
            ❌ {claimError}
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="font-bold text-lg text-center">Your Ticket 🎟️</h2>

      {/* 3 rows × 9 cols */}
      <div className="w-full space-y-1.5">
        {ticket.ticket.map((row, ri) => (
          <div
            key={ri}
            className={`grid gap-1 rounded-lg p-0.5 transition-all ${getRowHighlight(ri)}`}
            style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}
          >
            {row.map((num, ci) => {
              const called = num !== null && drawnNumbers.includes(num);
              const marked = num !== null && ticket.markedNumbers.includes(num);
              const validMark = marked && called; // Only valid if BOTH marked AND drawn

              return (
                <div key={ci} className="aspect-square w-full">
                  {num !== null ? (
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => handleMark(num)}
                      className={`w-full h-full rounded-md font-bold transition-all duration-200 flex items-center justify-center
                        text-[clamp(0.45rem,1.8vw,0.85rem)] leading-none
                        ${
                          validMark
                            ? 'bg-violet-600 text-white shadow-lg ring-2 ring-violet-400'
                            : called
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 cursor-pointer hover:bg-amber-500/50'
                            : 'bg-white/5 text-white/35 cursor-not-allowed'
                        }`}
                    >
                      {num}
                    </motion.button>
                  ) : (
                    <div className="w-full h-full rounded-md bg-white/[0.02]" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Claim buttons */}
      <div className="space-y-2">
        <p className="text-xs text-white/40 text-center">Tap a prize to claim when eligible</p>
        <div className="grid grid-cols-2 gap-2">
          {prizes.map(prize => {
            const claimed = isPrizeClaimed(prize);
            const mine = isMyPrize(prize);
            return (
              <motion.button
                key={prize._id}
                whileTap={{ scale: 0.95 }}
                onClick={() => !claimed && handleClaim(prize)}
                disabled={claimed}
                className={`text-xs py-2 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mine
                    ? 'bg-amber-500/30 border border-amber-400/50 text-amber-300'
                    : claimed
                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                    : 'bg-violet-600/40 hover:bg-violet-600/60 border border-violet-500/40 text-violet-200'
                }`}
              >
                {mine ? '🏆' : claimed ? '✅' : '🎯'} {prize.name}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
