import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Search, Shield, Coins, Zap } from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import { sounds } from '../lib/sounds';

interface AdminUser {
  id: number;
  username: string;
  isAdmin: boolean;
  arcaneShards: number;
  rarityBoost: number;
  createdAt: string;
}

const BOOST_LABELS = ['Normal', 'Buffed', 'Admin-tier'];
const BOOST_COLORS = ['text-muted-foreground', 'text-amber-400', 'text-purple-400'];

export default function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const { account } = useAccount();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shardsInput, setShardsInput] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  // Redirect if not admin
  useEffect(() => {
    if (account && !account.isAdmin) setLocation('/');
  }, [account, setLocation]);

  const search = async () => {
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
  };

  useEffect(() => { search(); }, []); // load all on mount

  const setShards = async (userId: number) => {
    const val = parseInt(shardsInput[userId] ?? '', 10);
    if (isNaN(val)) return;
    sounds.play('uiClick');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ arcaneShards: val }),
    });
    if (res.ok) {
      const updated: AdminUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, arcaneShards: updated.arcaneShards } : u));
      setFeedback(prev => ({ ...prev, [userId]: '✓ Saved' }));
      setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[userId]; return n; }), 2000);
    }
  };

  const setBoost = async (userId: number, boost: number) => {
    sounds.play('uiClick');
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rarityBoost: boost }),
    });
    if (res.ok) {
      const updated: AdminUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rarityBoost: updated.rarityBoost } : u));
      setFeedback(prev => ({ ...prev, [userId]: `✓ Boost → ${BOOST_LABELS[boost]}` }));
      setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[userId]; return n; }), 2000);
    }
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

        {loading && (
          <div className="text-center text-muted-foreground py-8 text-sm">Loading…</div>
        )}

        <div className="flex flex-col gap-3">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-card border border-border p-4"
            >
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

              <div className="flex flex-wrap gap-3 items-end">
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
            </div>
          ))}

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
