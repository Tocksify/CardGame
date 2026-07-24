import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ChallengerSave,
  loadChallengerSave,
  saveChallengerSave,
  addShards as storeAddShards,
  buyChallenger as storeBuyChallenger,
  equipChallenger as storeEquipChallenger,
  unlockChallengerFree,
} from '../store/challengers';
import { getChallengerById, Challenger } from '../lib/challengers';

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

  // Re-sync from localStorage (picks up achievement unlocks)
  useEffect(() => {
    const synced = loadChallengerSave();
    setSave(synced);
  }, []);

  const isOwned = useCallback((id: string) => save.ownedIds.includes(id), [save]);
  const isEquipped = useCallback((id: string) => save.equippedId === id, [save]);

  const equippedChallenger = save.equippedId ? (getChallengerById(save.equippedId) ?? null) : null;

  const buyChallenger = useCallback((id: string): boolean => {
    const result = storeBuyChallenger(id);
    if (result) { setSave(result); return true; }
    return false;
  }, []);

  const equipChallenger = useCallback((id: string) => {
    const result = storeEquipChallenger(id);
    setSave(result);
  }, []);

  const addShards = useCallback((amount: number) => {
    const result = storeAddShards(amount);
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
