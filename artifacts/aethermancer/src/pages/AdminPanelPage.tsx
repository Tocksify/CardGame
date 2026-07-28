import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Search, Shield, Coins, Zap, Trophy, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import { sounds } from '../lib/sounds';
import { DEFAULT_ACHIEVEMENTS } from '../store/achievements';
import { CARD_TEMPLATES, CardRarity } from '../lib/cards';

const CODEX_CARDS = CARD_TEMPLATES.filter(c => !c.templateId.startsWith('ev_'));
const RARITY_ORDER: CardRarity[] = ['common', 'rare', 'legendary', 'secret'];

interface AdminUser {
  id: number;
  username: string;
  isAdmin: boolean;
  arcaneShards: number;
  rarityBoost: number;
  unlockedAchievementIds: string | string[];
  giftedChallengerIds: string | string[];
  discoveredCardIds: string | string[];
  createdAt: string;
}

function parseIds(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

const BOOST_LABELS = ['Normal', 'Buffed', 'Admin-tier'];

export default function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const { account, refreshAccount } = useAccount();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shardsInput, setShardsInput] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [expandedAch, setExpandedAch] = useState<Record<number, boolean>>({});
  const [expandedCodex, setExpandedCodex] = useState<Record<number, boolean>>({});

  // Redirect if not admin
  useEffect(() => {
    if (account && !account.isAdmin) setLocation('/');
  }, [account, setLocation]);

  const flash = (userId: number, msg: string) => {
    setFeedback(prev => ({ ...prev, [userId]: msg }));
    setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[userId]; return n; }), 2500);
  };

  const search = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (!res.ok) { setError('Failed to load users'); setLoading(false); return; }
      setUsers(await res.json());
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }, [query]);

  useEffect(() => { search(); }, []); // load all on mount

  const patchUser = async (userId: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const updated: AdminUser = await res.json();
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    // If we just changed our own account, refresh AccountContext so UI stays in sync
    if (account && userId === account.id) {
      await refreshAccount();
    }
    return updated;
  };

  const setShards = async (userId: number) => {
    const val = parseInt(shardsInput[userId] ?? '', 10);
    if (isNaN(val)) return;
    sounds.play('uiClick');
    const updated = await patchUser(userId, { arcaneShards: val });
    if (updated) flash(userId, '✓ Shards saved');
  };

  const setBoost = async (userId: number, boost: number) => {
    sounds.play('uiClick');
    const updated = await patchUser(userId, { rarityBoost: boost });
    if (updated) flash(userId, `✓ Boost → ${BOOST_LABELS[boost]}`);
  };

  const toggleAchievement = async (userId: number, achievementId: string, currentIds: string[]) => {
    sounds.play('uiClick');
    const hasIt = currentIds.includes(achievementId);
    const newIds = hasIt
      ? currentIds.filter(id => id !== achievementId)
      : [...currentIds, achievementId];
    const updated = await patchUser(userId, { unlockedAchievementIds: newIds });
    if (updated) flash(userId, hasIt ? `✗ Removed ${achievementId}` : `✓ Unlocked ${achievementId}`);
  };

  const unlockAll = async (userId: number) => {
    sounds.play('uiClick');
    const allIds = DEFAULT_ACHIEVEMENTS.map(a => a.id);
    const updated = await patchUser(userId, { unlockedAchievementIds: allIds });
    if (updated) flash(userId, '✓ All achievements unlocked');
  };

  const clearAll = async (userId: number) => {
    sounds.play('uiClick');
    const updated = await patchUser(userId, { unlockedAchievementIds: [] });
    if (updated) flash(userId, '✓ Achievements cleared');
  };

  const toggleCard = async (userId: number, templateId: string, currentIds: string[]) => {
    sounds.play('uiClick');
    const hasIt = currentIds.includes(templateId);
    const newIds = hasIt ? currentIds.filter(id => id !== templateId) : [...currentIds, templateId];
    const updated = await patchUser(userId, { discoveredCardIds: newIds });
    if (updated) flash(userId, hasIt ? `Removed ${templateId}` : `Unlocked ${templateId}`);
  };

  const unlockAllCards = async (userId: number) => {
    sounds.play('uiClick');
    const allIds = CODEX_CARDS.map(c => c.templateId);
    const updated = await patchUser(userId, { discoveredCardIds: allIds });
    if (updated) flash(userId, '✓ All codex cards unlocked');
  };

  const clearAllCards = async (userId: number) => {
    sounds.play('uiClick');
    const updated = await patchUser(userId, { discoveredCardIds: [] });
    if (updated) flash(userId, '✓ Codex cleared');
  };

  const toggleMorthus = async (userId: number, currentGifted: string[]) => {
    sounds.play('uiClick');
    const hasMorthus = currentGifted.includes('morthus');
    const newIds = hasMorthus
      ? currentGifted.filter(id => id !== 'morthus')
      : [...currentGifted, 'morthus'];
    const updated = await patchUser(userId, { giftedChallengerIds: newIds });
    if (updated) flash(userId, hasMorthus ? '✗ Morthus revoked' : '✦ Morthus gifted');
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <button
            onClick={() => { sounds.play('uiClick'); setLocation('/options'); }}
            className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <Shield size={20} className="text-purple-400" />
          <h1 className="text-2xl font-display text-purple-400 tracking-widest">ADMIN PANEL</h1>
        </header>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border px-3 py-2">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Search by username…"
              className="bg-transparent outline-none text-foreground flex-1 text-sm"
            />
          </div>
          <button
            onClick={search}
            className="px-4 py-2 bg-secondary border border-border hover:border-primary/50 text-sm font-bold transition-colors"
          >
            SEARCH
          </button>
        </div>

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}
        {loading && <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>}

        <div className="flex flex-col gap-3">
          {users.map(user => {
            const achIds = parseIds(user.unlockedAchievementIds);
            const cardIds = parseIds(user.discoveredCardIds);
            const achExpanded = expandedAch[user.id] ?? false;
            const codexExpanded = expandedCodex[user.id] ?? false;

            return (
              <div key={user.id} className="bg-card border border-border p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{user.username}</span>
                      {user.isAdmin && (
                        <span className="text-[10px] text-purple-400 border border-purple-400/30 px-1.5 py-0.5 uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ID: {user.id} · Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {feedback[user.id] && (
                    <span className="text-xs text-emerald-400">{feedback[user.id]}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 items-end mb-3">
                  {/* Shards */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                      <Coins size={11} /> Arcane Shards
                    </label>
                    <div className="flex gap-1 items-center">
                      <span className="text-amber-400 font-bold text-sm min-w-[3rem]">{user.arcaneShards.toLocaleString()}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Set to…"
                        value={shardsInput[user.id] ?? ''}
                        onChange={e => setShardsInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && setShards(user.id)}
                        className="w-24 bg-background border border-border px-2 py-1 text-sm outline-none focus:border-primary text-foreground"
                      />
                      <button
                        onClick={() => setShards(user.id)}
                        className="px-2 py-1 text-xs bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-colors"
                      >
                        SET
                      </button>
                    </div>
                  </div>

                  {/* Rarity Boost */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                      <Zap size={11} /> Card Draw Boost
                    </label>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(b => (
                        <button
                          key={b}
                          onClick={() => setBoost(user.id, b)}
                          className={`px-3 py-1 text-xs border transition-colors font-bold ${
                            user.rarityBoost === b
                              ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                              : 'bg-secondary border-border text-muted-foreground hover:border-purple-400/50'
                          }`}
                        >
                          {BOOST_LABELS[b]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Morthus gift — only visible to glo */}
                {account?.username === 'glo' && (() => {
                  const giftedIds = parseIds(user.giftedChallengerIds);
                  const hasMorthus = giftedIds.includes('morthus');
                  return (
                    <div className="border-t border-fuchsia-500/20 pt-3 mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-fuchsia-300/80 flex items-center gap-1.5 uppercase tracking-wider">
                          <span>✦</span> Chromatic Challenger — Morthus
                        </span>
                        <button
                          onClick={() => toggleMorthus(user.id, giftedIds)}
                          className={`px-3 py-1 text-xs border font-bold transition-colors ${
                            hasMorthus
                              ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 hover:bg-fuchsia-500/30'
                              : 'bg-secondary border-border text-muted-foreground hover:border-fuchsia-400/50 hover:text-fuchsia-300'
                          }`}
                        >
                          {hasMorthus ? '✦ GIFTED — Revoke' : 'Gift Morthus'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Achievements section */}
                <div className="border-t border-border pt-3">
                  <button
                    onClick={() => setExpandedAch(prev => ({ ...prev, [user.id]: !achExpanded }))}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider w-full"
                  >
                    <Trophy size={11} className="text-amber-400" />
                    Achievements ({achIds.length}/{DEFAULT_ACHIEVEMENTS.length})
                    {achExpanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
                  </button>

                  {achExpanded && (
                    <div className="mt-3">
                      {/* Bulk actions */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => unlockAll(user.id)}
                          className="px-3 py-1 text-xs bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-colors"
                        >
                          Unlock All
                        </button>
                        <button
                          onClick={() => clearAll(user.id)}
                          className="px-3 py-1 text-xs bg-destructive/10 border border-destructive/30 text-destructive/70 hover:bg-destructive/20 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Per-achievement toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {DEFAULT_ACHIEVEMENTS.map(ach => {
                          const unlocked = achIds.includes(ach.id);
                          return (
                            <button
                              key={ach.id}
                              onClick={() => toggleAchievement(user.id, ach.id, achIds)}
                              className={`flex items-start gap-2 p-2 border text-left transition-colors ${
                                unlocked
                                  ? 'border-amber-500/50 bg-amber-500/10 text-foreground'
                                  : 'border-border bg-background text-muted-foreground hover:border-border/70'
                              }`}
                            >
                              <span className={`mt-0.5 text-sm font-bold leading-none ${unlocked ? 'text-amber-400' : 'text-muted-foreground/50'}`}>
                                {unlocked ? '✓' : '○'}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold leading-tight">{ach.name}</div>
                                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{ach.description}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Codex section */}
                <div className="border-t border-border pt-3 mt-3">
                  <button
                    onClick={() => setExpandedCodex(prev => ({ ...prev, [user.id]: !codexExpanded }))}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider w-full"
                  >
                    <BookOpen size={11} className="text-cyan-400" />
                    Card Codex ({cardIds.length}/{CODEX_CARDS.length})
                    {codexExpanded ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
                  </button>

                  {codexExpanded && (
                    <div className="mt-3">
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => unlockAllCards(user.id)}
                          className="px-3 py-1 text-xs bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                        >
                          Unlock All
                        </button>
                        <button
                          onClick={() => clearAllCards(user.id)}
                          className="px-3 py-1 text-xs bg-destructive/10 border border-destructive/30 text-destructive/70 hover:bg-destructive/20 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      {RARITY_ORDER.map(rarity => {
                        const rarityCards = CODEX_CARDS.filter(c => (c.rarity ?? 'common') === rarity);
                        if (!rarityCards.length) return null;
                        const rarityColors: Record<string, string> = {
                          common: 'text-gray-400', rare: 'text-purple-400',
                          legendary: 'text-amber-400', secret: 'text-red-400',
                        };
                        return (
                          <div key={rarity} className="mb-3">
                            <p className={`text-[10px] uppercase tracking-widest font-bold mb-1.5 ${rarityColors[rarity]}`}>
                              {rarity} ({rarityCards.filter(c => cardIds.includes(c.templateId)).length}/{rarityCards.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {rarityCards.map(card => {
                                const discovered = cardIds.includes(card.templateId);
                                return (
                                  <button
                                    key={card.templateId}
                                    onClick={() => toggleCard(user.id, card.templateId, cardIds)}
                                    className={`flex items-start gap-2 p-2 border text-left transition-colors ${
                                      discovered
                                        ? 'border-cyan-500/50 bg-cyan-500/10 text-foreground'
                                        : 'border-border bg-background text-muted-foreground hover:border-cyan-500/30'
                                    }`}
                                  >
                                    <span className={`mt-0.5 text-sm font-bold leading-none ${discovered ? 'text-cyan-400' : 'text-muted-foreground/50'}`}>
                                      {discovered ? '✓' : '○'}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold leading-tight">{card.name}</div>
                                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{card.type} · {card.templateId}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!loading && users.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              {query ? 'No users found.' : 'No accounts yet.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
