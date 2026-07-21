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

const soundMap = {
  uiClick:        () => playTone(800, 0.08, 'square', 0.2),
  cardHover:      () => playTone(1200, 0.05, 'sine', 0.05),
  gold:           () => { playTone(880, 0.1, 'sine', 0.2); playTone(1100, 0.15, 'sine', 0.15); playTone(1320, 0.2, 'sine', 0.1); },
  error:          () => playTone(200, 0.2, 'square', 0.2),
  draw:           () => playTone(600, 0.05, 'triangle', 0.1),

  // ── Per-type card play sounds ──────────────────────────────────────────
  cardPlay:       () => { playTone(440, 0.1, 'sawtooth', 0.15); playTone(660, 0.15, 'sine', 0.1); },
  cardPlay_character: () => {
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

  // ── Element-specific character deploy sounds ───────────────────────────
  element_fire: () => {
    // Crackling burst — rapid sawtooth descend
    playTone(300, 0.05, 'sawtooth', 0.2);
    setTimeout(() => playTone(260, 0.05, 'sawtooth', 0.18), 40);
    setTimeout(() => playTone(220, 0.07, 'sawtooth', 0.15), 80);
    setTimeout(() => playTone(180, 0.1,  'sawtooth', 0.12), 130);
    setTimeout(() => playTone(140, 0.12, 'sawtooth', 0.1),  190);
  },
  element_frost: () => {
    // Icy crystalline sweep down
    playFreqSweep(2000, 400, 0.3, 'sine', 0.18);
    setTimeout(() => playFreqSweep(1600, 300, 0.25, 'triangle', 0.12), 60);
  },
  element_earth: () => {
    // Deep rumble + thud
    playTone(60, 0.25, 'square', 0.25);
    playTone(90, 0.2, 'sawtooth', 0.15);
    setTimeout(() => playTone(120, 0.15, 'sine', 0.1), 100);
  },
  element_void: () => {
    // Eerie low pulse
    playTone(80, 0.4, 'sine', 0.2);
    setTimeout(() => playFreqSweep(300, 100, 0.35, 'triangle', 0.12), 50);
    setTimeout(() => playTone(40, 0.3, 'sine', 0.15), 100);
  },
  element_shadow: () => {
    // Quick dark flutter
    playFreqSweep(400, 100, 0.15, 'sawtooth', 0.15);
    setTimeout(() => playTone(200, 0.2, 'triangle', 0.1), 100);
  },
  element_dragon: () => {
    // Powerful roar — low sawtooth + harmonic
    playTone(80, 0.4, 'sawtooth', 0.25);
    playTone(160, 0.35, 'sawtooth', 0.18);
    setTimeout(() => playTone(240, 0.3, 'sine', 0.12), 80);
    setTimeout(() => playFreqSweep(200, 80, 0.3, 'sawtooth', 0.1), 180);
  },
  element_celestial: () => {
    // Bright ascending chime
    [880, 1100, 1320, 1760, 2200].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.25, 'sine', 0.12), i * 50)
    );
  },
  element_water: () => {
    // Watery warble
    playFreqSweep(600, 400, 0.2, 'sine', 0.15);
    setTimeout(() => playFreqSweep(500, 350, 0.2, 'triangle', 0.12), 80);
    setTimeout(() => playTone(300, 0.15, 'sine', 0.1), 180);
  },
  element_storm: () => {
    // Thunder crack
    playTone(100, 0.1, 'square', 0.25);
    setTimeout(() => playFreqSweep(800, 150, 0.25, 'sawtooth', 0.18), 60);
    setTimeout(() => playTone(60, 0.2, 'square', 0.15), 150);
  },
  element_iron: () => {
    // Heavy metallic clang
    playChord([220, 330], 0.2, 'square', 0.2);
    setTimeout(() => playTone(180, 0.3, 'triangle', 0.15), 80);
    setTimeout(() => playTone(140, 0.2, 'sine', 0.1), 180);
  },
  element_huntress: () => {
    // Arrow-release twang
    playFreqSweep(1400, 600, 0.12, 'sawtooth', 0.15);
    setTimeout(() => playTone(400, 0.1, 'triangle', 0.1), 120);
  },
  element_aether: () => {
    // Shimmering arcane hum
    playTone(1100, 0.15, 'sine', 0.1);
    setTimeout(() => playTone(1320, 0.2, 'sine', 0.12), 60);
    setTimeout(() => playTone(880,  0.2, 'sine', 0.08), 120);
  },
  element_poison: () => {
    // Bubbling acid drip
    playTone(300, 0.08, 'sawtooth', 0.12);
    setTimeout(() => playTone(260, 0.08, 'sawtooth', 0.12), 70);
    setTimeout(() => playTone(200, 0.1, 'sawtooth', 0.1), 150);
    setTimeout(() => playTone(160, 0.12, 'sawtooth', 0.08), 240);
  },
  element_unknown: () => {
    // Mysterious reverse sweep
    playFreqSweep(100, 800, 0.25, 'sine', 0.2);
    setTimeout(() => playFreqSweep(200, 1200, 0.2, 'triangle', 0.12), 80);
    setTimeout(() => playChord([440, 550, 660, 880], 0.3, 'sine', 0.08), 200);
  },

  // ── Status effect sounds ───────────────────────────────────────────────
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

  attack:  () => playTone(150, 0.15, 'sawtooth', 0.3),
  damage:  () => playTone(100, 0.2, 'square', 0.25),

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

export const sounds = {
  play: (sound: SoundName) => {
    const settings = getSettings();
    if (sound === 'uiClick' && !settings.uiSounds) return;
    if ((sound === 'cardHover' || sound === 'draw' || sound.startsWith('cardPlay')) && !settings.cardSounds) return;
    if (sound === 'gold' && !settings.goldSounds) return;
    (soundMap[sound] as () => void)?.();
  },
};
