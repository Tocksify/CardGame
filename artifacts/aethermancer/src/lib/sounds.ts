// src/lib/sounds.ts
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
    
    // Apply master volume from settings
    const settings = getSettings();
    const masterVol = (settings.masterVolume / 100) * volume;
    
    gain.gain.setValueAtTime(masterVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio context errors if browser blocks auto-play
    console.warn("Audio play blocked", e);
  }
}

const soundMap = {
  uiClick: () => playTone(800, 0.08, 'square', 0.2),
  cardPlay: () => { playTone(440, 0.1, 'sawtooth', 0.15); playTone(660, 0.15, 'sine', 0.1); },
  cardHover: () => playTone(1200, 0.05, 'sine', 0.05),
  gold: () => { playTone(880, 0.1, 'sine', 0.2); playTone(1100, 0.15, 'sine', 0.15); playTone(1320, 0.2, 'sine', 0.1); },
  error: () => playTone(200, 0.2, 'square', 0.2),
  victory: () => { [523, 659, 784, 1047].forEach((f, i) => { setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 120); }); },
  defeat: () => { [523, 494, 440, 392].forEach((f, i) => { setTimeout(() => playTone(f, 0.4, 'sine', 0.2), i * 150); }); },
  attack: () => playTone(150, 0.15, 'sawtooth', 0.3),
  damage: () => playTone(100, 0.2, 'square', 0.25),
  draw: () => playTone(600, 0.05, 'triangle', 0.1),
};

export const sounds = {
  play: (sound: keyof typeof soundMap) => {
    const settings = getSettings();
    if (sound === 'uiClick' && !settings.uiSounds) return;
    if ((sound === 'cardPlay' || sound === 'cardHover' || sound === 'draw') && !settings.cardSounds) return;
    if (sound === 'gold' && !settings.goldSounds) return;
    
    soundMap[sound]();
  }
};
