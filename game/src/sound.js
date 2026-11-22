// Small WebAudio blips for EMBERFALL: a play tick, a hit thud, a Surge chime
// and a win fanfare. Everything is synthesised — no audio files, no network.
// The context is created on the first user gesture, so it never blocks load.
let audioContext = null;

function context() {
  if (audioContext) return audioContext;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  } catch {
    return null;
  }
  return audioContext;
}

function blip(freq, durMs, type, gain, whenMs) {
  const ctx = context();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + (whenMs || 0) / 1000;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain || 0.12, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + durMs / 1000);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + durMs / 1000 + 0.05);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

export function soundPlayCard() {
  blip(520, 90, 'triangle', 0.1);
  blip(780, 70, 'sine', 0.07, 40);
}

export function soundHit(big) {
  blip(150, 160, 'sawtooth', big ? 0.16 : 0.1);
  blip(90, 200, 'square', 0.08, 20);
}

export function soundSurge() {
  blip(660, 90, 'sine', 0.1);
  blip(880, 90, 'sine', 0.1, 70);
  blip(1320, 140, 'sine', 0.09, 140);
}

export function soundWin() {
  const notes = [523, 659, 784, 1047];
  for (let i = 0; i < notes.length; i += 1) blip(notes[i], 220, 'triangle', 0.11, i * 120);
}

export function soundLoss() {
  blip(330, 300, 'sawtooth', 0.08);
  blip(220, 420, 'sawtooth', 0.07, 160);
}

export function soundEndTurn() {
  blip(392, 80, 'triangle', 0.08);
}
