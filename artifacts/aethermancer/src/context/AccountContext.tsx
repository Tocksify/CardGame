import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setRarityBoost } from '../lib/cards';

export interface Account {
  id: number;
  username: string;
  isAdmin: boolean;
  arcaneShards: number;
  rarityBoost: number;
}

interface AccountContextType {
  account: Account | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  updateLocalShards: (newValue: number) => void;
  recordMatch: (result: 'win' | 'loss', opponentName: string, gameMode: string, shardsEarned: number) => Promise<void>;
}

const AccountContext = createContext<AccountContextType | null>(null);

const API = '/api';

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAccount = (acc: Account | null) => {
    setAccount(acc);
    setRarityBoost(acc?.rarityBoost ?? 0);
  };

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        applyAccount(data);
      } else {
        applyAccount(null);
      }
    } catch {
      applyAccount(null);
    }
  }, []);

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
  }, []);

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
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    applyAccount(null);
  }, []);

  const refreshAccount = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const updateLocalShards = useCallback((newValue: number) => {
    setAccount(prev => prev ? { ...prev, arcaneShards: newValue } : prev);
  }, []);

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
        // Refresh shards from server
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
      updateLocalShards, recordMatch,
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
