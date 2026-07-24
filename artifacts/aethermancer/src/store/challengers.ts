import { CHALLENGERS } from '../lib/challengers';
import { loadAchievements } from './achievements';

const STORAGE_KEY = 'aethermancer_challengers';

export interface ChallengerSave {
  arcaneShards: number;
  ownedIds: string[];
  equippedId: string | null;
}

const FREE_STARTER_IDS = CHALLENGERS.filter(c => c.isFreeStarter).map(c => c.id);

function getAchievementUnlockedIds(): string[] {
  const achievements = loadAchievements();
  return CHALLENGERS
    .filter(c => c.unlockedByAchievement)
    .filter(c => achievements.find(a => a.id === c.unlockedByAchievement && a.unlocked))
    .map(c => c.id);
}

export function loadChallengerSave(): ChallengerSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let save: ChallengerSave;
    if (raw) {
      save = JSON.parse(raw);
    } else {
      save = { arcaneShards: 0, ownedIds: [...FREE_STARTER_IDS], equippedId: FREE_STARTER_IDS[0] ?? null };
      saveChallengerSave(save);
    }
    // Auto-unlock achievement challengers
    const achIds = getAchievementUnlockedIds();
    let changed = false;
    for (const id of achIds) {
      if (!save.ownedIds.includes(id)) {
        save.ownedIds = [...save.ownedIds, id];
        changed = true;
      }
    }
    // Ensure free starters always owned
    for (const id of FREE_STARTER_IDS) {
      if (!save.ownedIds.includes(id)) {
        save.ownedIds = [...save.ownedIds, id];
        changed = true;
      }
    }
    if (changed) saveChallengerSave(save);
    return save;
  } catch {
    const save: ChallengerSave = { arcaneShards: 0, ownedIds: [...FREE_STARTER_IDS], equippedId: FREE_STARTER_IDS[0] ?? null };
    saveChallengerSave(save);
    return save;
  }
}

export function saveChallengerSave(save: ChallengerSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch { /* ignore */ }
}

export function addShards(amount: number): ChallengerSave {
  const save = loadChallengerSave();
  save.arcaneShards = save.arcaneShards + amount;
  saveChallengerSave(save);
  return save;
}

export function buyChallenger(id: string): ChallengerSave | null {
  const challenger = CHALLENGERS.find(c => c.id === id);
  if (!challenger) return null;
  const save = loadChallengerSave();
  if (save.ownedIds.includes(id)) return save;
  if (save.arcaneShards < challenger.cost) return null;
  save.arcaneShards -= challenger.cost;
  save.ownedIds = [...save.ownedIds, id];
  saveChallengerSave(save);
  return save;
}

export function equipChallenger(id: string): ChallengerSave {
  const save = loadChallengerSave();
  if (save.equippedId === id) {
    save.equippedId = null;
  } else {
    save.equippedId = id;
  }
  saveChallengerSave(save);
  return save;
}

export function unlockChallengerFree(id: string): ChallengerSave {
  const save = loadChallengerSave();
  if (!save.ownedIds.includes(id)) {
    save.ownedIds = [...save.ownedIds, id];
    saveChallengerSave(save);
  }
  return save;
}

export const SHARDS_PER_WIN = 150;
