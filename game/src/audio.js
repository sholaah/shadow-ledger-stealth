// Shadow Ledger — sound: everything synthesized with WebAudio.
// No audio files, no network: footsteps are filtered noise taps, the
// alert sting is a short dissonant brass-like chord, pickups and the
// win/lose cues are small oscillator phrases. Audio starts lazily on
// the first user gesture, as browsers require.

let ctx = null;
let master = null;

function ensureContext() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    return true;
  } catch {
    return false;
  }
}

// A single tone: oscillator -> gain envelope -> master.
function tone({ freq, freqEnd, type = 'sine', at = 0, dur = 0.2, vol = 0.2 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A short burst of filtered noise: a footstep on wooden floor.
function noiseTap({ at = 0, dur = 0.07, vol = 0.16, cutoff = 700 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(t0);
}

export const audio = {
  // Call from any user gesture; safe to call repeatedly.
  unlock() {
    ensureContext();
  },

  // Alternate left/right foot; sneak steps are soft, runs are loud.
  footstep(alternate, sneaking, running) {
    if (!ensureContext()) return;
    noiseTap({
      vol: sneaking ? 0.05 : running ? 0.22 : 0.13,
      cutoff: sneaking ? 380 : running ? 1100 : 700,
      dur: sneaking ? 0.05 : 0.07,
    });
    if (running) tone({ freq: alternate ? 95 : 82, type: 'triangle', dur: 0.06, vol: 0.08 });
  },

  // The sting when a guard spots the player: two clashing tones.
  alertSting() {
    if (!ensureContext()) return;
    tone({ freq: 233, type: 'sawtooth', dur: 0.5, vol: 0.16 });
    tone({ freq: 247, type: 'sawtooth', dur: 0.5, vol: 0.16 });
    tone({ freq: 466, type: 'triangle', at: 0.08, dur: 0.4, vol: 0.12 });
  },

  // A guard growing suspicious: a single low questioning note.
  suspiciousBlip() {
    if (!ensureContext()) return;
    tone({ freq: 330, freqEnd: 392, type: 'triangle', dur: 0.18, vol: 0.1 });
  },

  // Picking up a ledger page: a bright two-note chime.
  pickup() {
    if (!ensureContext()) return;
    tone({ freq: 880, type: 'sine', dur: 0.12, vol: 0.14 });
    tone({ freq: 1318, type: 'sine', at: 0.09, dur: 0.2, vol: 0.12 });
  },

  // Reaching the exit with all three pages: a short rising phrase.
  win() {
    if (!ensureContext()) return;
    [523, 659, 784, 1047].forEach((freq, i) =>
      tone({ freq, type: 'triangle', at: i * 0.11, dur: 0.3, vol: 0.14 }),
    );
  },

  // Caught: a low falling phrase.
  caught() {
    if (!ensureContext()) return;
    [392, 311, 233, 175].forEach((freq, i) =>
      tone({ freq, type: 'sawtooth', at: i * 0.13, dur: 0.3, vol: 0.1 }),
    );
  },
};
