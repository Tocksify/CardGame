import { getSettings } from '../store/settings';

let audioContext: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const settings = getSettings();
    const masterVol = (settings.masterVolume / 100) * volume;
    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play blocked', e);
  }
}

function playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.2) {
  freqs.forEach(f => playTone(f, duration, type, volume / freqs.length));
}

const soundMap = {
  uiClick:        () => playTone(800, 0.08, 'square', 0.2),
  cardHover:      () => playTone(1200, 0.05, 'sine', 0.05),
  gold:           () => { playTone(880, 0.1, 'sine', 0.2); playTone(1100, 0.15, 'sine', 0.15); playTone(1320, 0.2, 'sine', 0.1); },
  error:          () => playTone(200, 0.2, 'square', 0.2),
  draw:           () => playTone(600, 0.05, 'triangle', 0.1),

  // Per-type card play sounds
  cardPlay:       () => { playTone(440, 0.1, 'sawtooth', 0.15); playTone(660, 0.15, 'sine', 0.1); },
  cardPlay_character:   () => {
    // Deep thud + resonant hum
    playTone(120, 0.2, 'sawtooth', 0.25);
    setTimeout(() => playTone(240, 0.25, 'sine', 0.15), 60);
  },
  cardPlay_spell: () => {
    // High-pitched arcane whoosh
    playTone(1800, 0.08, 'sine', 0.15);
    playTone(900, 0.18, 'triangle', 0.12);
    setTimeout(() => playTone(600, 0.2, 'sine', 0.1), 80);
  },
  cardPlay_artifact: () => {
    // Metallic clang
    playChord([440, 550, 660], 0.15, 'square', 0.15);
    setTimeout(() => playTone(330, 0.3, 'triangle', 0.1), 100);
  },
  cardPlay_enchantment: () => {
    // Ethereal chime
    [880, 1100, 1320, 1760].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.2, 'sine', 0.1), i * 40)
    );
  },

  // Status effect sounds
  poison:         () => {
    // Sizzle / acid drip
    playTone(300, 0.08, 'sawtooth', 0.12);
    setTimeout(() => playTone(260, 0.12, 'sawtooth', 0.1), 60);
    setTimeout(() => playTone(220, 0.15, 'sawtooth', 0.08), 120);
  },
  stun:           () => {
    // Electric buzz
    playTone(1400, 0.05, 'square', 0.2);
    playTone(700, 0.15, 'square', 0.15);
    setTimeout(() => playTone(350, 0.1, 'square', 0.1), 80);
  },
  electric:       () => {
    playTone(2000, 0.04, 'square', 0.15);
    playTone(1000, 0.1, 'square', 0.12);
  },

  attack:         () => playTone(150, 0.15, 'sawtooth', 0.3),
  damage:         () => playTone(100, 0.2, 'square', 0.25),

  victory:        () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 120)
    );
  },
  defeat:         () => {
    [523, 494, 440, 392].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.4, 'sine', 0.2), i * 150)
    );
  },

  matchFound:     () => {
    [440, 550, 660, 880].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.2, 'sine', 0.2), i * 80)
    );
  },
  draft:          () => {
    // Card reveal shimmer
    playTone(1000, 0.06, 'sine', 0.1);
    setTimeout(() => playTone(1200, 0.08, 'sine', 0.12), 50);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.08), 100);
  },
};

export type SoundName = keyof typeof soundMap;

export const sounds = {
  play: (sound: SoundName) => {
    const settings = getSettings();
    if (sound === 'uiClick' && !settings.uiSounds) return;
    if ((sound === 'cardHover' || sound === 'draw' || sound.startsWith('cardPlay')) && !settings.cardSounds) return;
    if (sound === 'gold' && !settings.goldSounds) return;
    (soundMap[sound] as () => void)?.();
  },
};
