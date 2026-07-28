import { getSettings } from '../store/settings';

// ── Web Audio API synth helpers (used for sounds without dedicated files) ──────

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

function playFreqSweep(startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    const settings = getSettings();
    const masterVol = (settings.masterVolume / 100) * volume;
    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio sweep blocked', e);
  }
}

// ── File-based sound pool ──────────────────────────────────────────────────────
// Each sound gets a small pool of HTMLAudioElement instances so that rapid
// repeated plays (e.g. drawing multiple cards) don't get cut off.

interface SoundPool {
  pool: HTMLAudioElement[];
  idx: number;
  baseVolume: number;
}

const filePools: Record<string, SoundPool> = {};

function registerFile(key: string, src: string, poolSize = 4, baseVolume = 1.0) {
  const pool = Array.from({ length: poolSize }, () => {
    const a = new Audio(src);
    a.preload = 'auto';
    return a;
  });
  filePools[key] = { pool, idx: 0, baseVolume };
}

function playFile(key: string) {
  const entry = filePools[key];
  if (!entry) return;
  const settings = getSettings();
  const audio = entry.pool[entry.idx % entry.pool.length];
  entry.idx++;
  audio.currentTime = 0;
  audio.volume = Math.min(1, (settings.masterVolume / 100) * entry.baseVolume);
  audio.play().catch(() => {/* autoplay policy — silently ignore */});
}

// Resolve paths relative to Vite's BASE_URL so it works at any subpath
const base = import.meta.env.BASE_URL ?? '/';

registerFile('uiClick',      `${base}sounds/UIClick.wav`,      4, 0.7);
registerFile('uiHover',      `${base}sounds/UIHover.wav`,      4, 0.4);
registerFile('cardHover',    `${base}sounds/HoverCard.mp3`,    4, 0.5);
registerFile('coinGain',     `${base}sounds/CoinGain.mp3`,     4, 0.8);
registerFile('coinPurchase', `${base}sounds/CoinPurchase.wav`, 4, 0.9);
registerFile('draw',         `${base}sounds/DrawCard.mp3`,     6, 0.7);
registerFile('playCard',     `${base}sounds/PlayCard.mp3`,     4, 0.8);

// ── Sound map ──────────────────────────────────────────────────────────────────

const soundMap = {
  // ── File-based ────────────────────────────────────────────────────────────
  uiClick:    () => playFile('uiClick'),
  uiHover:    () => playFile('uiHover'),
  cardHover:  () => playFile('cardHover'),
  gold:       () => playFile('coinGain'),
  coinPurchase: () => playFile('coinPurchase'),
  draw:       () => playFile('draw'),

  // All cardPlay variants route to the same play-card file
  cardPlay:               () => playFile('playCard'),
  cardPlay_character:     () => playFile('playCard'),
  cardPlay_spell:         () => playFile('playCard'),
  cardPlay_artifact:      () => playFile('playCard'),
  cardPlay_enchantment:   () => playFile('playCard'),

  // ── Element-specific character deploy sounds (synth) ──────────────────────
  element_fire: () => {
    playTone(300, 0.05, 'sawtooth', 0.2);
    setTimeout(() => playTone(260, 0.05, 'sawtooth', 0.18), 40);
    setTimeout(() => playTone(220, 0.07, 'sawtooth', 0.15), 80);
    setTimeout(() => playTone(180, 0.1,  'sawtooth', 0.12), 130);
    setTimeout(() => playTone(140, 0.12, 'sawtooth', 0.1),  190);
  },
  element_frost: () => {
    playFreqSweep(2000, 400, 0.3, 'sine', 0.18);
    setTimeout(() => playFreqSweep(1600, 300, 0.25, 'triangle', 0.12), 60);
  },
  element_earth: () => {
    playTone(60, 0.25, 'square', 0.25);
    playTone(90, 0.2, 'sawtooth', 0.15);
    setTimeout(() => playTone(120, 0.15, 'sine', 0.1), 100);
  },
  element_void: () => {
    playTone(80, 0.4, 'sine', 0.2);
    setTimeout(() => playFreqSweep(300, 100, 0.35, 'triangle', 0.12), 50);
    setTimeout(() => playTone(40, 0.3, 'sine', 0.15), 100);
  },
  element_shadow: () => {
    playFreqSweep(400, 100, 0.15, 'sawtooth', 0.15);
    setTimeout(() => playTone(200, 0.2, 'triangle', 0.1), 100);
  },
  element_dragon: () => {
    playTone(80, 0.4, 'sawtooth', 0.25);
    playTone(160, 0.35, 'sawtooth', 0.18);
    setTimeout(() => playTone(240, 0.3, 'sine', 0.12), 80);
    setTimeout(() => playFreqSweep(200, 80, 0.3, 'sawtooth', 0.1), 180);
  },
  element_celestial: () => {
    [880, 1100, 1320, 1760, 2200].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.25, 'sine', 0.12), i * 50)
    );
  },
  element_water: () => {
    playFreqSweep(600, 400, 0.2, 'sine', 0.15);
    setTimeout(() => playFreqSweep(500, 350, 0.2, 'triangle', 0.12), 80);
    setTimeout(() => playTone(300, 0.15, 'sine', 0.1), 180);
  },
  element_storm: () => {
    playTone(100, 0.1, 'square', 0.25);
    setTimeout(() => playFreqSweep(800, 150, 0.25, 'sawtooth', 0.18), 60);
    setTimeout(() => playTone(60, 0.2, 'square', 0.15), 150);
  },
  element_iron: () => {
    playChord([220, 330], 0.2, 'square', 0.2);
    setTimeout(() => playTone(180, 0.3, 'triangle', 0.15), 80);
    setTimeout(() => playTone(140, 0.2, 'sine', 0.1), 180);
  },
  element_huntress: () => {
    playFreqSweep(1400, 600, 0.12, 'sawtooth', 0.15);
    setTimeout(() => playTone(400, 0.1, 'triangle', 0.1), 120);
  },
  element_aether: () => {
    playTone(1100, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(1320, 0.2, 'sine', 0.12), 60);
    setTimeout(() => playTone(880,  0.2, 'sine', 0.08), 120);
  },
  element_poison: () => {
    playTone(300, 0.08, 'sawtooth', 0.12);
    setTimeout(() => playTone(260, 0.08, 'sawtooth', 0.12), 70);
    setTimeout(() => playTone(200, 0.1, 'sawtooth', 0.1), 150);
    setTimeout(() => playTone(160, 0.12, 'sawtooth', 0.08), 240);
  },
  element_unknown: () => {
    playFreqSweep(100, 800, 0.25, 'sine', 0.2);
    setTimeout(() => playFreqSweep(200, 1200, 0.2, 'triangle', 0.12), 80);
    setTimeout(() => playChord([440, 550, 660, 880], 0.3, 'sine', 0.08), 200);
  },

  // ── Status effect sounds (synth) ──────────────────────────────────────────
  poison: () => {
    playTone(300, 0.08, 'sawtooth', 0.12);
    setTimeout(() => playTone(260, 0.12, 'sawtooth', 0.1), 60);
    setTimeout(() => playTone(220, 0.15, 'sawtooth', 0.08), 120);
  },
  stun: () => {
    playTone(1400, 0.05, 'square', 0.2);
    playTone(700, 0.15, 'square', 0.15);
    setTimeout(() => playTone(350, 0.1, 'square', 0.1), 80);
  },
  electric: () => {
    playTone(2000, 0.04, 'square', 0.15);
    playTone(1000, 0.1, 'square', 0.12);
  },

  // ── Combat (synth) ────────────────────────────────────────────────────────
  attack:  () => playTone(150, 0.15, 'sawtooth', 0.3),
  damage:  () => playTone(100, 0.2, 'square', 0.25),
  error:   () => playTone(200, 0.2, 'square', 0.2),

  // ── Game outcome (synth) ──────────────────────────────────────────────────
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 120)
    );
  },
  defeat: () => {
    [523, 494, 440, 392].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.4, 'sine', 0.2), i * 150)
    );
  },

  // ── Matchmaking / draft (synth) ───────────────────────────────────────────
  matchFound: () => {
    [440, 550, 660, 880].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.2, 'sine', 0.2), i * 80)
    );
  },
  draft: () => {
    playTone(1000, 0.06, 'sine', 0.1);
    setTimeout(() => playTone(1200, 0.08, 'sine', 0.12), 50);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.08), 100);
  },
};

export type SoundName = keyof typeof soundMap;

/** Element-theme → sound key mapping for character deploys */
export const ELEMENT_SOUNDS: Partial<Record<string, SoundName>> = {
  fire:      'element_fire',
  frost:     'element_frost',
  earth:     'element_earth',
  void:      'element_void',
  shadow:    'element_shadow',
  dragon:    'element_dragon',
  celestial: 'element_celestial',
  water:     'element_water',
  storm:     'element_storm',
  iron:      'element_iron',
  huntress:  'element_huntress',
  aether:    'element_aether',
  poison:    'element_poison',
  electric:  'electric',
  unknown:   'element_unknown',
};

const UI_SOUNDS:    Set<SoundName> = new Set(['uiClick', 'uiHover']);
const CARD_SOUNDS:  Set<SoundName> = new Set(['cardHover', 'draw', 'cardPlay', 'cardPlay_character', 'cardPlay_spell', 'cardPlay_artifact', 'cardPlay_enchantment']);
const GOLD_SOUNDS:  Set<SoundName> = new Set(['gold', 'coinPurchase']);

export const sounds = {
  play: (sound: SoundName) => {
    const settings = getSettings();
    if (UI_SOUNDS.has(sound)   && !settings.uiSounds)   return;
    if (CARD_SOUNDS.has(sound) && !settings.cardSounds)  return;
    if (GOLD_SOUNDS.has(sound) && !settings.goldSounds)  return;
    (soundMap[sound] as () => void)?.();
  },
};
