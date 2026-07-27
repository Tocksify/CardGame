import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ChallengerSave,
  loadChallengerSave,
  saveChallengerSave,
  addShards as storeAddShards,
  buyChallenger as storeBuyChallenger,
  equipChallenger as storeEquipChallenger,
  unlockChallengerFree,
  SHARDS_PER_WIN,
} from '../store/challengers';
import { getChallengerById, Challenger } from '../lib/challengers';
import { useAccount } from './AccountContext';

const API = '/api';

interface ChallengerContextType {
  save: ChallengerSave;
  equippedChallenger: Challenger | null;
  isOwned: (id: string) => boolean;
  isEquipped: (id: string) => boolean;
  buyChallenger: (id: string) => boolean;
  equipChallenger: (id: string) => void;
  addShards: (amount: number) => void;
  unlockFree: (id: string) => void;
}

const ChallengerContext = createContext<ChallengerContextType | undefined>(undefined);

export function ChallengerProvider({ children }: { children: React.ReactNode }) {
  const [save, setSave] = useState<ChallengerSave>(() => loadChallengerSave());
  const { account, updateLocalShards } = useAccount();

  // Re-sync from localStorage (picks up achievement unlocks)
  useEffect(() => {
    const synced = loadChallengerSave();
    setSave(synced);
  }, []);

  // When the account's shard balance changes (login, win, admin set), sync to challenger save
  useEffect(() => {
    if (account == null) return;
    setSave(prev => {
      if (prev.arcaneShards === account.arcaneShards) return prev;
      const updated = { ...prev, arcaneShards: account.arcaneShards };
      saveChallengerSave(updated);
      return updated;
    });
  }, [account?.arcaneShards]);

  // When account achievement IDs change (login / admin unlock), re-sync localStorage to pick up unlocks
  useEffect(() => {
    if (!account?.unlockedAchievementIds?.length) return;
    const synced = loadChallengerSave();
    setSave(synced);
  }, [account?.unlockedAchievementIds]);

  const isOwned = useCallback((id: string) => save.ownedIds.includes(id), [save]);
  const isEquipped = useCallback((id: string) => save.equippedId === id, [save]);

  const equippedChallenger = save.equippedId ? (getChallengerById(save.equippedId) ?? null) : null;

  const addShards = useCallback((amount: number) => {
    const result = storeAddShards(amount);
    setSave(result);
    // Keep AccountContext in sync (don't await, fire-and-forget)
    if (account) {
      const newTotal = result.arcaneShards;
      updateLocalShards(newTotal);
      fetch(`${API}/account/shards`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ delta: amount }),
      }).catch(() => {/* ignore */});
    }
  }, [account, updateLocalShards]);

  const buyChallenger = useCallback((id: string): boolean => {
    const result = storeBuyChallenger(id);
    if (!result) return false;
    setSave(result);
    // Keep AccountContext in sync
    if (account) {
      const delta = result.arcaneShards - save.arcaneShards; // negative (cost deducted)
      updateLocalShards(result.arcaneShards);
      fetch(`${API}/account/shards`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ delta }),
      }).catch(() => {/* ignore */});
    }
    return true;
  }, [account, save.arcaneShards, updateLocalShards]);

  const equipChallenger = useCallback((id: string) => {
    const result = storeEquipChallenger(id);
    setSave(result);
  }, []);

  const unlockFree = useCallback((id: string) => {
    const result = unlockChallengerFree(id);
    setSave(result);
  }, []);

  return (
    <ChallengerContext.Provider value={{ save, equippedChallenger, isOwned, isEquipped, buyChallenger, equipChallenger, addShards, unlockFree }}>
      {children}
    </ChallengerContext.Provider>
  );
}

export function useChallenger() {
  const ctx = useContext(ChallengerContext);
  if (!ctx) throw new Error('useChallenger must be used within ChallengerProvider');
  return ctx;
}

export { SHARDS_PER_WIN };
