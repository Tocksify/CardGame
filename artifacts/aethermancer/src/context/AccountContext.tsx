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

/** Mirrors the signed-in account's achievement state into localStorage. */
function syncAchievementsToLocalStorage(ids: string[]) {
  try {
    const stored = localStorage.getItem('aethermancer_achievements');
    const base = stored ? JSON.parse(stored) : [];
    const merged = DEFAULT_ACHIEVEMENTS.map(def => {
      const found = base.find((p: { id: string }) => p.id === def.id);
      return {
        ...def,
        unlocked: ids.includes(def.id),
        progress: found?.progress ?? def.progress,
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
    };
    setAccount(acc);
    setRarityBoost(acc.rarityBoost);
    syncAchievementsToLocalStorage(acc.unlockedAchievementIds);
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
      syncAchievementsToLocalStorage(nextIds);
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
        const accRes = await fetch(`${API}/account`, { credentials: 'include' });
        if (accRes.ok) {
          const accData = await accRes.json();
          setAccount(prev => prev ? { ...prev, arcaneShards: accData.arcaneShards } : prev);
        }
      }
    } catch { /* ignore */ }
  }, [account]);

  return (
    <AccountContext.Provider value={{
      account, loading,
      login, register, logout, refreshAccount,
      updateLocalShards, unlockAchievement, recordMatch,
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
