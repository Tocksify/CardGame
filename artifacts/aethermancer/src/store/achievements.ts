export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: 'First Blood', description: 'Win your first game', icon: 'trophy', unlocked: false },
  { id: 'play_10_cards', name: 'Card Slinger', description: 'Play 10 cards in a single game', icon: 'layers', unlocked: false, progress: 0, target: 10 },
  { id: 'earn_50_gold', name: 'Golden Age', description: 'Earn 2,000 gold in a single game', icon: 'coins', unlocked: false, progress: 0, target: 2000 },
  { id: 'kill_5_creatures', name: 'Executioner', description: 'Destroy 5 enemy creatures in one game', icon: 'swords', unlocked: false, progress: 0, target: 5 },
  { id: 'evolve_creature', name: 'Aethermancer\'s Pride', description: 'Evolve a creature', icon: 'sparkles', unlocked: false },
  { id: 'win_no_damage', name: 'Untouchable', description: 'Win a game without taking any damage', icon: 'shield', unlocked: false },
  { id: 'buy_5_shop', name: 'High Roller', description: 'Buy 5 items from the shop in one game', icon: 'shopping-cart', unlocked: false, progress: 0, target: 5 },
  { id: 'legendary_played', name: 'Legend Unleashed', description: 'Play a Legendary card', icon: 'star', unlocked: false },
  { id: 'win_3_games', name: 'Veteran', description: 'Win 3 games total', icon: 'award', unlocked: false, progress: 0, target: 3 },
  { id: 'survive_10_turns', name: 'Endurance', description: 'Survive 10 turns in a single game', icon: 'clock', unlocked: false, progress: 0, target: 10 },
];

export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem('aethermancer_achievements');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to pick up any new achievements
      return DEFAULT_ACHIEVEMENTS.map(def => {
        const found = parsed.find((p: any) => p.id === def.id);
        return found ? { ...def, unlocked: found.unlocked, progress: found.progress } : def;
      });
    }
  } catch (e) {
    console.error("Failed to load achievements", e);
  }
  return [...DEFAULT_ACHIEVEMENTS];
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem('aethermancer_achievements', JSON.stringify(achievements));
  } catch (e) {
    console.error("Failed to save achievements", e);
  }
}
