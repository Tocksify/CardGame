import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount } from './AccountContext';

const CODEX_KEY = 'aethermancer_codex_v1';

function loadDiscovered(): Set<string> {
  try {
    const raw = localStorage.getItem(CODEX_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

interface CodexContextType {
  discoveredIds: Set<string>;
  discoverCards: (templateIds: string[]) => void;
  isDiscovered: (templateId: string) => boolean;
}

const CodexContext = createContext<CodexContextType | undefined>(undefined);

export function CodexProvider({ children }: { children: React.ReactNode }) {
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(loadDiscovered);
  const { account } = useAccount();

  // Merge server-side discovered card IDs (set by admin) into local state
  useEffect(() => {
    if (!account?.discoveredCardIds?.length) return;
    setDiscoveredIds(prev => {
      const hasNew = account.discoveredCardIds.some(id => !prev.has(id));
      if (!hasNew) return prev;
      const next = new Set(prev);
      account.discoveredCardIds.forEach(id => next.add(id));
      try {
        localStorage.setItem(CODEX_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, [account?.discoveredCardIds]);

  const discoverCards = useCallback((ids: string[]) => {
    setDiscoveredIds(prev => {
      const hasNew = ids.some(id => !prev.has(id));
      if (!hasNew) return prev;
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      try {
        localStorage.setItem(CODEX_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const isDiscovered = useCallback(
    (id: string) => discoveredIds.has(id),
    [discoveredIds],
  );

  return (
    <CodexContext.Provider value={{ discoveredIds, discoverCards, isDiscovered }}>
      {children}
    </CodexContext.Provider>
  );
}

export function useCodex() {
  const ctx = useContext(CodexContext);
  if (!ctx) throw new Error('useCodex must be used within CodexProvider');
  return ctx;
}
