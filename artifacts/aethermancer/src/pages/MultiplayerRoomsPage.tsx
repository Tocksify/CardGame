import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../lib/sounds';
import { useLobby } from '../context/LobbyContext';
import { useGame } from '../context/GameContext';
import { drawFromPool, generateDeck } from '../lib/cards';
import { generateId } from '../store/gameStore';
import { ArrowLeft, Plus, Minus, Bot, User, Copy, LogIn, Swords, CheckCheck, Pencil, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useRoomSocket, RoomState, RoomBot, GameStartedPayload } from '../hooks/useRoomSocket';

const BOT_NAMES = [
  'Void Herald', 'Storm Arcane', 'Dusk Weaver', 'Iron Sage',
  'Ash Walker', 'Phantom Mage', 'Blood Hexer', 'Crypt Scholar',
  'Ember Witch', 'Frost Sage', 'Shadow Blade', 'Thunder Keep',
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function deduplicateNames(names: string[]): string[] {
  const count: Record<string, number> = {};
  for (const n of names) count[n] = (count[n] ?? 0) + 1;
  const seen: Record<string, number> = {};
  return names.map(n => {
    if (count[n] <= 1) return n;
    seen[n] = (seen[n] ?? 0) + 1;
    return `${n} (${seen[n]})`;
  });
}

const USERNAME_KEY = 'aethermancer_mp_username';

type View = 'username' | 'lobby' | 'room';

export default function MultiplayerRoomsPage() {
  const [, setLocation] = useLocation();
  const { setGameMode, setMatchType } = useLobby();
  const { dispatch } = useGame();

  const [view, setView] = useState<View>(() =>
    localStorage.getItem(USERNAME_KEY) ? 'lobby' : 'username'
  );
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem(USERNAME_KEY) ?? ''
  );
  const [usernameInput, setUsernameInput] = useState(username);
  const [usernameError, setUsernameError] = useState('');

  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);

  // Server-synced room state
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [yourSocketId, setYourSocketId] = useState<string>('');
  const [serverError, setServerError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => { setUsernameInput(username); }, [username]);

  const handleRoomState = useCallback((room: RoomState, socketId?: string) => {
    setRoomState(room);
    if (socketId) setYourSocketId(socketId);
    setIsJoining(false);
    setServerError('');
  }, []);

  const handleGameStarted = useCallback((payload: GameStartedPayload) => {
    const makeCardInstance = (tpl: any) => ({ ...tpl, instanceId: `card_${generateId()}` });
    const makeHand = () => payload.gameMode === '8card' ? drawFromPool(8).map(makeCardInstance) : [];
    const makeDeck = () => generateDeck().map(makeCardInstance);

    // Build players: I am always player 1 (human), others are opponents
    const humanNames = deduplicateNames([
      username,
      ...payload.players
        .filter(p => p.socketId !== yourSocketId)
        .map(p => p.name),
      ...payload.bots.map(b => b.name),
    ]);

    const players = [
      {
        id: 1, name: humanNames[0], isHuman: true,
        hp: 30, maxHp: 30, aether: 3, maxAether: 3,
        deck: makeDeck(), hand: makeHand(),
        field: [], artifactSlot: null, artifactSlotTurns: 0,
        pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
        gold: 10, inventory: [], goldPerTurn: 0,
        aetherBonus: 0, perks: [], statBuffs: [],
        damageDealtThisTurn: 0, bonusGoldPending: 0,
      },
      ...[
        ...payload.players.filter(p => p.socketId !== yourSocketId).map(p => p.name),
        ...payload.bots.map(b => b.name),
      ].map((name, i) => ({
        id: i + 2, name: humanNames[i + 1], isHuman: false,
        hp: 30, maxHp: 30, aether: 3, maxAether: 3,
        deck: makeDeck(), hand: makeHand(),
        field: [], artifactSlot: null, artifactSlotTurns: 0,
        pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
        gold: 10, inventory: [], goldPerTurn: 0,
        aetherBonus: 0, perks: [], statBuffs: [],
        damageDealtThisTurn: 0, bonusGoldPending: 0,
      })),
    ];

    setGameMode(payload.gameMode);
    setMatchType('multiplayer');

    dispatch({
      type: 'START_GAME',
      payload: {
        players,
        gameMode: payload.gameMode,
        matchType: 'multiplayer',
        ranked: false,
        difficulty: 'Normal' as const,
      },
    });

    setLocation(payload.gameMode === 'draft' ? '/pre-draft' : '/game');
  }, [username, yourSocketId, setGameMode, setMatchType, dispatch, setLocation]);

  const handleError = useCallback((message: string) => {
    setServerError(message);
    setIsJoining(false);
  }, []);

  const { status, createRoom, joinRoom, leaveRoom, updateSettings, startGame } = useRoomSocket({
    onRoomState: handleRoomState,
    onGameStarted: handleGameStarted,
    onError: handleError,
  });

  const isHost = roomState ? roomState.hostId === yourSocketId : false;

  // Derived bots from roomState
  const bots = roomState?.bots ?? [];
  const gameMode = roomState?.gameMode ?? '8card';
  const totalPlayers = (roomState?.players.length ?? 0) + bots.length;

  // Settings updates (host only) — send to server
  const setBots = (newBots: RoomBot[]) => {
    if (!isHost || !roomState) return;
    updateSettings(gameMode, newBots);
  };

  const setLocalGameMode = (mode: '8card' | 'draft') => {
    if (!isHost || !roomState) return;
    updateSettings(mode, bots);
  };

  const addBot = () => {
    if (!isHost || bots.length >= 3 || totalPlayers >= 4) return;
    sounds.play('uiClick');
    const nextBotNum = bots.length + 1;
    const name = BOT_NAMES[(nextBotNum - 1) % BOT_NAMES.length];
    setBots([...bots, { id: `bot_${nextBotNum}`, name }]);
  };

  const removeBot = (id: string) => {
    if (!isHost || bots.length <= 1) return;
    sounds.play('uiClick');
    setBots(bots.filter(b => b.id !== id));
  };

  const commitUsername = () => {
    const trimmed = usernameInput.trim().slice(0, 20);
    if (!trimmed) { setUsernameError('Enter a name to continue.'); return; }
    sounds.play('uiClick');
    setUsername(trimmed);
    localStorage.setItem(USERNAME_KEY, trimmed);
    setUsernameError('');
    setView('lobby');
  };

  const handleCreate = async () => {
    sounds.play('uiClick');
    setIsJoining(true);
    setServerError('');
    const code = generateRoomCode();
    try {
      await createRoom(code, username);
      setView('room');
    } catch {
      setServerError('Could not connect to the server. Please try again.');
      setIsJoining(false);
    }
  };

  const handleJoin = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6) { setJoinError('Room codes are 6 characters.'); return; }
    sounds.play('uiClick');
    setJoinError('');
    setIsJoining(true);
    setServerError('');
    try {
      await joinRoom(code, username);
      setView('room');
    } catch {
      setServerError('Could not connect to the server. Please try again.');
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    sounds.play('uiClick');
    if (view === 'room') {
      leaveRoom();
      setRoomState(null);
      setView('lobby');
    } else if (view === 'lobby') {
      setLocation('/');
    } else {
      setView('lobby');
    }
  };

  const copyCode = () => {
    if (!roomState) return;
    navigator.clipboard.writeText(roomState.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    sounds.play('uiClick');
    startGame();
  };

  /* ── Connection indicator ────────────────────────────────────────── */
  const ConnIndicator = () => {
    if (status === 'connected') return (
      <div className="flex items-center gap-1.5 text-xs text-green-400/70">
        <Wifi size={12} /> <span>Connected</span>
      </div>
    );
    if (status === 'connecting') return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-400/70">
        <Loader2 size={12} className="animate-spin" /> <span>Connecting…</span>
      </div>
    );
    if (status === 'error' || status === 'closed') return (
      <div className="flex items-center gap-1.5 text-xs text-red-400/70">
        <WifiOff size={12} /> <span>Disconnected</span>
      </div>
    );
    return null;
  };

  /* ── Shared wrapper ─────────────────────────────────────────────── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-[100dvh] bg-background text-foreground p-6 md:p-10 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-10 pb-4 border-b border-border">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)]">
            MULTIPLAYER
          </h1>
          <div className="ml-auto"><ConnIndicator /></div>
        </header>
        {children}
      </div>
    </div>
  );

  /* ── Username view ──────────────────────────────────────────────── */
  if (view === 'username') {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-sm mx-auto flex flex-col gap-5"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <User size={30} className="text-primary" />
            </div>
            <h2 className="text-2xl font-display text-primary mb-1">Choose Your Name</h2>
            <p className="text-sm text-muted-foreground">This is how you'll appear in the room.</p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={usernameInput}
              onChange={e => { setUsernameInput(e.target.value.slice(0, 20)); setUsernameError(''); }}
              onKeyDown={e => e.key === 'Enter' && commitUsername()}
              placeholder="Your name…"
              autoFocus
              className="bg-input border border-border p-4 outline-none focus:border-primary transition-colors text-foreground text-xl text-center tracking-wide"
            />
            <AnimatePresence>
              {usernameError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs text-center"
                >
                  {usernameError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={commitUsername}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-lg font-bold tracking-widest border border-primary transition-all shadow-[0_0_12px_rgba(30,144,255,0.3)]"
          >
            CONTINUE
          </button>
        </motion.div>
      </Shell>
    );
  }

  /* ── Lobby view ─────────────────────────────────────────────────── */
  if (view === 'lobby') {
    return (
      <Shell>
        {/* Signed-in-as bar */}
        <div className="flex items-center justify-between mb-6 px-4 py-3 bg-card border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User size={14} />
            Playing as <span className="text-foreground font-semibold ml-1">{username}</span>
          </div>
          <button
            onClick={() => { sounds.play('uiClick'); setView('username'); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Pencil size={12} /> Change
          </button>
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 bg-red-900/20 border border-red-500/40 text-red-400 text-sm"
            >
              {serverError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="bg-card border border-border p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-display text-primary mb-1">Create Room</h2>
              <p className="text-sm text-muted-foreground">
                Host a new match. A room code is generated for you to share.
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={isJoining}
              className="mt-auto w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-lg font-bold tracking-widest border border-primary transition-all shadow-[0_0_12px_rgba(30,144,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isJoining ? <Loader2 size={18} className="animate-spin" /> : null}
              CREATE ROOM
            </button>
          </div>

          {/* Join Room */}
          <div className="bg-card border border-border p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-display text-primary mb-1">Join Room</h2>
              <p className="text-sm text-muted-foreground">
                Enter a 6-character room code to join a friend's game.
              </p>
            </div>
            <input
              type="text"
              value={joinInput}
              onChange={e => { setJoinInput(e.target.value.toUpperCase().slice(0, 6)); setJoinError(''); setServerError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="ABC123"
              maxLength={6}
              className="bg-input border border-border p-3 outline-none focus:border-primary transition-colors text-foreground font-mono text-2xl tracking-[0.6em] text-center uppercase"
            />
            <AnimatePresence>
              {joinError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs -mt-2"
                >
                  {joinError}
                </motion.p>
              )}
            </AnimatePresence>
            <button
              onClick={handleJoin}
              disabled={joinInput.trim().length !== 6 || isJoining}
              className="w-full py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-display text-lg font-bold tracking-widest border border-border disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {isJoining ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              JOIN ROOM
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ── Room view ──────────────────────────────────────────────────── */
  if (!roomState) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 size={20} className="animate-spin" />
          <span>Connecting to room…</span>
        </div>
      </Shell>
    );
  }

  const humanPlayers = roomState.players;

  return (
    <Shell>
      {/* Room code banner */}
      <div className="-mt-6 mb-6 flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">Code:</span>
        <span
          className="font-mono text-xl font-bold tracking-[0.4em] text-primary border border-primary/50 px-3 py-1 bg-primary/5"
          title="Share this code with friends"
        >
          {roomState.code}
        </span>
        <button
          onClick={copyCode}
          title="Copy room code"
          className="p-2 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
        >
          {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Server error */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 px-4 py-3 bg-red-900/20 border border-red-500/40 text-red-400 text-sm"
          >
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-5">
        {/* Players list */}
        <div className="bg-card border border-border">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg text-primary">Players</h2>
            <span className="text-xs text-muted-foreground">{totalPlayers} / 4</span>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {/* Human players from server */}
            <AnimatePresence>
              {humanPlayers.map((player) => {
                const isMe = player.socketId === yourSocketId;
                const isPlayerHost = player.socketId === roomState.hostId;
                return (
                  <motion.div
                    key={player.socketId}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    className={`flex items-center gap-3 p-3 border ${isMe ? 'border-primary/40 bg-primary/10' : 'border-border bg-secondary/20'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-primary/20 border border-primary/40' : 'bg-secondary border border-border'}`}>
                      <User size={20} className={isMe ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div>
                      <div className={`font-semibold ${isMe ? '' : 'text-muted-foreground'}`}>{player.name}</div>
                      <div className="text-xs text-muted-foreground">{isMe ? 'You' : 'Player'}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {isPlayerHost && (
                        <span className="text-xs px-2 py-0.5 border border-primary/30 text-primary/70 font-display uppercase tracking-wider">
                          Host
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Bots */}
            <AnimatePresence>
              {bots.map((bot) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  className="flex items-center gap-3 p-3 border border-border bg-secondary/20"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                    <Bot size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground">{bot.name}</div>
                    <div className="text-xs text-muted-foreground/50">Bot</div>
                  </div>
                  {isHost && (
                    <button
                      onClick={() => removeBot(bot.id)}
                      disabled={bots.length <= 1}
                      className="ml-auto w-8 h-8 flex items-center justify-center border border-border hover:border-red-500/60 text-muted-foreground hover:text-red-400 disabled:opacity-30 transition-colors"
                      title="Remove bot"
                    >
                      <Minus size={13} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add bot — host only, and only if room has space */}
            {isHost && totalPlayers < 4 && bots.length < 3 && (
              <button
                onClick={addBot}
                className="flex items-center justify-center gap-2 p-3 border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus size={15} />
                <span className="text-sm font-display uppercase tracking-wider">Add Bot</span>
              </button>
            )}

            {/* Waiting for players hint (non-host) */}
            {!isHost && humanPlayers.length < 2 && (
              <div className="flex items-center justify-center gap-2 p-3 text-muted-foreground/50 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Waiting for the host to start…
              </div>
            )}
          </div>
        </div>

        {/* Game mode — host sees buttons, non-host sees read-only */}
        <div className="bg-card border border-border">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-display text-lg text-primary">Game Mode</h2>
          </div>
          <div className="p-4 flex gap-3">
            {([
              { key: '8card' as const, label: '8 Card Draw', desc: 'Start with 8 cards. Quick and accessible.' },
              { key: 'draft' as const, label: '3 Card Draft', desc: 'Pick your starting hand one at a time. More strategic.' },
            ] as const).map(m => (
              <button
                key={m.key}
                onClick={() => isHost && setLocalGameMode(m.key)}
                disabled={!isHost}
                className={`flex-1 py-3 px-4 border text-left transition-colors ${
                  gameMode === m.key
                    ? 'bg-primary/10 border-primary/60 text-primary'
                    : 'bg-secondary/20 border-border text-muted-foreground hover:border-primary/30'
                } ${!isHost ? 'cursor-default' : ''}`}
              >
                <div className="font-display font-bold text-sm mb-0.5">{m.label}</div>
                <div className="text-xs opacity-70 leading-snug">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start — host only */}
        {isHost ? (
          <button
            onClick={handleStart}
            className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-display text-2xl font-bold tracking-widest border border-primary hover:border-white transition-all shadow-[0_0_15px_rgba(30,144,255,0.4)] hover:shadow-[0_0_28px_rgba(30,144,255,0.7)] flex items-center justify-center gap-3"
          >
            <Swords size={22} />
            START MATCH
          </button>
        ) : (
          <div className="w-full py-5 bg-secondary/30 border border-border flex items-center justify-center gap-3 text-muted-foreground font-display text-xl tracking-widest">
            <Loader2 size={20} className="animate-spin" />
            WAITING FOR HOST
          </div>
        )}
      </div>
    </Shell>
  );
}
