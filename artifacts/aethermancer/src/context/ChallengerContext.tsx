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
import { getChallengerById, Challenger, CHALLENGERS } from '../lib/challengers';
import { useAccount } from './AccountContext';

const API = '/api';

interface ChallengerContextType {
  save: ChallengerSave;
  equippedChallenger: Challenger | null;
  isOwned: (id: string) => boolean;
  isEquipped: (id: string) => boolean;
  buyChallenger: (id: string) => Promise<boolean>;
  equipChallenger: (id: string) => void;
  addShards: (amount: number) => Promise<void>;
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

  // The server account is authoritative for signed-in users.
  // Restore both shard balance AND purchased challenger IDs from the server.
  useEffect(() => {
    if (!account) return;
    const synced = loadChallengerSave();

    // Merge server-purchased IDs into the local owned list (don't strip free starters or achievement ones)
    const serverPurchased: string[] = account.purchasedChallengerIds ?? [];
    const merged = [...new Set([...synced.ownedIds, ...serverPurchased])];

    const updated = { ...synced, arcaneShards: account.arcaneShards, ownedIds: merged };
    saveChallengerSave(updated);
    setSave(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]); // run once when account first loads (login)

  // Keep shards in sync whenever the server balance changes (e.g. after a win)
  useEffect(() => {
    if (!account) return;
    setSave(prev => {
      const updated = { ...prev, arcaneShards: account.arcaneShards };
      saveChallengerSave(updated); // keep localStorage current
      return updated;
    });
  }, [account?.arcaneShards]);

  // Reconcile achievement unlocks/removals when the server list changes.
  useEffect(() => {
    if (!account) return;
    const synced = loadChallengerSave();
    const updated = { ...synced, arcaneShards: account.arcaneShards };
    setSave(updated);
  }, [account?.unlockedAchievementIds]);

  const isOwned = useCallback((id: string) => save.ownedIds.includes(id), [save]);
  const isEquipped = useCallback((id: string) => save.equippedId === id, [save]);

  const equippedChallenger = save.equippedId ? (getChallengerById(save.equippedId) ?? null) : null;

  const addShards = useCallback(async (amount: number) => {
    if (account) {
      try {
        const res = await fetch(`${API}/account/shards`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ delta: amount }),
        });
        if (!res.ok) return;
        const data = await res.json();
        updateLocalShards(data.arcaneShards);
        setSave(prev => ({ ...prev, arcaneShards: data.arcaneShards }));
      } catch { /* ignore */ }
      return;
    }
    const result = storeAddShards(amount);
    setSave(result);
  }, [account, updateLocalShards]);

  const buyChallenger = useCallback(async (id: string): Promise<boolean> => {
    const base = account ? { ...save, arcaneShards: account.arcaneShards } : save;
    saveChallengerSave(base);
    const result = storeBuyChallenger(id);
    if (!result) return false;
    if (account) {
      const delta = result.arcaneShards - base.arcaneShards;
      try {
        // Deduct shards on the server
        const shardsRes = await fetch(`${API}/account/shards`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ delta }),
        });
        if (!shardsRes.ok) {
          saveChallengerSave(base);
          return false;
        }
        const shardsData = await shardsRes.json();
        updateLocalShards(shardsData.arcaneShards);

        // Persist the updated purchased-challenger list on the server
        // (exclude free starters and achievement-unlocked challengers — only paid purchases)
        const purchased = result.ownedIds.filter(ownedId => {
          const ch = CHALLENGERS.find(c => c.id === ownedId);
          return ch && !ch.isFreeStarter && !ch.unlockedByAchievement;
        });
        void fetch(`${API}/account/challengers`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ purchasedChallengerIds: purchased }),
        });

        const updated = { ...result, arcaneShards: shardsData.arcaneShards };
        saveChallengerSave(updated);
        setSave(updated);
        return true;
      } catch {
        saveChallengerSave(base);
        return false;
      }
    }
    setSave(result);
    return true;
  }, [account, save, updateLocalShards]);

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
