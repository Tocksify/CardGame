import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setRarityBoost } from '../lib/cards';
import { DEFAULT_ACHIEVEMENTS } from '../store/achievements';

export interface Account {
  id: number;
  username: string;
  isAdmin: boolean;
  arcaneShards: number;
  rarityBoost: number;
  unlockedAchievementIds: string[];
  purchasedChallengerIds: string[];
  /** Challenger IDs gifted by an admin (e.g. secret/chromatic challengers) */
  giftedChallengerIds: string[];
  /** Map of achievement ID → progress value for in-progress achievements */
  achievementProgress: Record<string, number>;
}

interface AccountContextType {
  account: Account | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  updateLocalShards: (newValue: number) => void;
  unlockAchievement: (achievementId: string) => Promise<void>;
  saveAchievementProgress: (progress: Record<string, number>) => Promise<void>;
  recordMatch: (result: 'win' | 'loss', opponentName: string, gameMode: string, shardsEarned: number) => Promise<void>;
}

const AccountContext = createContext<AccountContextType | null>(null);

const API = '/api';

/** Parses the unlockedAchievementIds field which comes back as a JSON string from the DB */
function parseAchievementIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

/** Parses the achievementProgress field which comes back as a JSON string from the DB */
function parseAchievementProgress(raw: unknown): Record<string, number> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, number>;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}

/** Mirrors the signed-in account's achievement state into localStorage.
 *  Server is authoritative for unlock status AND progress values. */
function syncAchievementsToLocalStorage(ids: string[], progress: Record<string, number> = {}) {
  try {
    const stored = localStorage.getItem('aethermancer_achievements');
    const base = stored ? JSON.parse(stored) : [];
    const merged = DEFAULT_ACHIEVEMENTS.map(def => {
      const found = base.find((p: { id: string }) => p.id === def.id);
      // Server progress wins if present, otherwise keep localStorage value
      const serverProg = progress[def.id];
      const localProg = found?.progress ?? def.progress;
      return {
        ...def,
        unlocked: ids.includes(def.id),
        progress: serverProg !== undefined ? serverProg : localProg,
      };
    });
    localStorage.setItem('aethermancer_achievements', JSON.stringify(merged));
  } catch { /* ignore */ }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAccount = useCallback((raw: Record<string, unknown> | null) => {
    if (!raw) {
      setAccount(null);
      setRarityBoost(0);
      return;
    }
    const acc: Account = {
      id: raw.id as number,
      username: raw.username as string,
      isAdmin: raw.isAdmin as boolean,
      arcaneShards: raw.arcaneShards as number,
      rarityBoost: raw.rarityBoost as number,
      unlockedAchievementIds: parseAchievementIds(raw.unlockedAchievementIds),
      purchasedChallengerIds: parseAchievementIds(raw.purchasedChallengerIds),
      giftedChallengerIds: parseAchievementIds(raw.giftedChallengerIds),
      achievementProgress: parseAchievementProgress(raw.achievementProgress),
    };
    setAccount(acc);
    setRarityBoost(acc.rarityBoost);
    syncAchievementsToLocalStorage(acc.unlockedAchievementIds, acc.achievementProgress);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (res.ok) {
        applyAccount(await res.json());
      } else {
        applyAccount(null);
      }
    } catch {
      applyAccount(null);
    }
  }, [applyAccount]);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'Login failed';
      applyAccount(data);
      return null;
    } catch {
      return 'Network error';
    }
  }, [applyAccount]);

  const register = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'Registration failed';
      applyAccount(data);
      return null;
    } catch {
      return 'Network error';
    }
  }, [applyAccount]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    // Wipe all account-linked localStorage so the guest state is truly empty
    localStorage.removeItem('aethermancer_challengers');
    localStorage.removeItem('aethermancer_achievements');
    localStorage.removeItem('aethermancer_account');
    applyAccount(null);
  }, [applyAccount]);

  const refreshAccount = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const updateLocalShards = useCallback((newValue: number) => {
    setAccount(prev => prev ? { ...prev, arcaneShards: newValue } : prev);
  }, []);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!account || !achievementId) return;
    const ids = account.unlockedAchievementIds.includes(achievementId)
      ? account.unlockedAchievementIds
      : [...account.unlockedAchievementIds, achievementId];
    try {
      const res = await fetch(`${API}/account/achievements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ achievementIds: ids }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const nextIds = parseAchievementIds(data.unlockedAchievementIds);
      setAccount(prev => prev ? { ...prev, unlockedAchievementIds: nextIds } : prev);
      syncAchievementsToLocalStorage(nextIds, account?.achievementProgress ?? {});
    } catch { /* ignore */ }
  }, [account]);

  const saveAchievementProgress = useCallback(async (progress: Record<string, number>) => {
    if (!account) return;
    try {
      const res = await fetch(`${API}/account/achievement-progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ progress }),
      });
      if (!res.ok) return;
      setAccount(prev => prev ? { ...prev, achievementProgress: progress } : prev);
    } catch { /* ignore */ }
  }, [account]);

  const recordMatch = useCallback(async (
    result: 'win' | 'loss',
    opponentName: string,
    gameMode: string,
    shardsEarned: number,
  ) => {
    if (!account) return;
    try {
      const res = await fetch(`${API}/account/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ result, opponentName, gameMode, shardsEarned }),
      });
      if (res.ok) {
        // Refresh the full account so shards, achievements, and progress are all in sync
        await fetchMe();
      }
    } catch { /* ignore */ }
  }, [account, fetchMe]);

  return (
    <AccountContext.Provider value={{
      account, loading,
      login, register, logout, refreshAccount,
      updateLocalShards, unlockAchievement, saveAchievementProgress, recordMatch,
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
