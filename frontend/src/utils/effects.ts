import confetti from 'canvas-confetti';

export function fireConfetti() {
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
}

export function fireworksConfetti() {
  const end = Date.now() + 2000;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let lastAnnouncedNumber = -1;
let announcementMuted = false;

export function setAnnouncementMuted(muted: boolean) {
  announcementMuted = muted;
  if (muted && synth) synth.cancel();
}

export function isAnnouncementMuted() {
  return announcementMuted;
}

export function announceNumber(number: number) {
  if (!synth || announcementMuted) return;
  if (lastAnnouncedNumber === number) return;
  lastAnnouncedNumber = number;
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(`Number ${number}`);
  utt.rate = 0.9;
  utt.pitch = 1.1;
  synth.speak(utt);
}

export function playClaimSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}
