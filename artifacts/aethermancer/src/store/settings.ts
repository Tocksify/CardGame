export interface Settings {
  music: boolean;
  uiSounds: boolean;
  cardSounds: boolean;
  goldSounds: boolean;
  masterVolume: number;
}

const DEFAULT_SETTINGS: Settings = {
  music: false,
  uiSounds: true,
  cardSounds: true,
  goldSounds: true,
  masterVolume: 80,
};

export function getSettings(): Settings {
  try {
    const stored = localStorage.getItem('aethermancer_settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn("Could not read settings", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem('aethermancer_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn("Could not save settings", e);
  }
}
