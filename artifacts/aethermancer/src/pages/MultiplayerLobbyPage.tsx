import { useState } from 'react';
import { useLocation } from 'wouter';
import { sounds } from '../lib/sounds';
import { useLobby } from '../context/LobbyContext';
import { loadAccount, createAccount, getRankLabel, Account } from '../store/account';
import { ArrowLeft, Trophy, Swords, ScrollText, User, Shield } from 'lucide-react';

export default function MultiplayerLobbyPage() {
  const [, setLocation] = useLocation();
  const { setGameMode, setMatchType, setRanked } = useLobby();

  const [account, setAccount] = useState<Account | null>(() => loadAccount());
  const [usernameInput, setUsernameInput] = useState('');
  const [showCreateAccount, setShowCreateAccount] = useState(!loadAccount());
  const [selectedMode, setSelectedMode] = useState<'unranked' | 'ranked'>('unranked');
  const [selectedDraw, setSelectedDraw] = useState<'8card' | 'draft'>('8card');

  const handleCreateAccount = () => {
    if (!usernameInput.trim()) return;
    const acc = createAccount(usernameInput);
    setAccount(acc);
    setShowCreateAccount(false);
  };

  const handleFindMatch = () => {
    sounds.play('uiClick');
    const isRanked = selectedMode === 'ranked';
    const mode = isRanked ? 'draft' : selectedDraw;
    setGameMode(mode);
    setMatchType('multiplayer');
    setRanked(isRanked);
    setLocation('/matchmaking');
  };

  if (showCreateAccount) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-card border border-border p-8 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-display text-primary mb-1">Create Account</h2>
            <p className="text-sm text-muted-foreground">Choose a name for ranked play. Your ELO starts at 1000.</p>
          </div>
          <input
            type="text"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
            placeholder="Your name..."
            maxLength={20}
            className="bg-input border border-border p-3 outline-none focus:border-primary transition-colors text-foreground"
          />
          <button
            onClick={handleCreateAccount}
            disabled={!usernameInput.trim()}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold disabled:opacity-40"
          >
            Create Account
          </button>
          <button
            onClick={() => { sounds.play('uiClick'); setLocation('/'); }}
            className="text-sm text-muted-foreground hover:text-foreground text-center"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-6 md:p-10 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 pb-4 border-b border-border">
          <button onClick={() => { sounds.play('uiClick'); setLocation('/'); }} className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)]">
            MULTIPLAYER
          </h1>
        </header>

        {/* Account Badge */}
        {account && (
          <div className="mb-6 flex items-center gap-4 bg-card border border-border p-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <div className="font-semibold">{account.username}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-amber-400 font-bold">{account.elo} ELO</span>
                <span>·</span>
                <span>{getRankLabel(account.elo)}</span>
                <span>·</span>
                <span>{account.wins}W / {account.losses}L</span>
              </div>
            </div>
            <button
              onClick={() => setShowCreateAccount(true)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1"
            >
              Change
            </button>
          </div>
        )}

        {/* Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Unranked */}
          <button
            onClick={() => { sounds.play('uiClick'); setSelectedMode('unranked'); }}
            className={`flex flex-col gap-3 p-5 border text-left transition-colors ${selectedMode === 'unranked' ? 'bg-primary/10 border-primary/60' : 'bg-card border-border hover:border-primary/30'}`}
          >
            <div className="flex items-center gap-3">
              <Swords size={22} className={selectedMode === 'unranked' ? 'text-primary' : 'text-muted-foreground'} />
              <span className={`font-display text-xl font-bold ${selectedMode === 'unranked' ? 'text-primary' : 'text-foreground'}`}>Unranked</span>
            </div>
            <p className="text-sm text-muted-foreground">Casual play. No ELO change. Choose your game mode.</p>
            {selectedMode === 'unranked' && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-xs text-muted-foreground/70 mb-1">Select draw mode:</p>
                <div className="flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); sounds.play('uiClick'); setSelectedDraw('8card'); }}
                    className={`flex-1 py-2 text-xs font-semibold border transition-colors ${selectedDraw === '8card' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'}`}
                  >
                    8 Card Draw
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); sounds.play('uiClick'); setSelectedDraw('draft'); }}
                    className={`flex-1 py-2 text-xs font-semibold border transition-colors ${selectedDraw === 'draft' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'}`}
                  >
                    3 Card Draft
                  </button>
                </div>
              </div>
            )}
          </button>

          {/* Ranked */}
          <button
            onClick={() => { sounds.play('uiClick'); setSelectedMode('ranked'); }}
            className={`flex flex-col gap-3 p-5 border text-left transition-colors ${selectedMode === 'ranked' ? 'bg-amber-950/20 border-amber-500/60' : 'bg-card border-border hover:border-amber-500/30'}`}
          >
            <div className="flex items-center gap-3">
              <Trophy size={22} className={selectedMode === 'ranked' ? 'text-amber-400' : 'text-muted-foreground'} />
              <span className={`font-display text-xl font-bold ${selectedMode === 'ranked' ? 'text-amber-400' : 'text-foreground'}`}>Ranked</span>
            </div>
            <p className="text-sm text-muted-foreground">Compete for ELO. Always 3 Card Draft. Win 40-50 ELO. Lose minimum 40.</p>
            <div className="flex items-center gap-2 mt-1">
              <ScrollText size={14} className="text-amber-500/70" />
              <span className="text-xs text-amber-500/80 font-semibold">Draft Mode Only</span>
            </div>
            {account && selectedMode === 'ranked' && (
              <div className="mt-2 p-2 bg-amber-950/30 border border-amber-500/20 text-xs">
                <div className="text-amber-400 font-bold">{account.elo} ELO · {getRankLabel(account.elo)}</div>
              </div>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="bg-card/50 border border-border p-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Shield size={14} className="mt-0.5 shrink-0 text-muted-foreground/50" />
            <span>
              Matchmaking fills your game with real opponents. If the queue doesn't fill in time,
              skilled bots join to ensure you always get a match. Dead players in multiplayer can <strong className="text-foreground">spectate</strong> until the game ends.
            </span>
          </div>
        </div>

        <button
          onClick={handleFindMatch}
          className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-2xl font-bold tracking-widest border border-primary hover:border-white transition-all shadow-[0_0_15px_rgba(30,144,255,0.4)] hover:shadow-[0_0_25px_rgba(30,144,255,0.7)]"
        >
          FIND MATCH
        </button>
      </div>
    </div>
  );
}
