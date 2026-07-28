import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../lib/sounds';
import { useLobby } from '../context/LobbyContext';
import { useGame } from '../context/GameContext';
import { useChallenger } from '../context/ChallengerContext';
import { useMultiplayer, GameStartedPayload, RoomBot } from '../context/MultiplayerContext';
import { useAccount } from '../context/AccountContext';
import { drawFromPool, generateDeck, getCardTemplate } from '../lib/cards';
import { generateId } from '../store/gameStore';
import { ArrowLeft, Plus, Minus, Bot, User, Copy, LogIn, Swords, CheckCheck, Pencil, Wifi, WifiOff, Loader2, Send, MessageSquare, Zap } from 'lucide-react';

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
  const { setGameMode, setMatchType, setAutoCombat } = useLobby();
  const { dispatch } = useGame();
  const { equippedChallenger } = useChallenger();
  const { account } = useAccount();
  const {
    status, roomState, yourSocketId, serverError,
    setServerError, setRoomState,
    createRoom, joinRoom, leaveRoom, updateSettings, startGame,
    sendChatMessage, chatMessages,
    setOnGameStarted,
  } = useMultiplayer();

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // If logged in, use account username and skip the name-pick screen
  const [view, setView] = useState<View>(() =>
    account ? 'lobby' : (localStorage.getItem(USERNAME_KEY) ? 'lobby' : 'username')
  );
  const [username, setUsername] = useState<string>(
    () => account?.username ?? localStorage.getItem(USERNAME_KEY) ?? ''
  );
  const [usernameInput, setUsernameInput] = useState(username);
  const [usernameError, setUsernameError] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Keep username in sync with account changes
  useEffect(() => {
    if (account) {
      setUsername(account.username);
      setView(v => v === 'username' ? 'lobby' : v);
    }
  }, [account?.username]);

  useEffect(() => { setUsernameInput(username); }, [username]);

  // When roomState arrives, stop the loading spinner
  useEffect(() => {
    if (roomState) setIsJoining(false);
  }, [roomState]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleGameStarted = useCallback((payload: GameStartedPayload) => {
    const makeCardInstance = (tpl: any) => ({ ...tpl, instanceId: `card_${generateId()}` });
    // 8-card mode: give 6 cards (2 more arrive on first draw phase → makes 8)
    const makeHand = () => payload.gameMode === '8card' ? drawFromPool(6).map(makeCardInstance) : [];
    const makeDeck = () => generateDeck().map(makeCardInstance);

    // Use canonical playerOrder from server (already rotated so index 0 goes first).
    // This ensures each client's local human sits at a DIFFERENT index in the turn queue,
    // preventing all clients from having their human go first simultaneously.
    const playerOrder: string[] = payload.playerOrder?.length
      ? payload.playerOrder
      : [
          yourSocketId,
          ...payload.players.filter(p => p.socketId !== yourSocketId).map(p => p.socketId),
          ...payload.bots.map(b => b.id),
        ];

    // Build an ID→name map for deduplication
    const idToName: Record<string, string> = { [yourSocketId]: username };
    payload.players.forEach(p => { idToName[p.socketId] = p.name; });
    payload.bots.forEach(b => { idToName[b.id] = b.name; });

    const orderedRawNames = playerOrder.map(id => idToName[id] ?? 'Unknown');
    const humanNames = deduplicateNames(orderedRawNames);

    // Base stats template for non-human players
    const makeAiPlayer = (idx: number, name: string) => ({
      id: idx + 1, name, isHuman: false,
      hp: 30, maxHp: 30, aether: 3, maxAether: 3,
      deck: makeDeck(), hand: makeHand(),
      field: [], artifactSlot: null, artifactSlotTurns: 0,
      pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
      gold: 10, inventory: [], goldPerTurn: 0,
      aetherBonus: 0, perks: [], statBuffs: [],
      damageDealtThisTurn: 0, bonusGoldPending: 0,
    });

    // Find where the local player sits in the canonical order
    const myOrderIndex = playerOrder.findIndex(id => id === yourSocketId);

    // Build the local human player, then apply any equipped challenger effects
    let humanPlayer: any = {
      id: myOrderIndex + 1, name: humanNames[myOrderIndex] ?? username, isHuman: true,
      hp: 30, maxHp: 30, aether: 3, maxAether: 3,
      deck: makeDeck(), hand: makeHand(),
      field: [], artifactSlot: null, artifactSlotTurns: 0,
      pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
      gold: 10, inventory: [], goldPerTurn: 0,
      aetherBonus: 0, perks: [], statBuffs: [],
      damageDealtThisTurn: 0, bonusGoldPending: 0,
    };

    if (equippedChallenger) {
      const effects = equippedChallenger.effectKeys;
      if (effects.includes('bonus_gold_start_300')) humanPlayer.gold += 300;
      if (effects.includes('bonus_hp_10')) { humanPlayer.maxHp += 10; humanPlayer.hp += 10; }
      if (effects.includes('bonus_aether_3')) { humanPlayer.aetherBonus += 3; humanPlayer.aether += 3; }
      if (effects.includes('bonus_aether_4')) { humanPlayer.aetherBonus += 4; humanPlayer.aether += 4; }
      if (effects.includes('bonus_aether_15')) { humanPlayer.aetherBonus += 12; humanPlayer.aether += 12; }

      const perksToAdd: string[] = [];
      if (effects.includes('perk_poison_immune')) perksToAdd.push('perk_poison_immune');
      if (effects.includes('perk_stun_immune')) perksToAdd.push('perk_stun_immune');
      if (effects.includes('perk_draw_1')) perksToAdd.push('perk_draw_1');
      if (effects.includes('perk_resist_1')) perksToAdd.push('perk_resist_1');
      if (effects.includes('perk_undying')) perksToAdd.push('perk_undying');
      if (effects.includes('perk_deploy_bonus')) perksToAdd.push('perk_deploy_bonus');
      if (perksToAdd.length > 0) humanPlayer.perks = [...humanPlayer.perks, ...perksToAdd];

      if (effects.includes('start_legendary')) {
        const LEGENDARY_CHAR_IDS = ['c10', 'c11', 'h3', 'h9', 'h18', 'h19', 'l1', 'l2'];
        const shuffled = [...LEGENDARY_CHAR_IDS].sort(() => Math.random() - 0.5);
        for (const tplId of shuffled) {
          const tpl = getCardTemplate(tplId);
          if (tpl) {
            humanPlayer.hand = [...humanPlayer.hand, { ...tpl, instanceId: `card_${generateId()}` }];
            break;
          }
        }
      }
    }

    // Build players in canonical order; human is at their assigned index.
    // Bot slots → AI. Other human player slots → isRemoteHuman so the game loop
    // waits for a WS signal instead of auto-playing AI for them.
    const players = playerOrder.map((id, idx) => {
      if (id === yourSocketId) return { ...humanPlayer, id: idx + 1, name: humanNames[idx] };
      const isBot = payload.bots.some(b => b.id === id);
      if (isBot) return makeAiPlayer(idx, humanNames[idx]);
      return { ...makeAiPlayer(idx, humanNames[idx]), isRemoteHuman: true };
    });

    setGameMode(payload.gameMode);
    setMatchType('multiplayer');
    setAutoCombat(payload.autoCombat ?? false);

    dispatch({
      type: 'START_GAME',
      payload: {
        players,
        gameMode: payload.gameMode,
        matchType: 'multiplayer',
        ranked: false,
        difficulty: 'Normal' as const,
        startingPlayerIndex: 0, // playerOrder is already rotated — index 0 goes first
      },
    });

    setLocation(payload.gameMode === 'draft' ? '/pre-draft' : '/game');
  }, [username, yourSocketId, equippedChallenger, setGameMode, setMatchType, setAutoCombat, dispatch, setLocation]);

  // Register the GAME_STARTED callback with the persistent context
  useEffect(() => {
    setOnGameStarted(handleGameStarted);
    return () => setOnGameStarted(null);
  }, [setOnGameStarted, handleGameStarted]);

  const isHost = roomState ? roomState.hostId === yourSocketId : false;

  const bots = roomState?.bots ?? [];
  const gameMode = roomState?.gameMode ?? '8card';
  const autoCombat = roomState?.autoCombat ?? false;
  const totalPlayers = (roomState?.players.length ?? 0) + bots.length;

  // Host-only: optimistic update then sync to server
  const setBots = (newBots: RoomBot[]) => {
    if (!isHost || !roomState) return;
    setRoomState({ ...roomState, bots: newBots });
    updateSettings(gameMode, newBots, autoCombat);
  };

  const setLocalGameMode = (mode: '8card' | 'draft') => {
    if (!isHost || !roomState) return;
    setRoomState({ ...roomState, gameMode: mode });
    updateSettings(mode, bots, autoCombat);
  };

  const setLocalAutoCombat = (val: boolean) => {
    if (!isHost || !roomState) return;
    setRoomState({ ...roomState, autoCombat: val });
    updateSettings(gameMode, bots, val);
  };

  const addBot = () => {
    if (!isHost || bots.length >= 3 || totalPlayers >= 4) return;
    sounds.play('uiClick');
    const nextBotNum = bots.length + 1;
    const name = BOT_NAMES[(nextBotNum - 1) % BOT_NAMES.length];
    setBots([...bots, { id: `bot_${nextBotNum}`, name }]);
  };

  const removeBot = (id: string) => {
    if (!isHost) return;
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
            {humanPlayers.map((player) => {
              const isMe = player.socketId === yourSocketId;
              const isPlayerHost = player.socketId === roomState.hostId;
              return (
                <div
                  key={player.socketId}
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
                </div>
              );
            })}

            {/* Bots */}
            {bots.map((bot) => (
              <div
                key={bot.id}
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
                    className="ml-auto w-8 h-8 flex items-center justify-center border border-border hover:border-red-500/60 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Remove bot"
                  >
                    <Minus size={13} />
                  </button>
                )}
              </div>
            ))}

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
              { key: '8card' as const, label: '8 Card Draw', desc: 'Start with 6 cards + 2 on draw. Quick and accessible.' },
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
          {/* Auto-combat toggle */}
          <div className="px-4 pb-4">
            <button
              onClick={() => isHost && setLocalAutoCombat(!autoCombat)}
              disabled={!isHost}
              className={`w-full flex items-center gap-3 p-3 border transition-colors ${
                autoCombat
                  ? 'bg-amber-950/20 border-amber-500/50 text-amber-400'
                  : 'bg-secondary/20 border-border text-muted-foreground'
              } ${!isHost ? 'cursor-default' : 'hover:border-amber-500/30'}`}
            >
              <Zap size={15} className={autoCombat ? 'text-amber-400' : 'text-muted-foreground'} />
              <div className="text-left">
                <div className="font-display font-bold text-sm">Auto-Combat {autoCombat ? 'ON' : 'OFF'}</div>
                <div className="text-xs opacity-60 leading-snug">Your cards attack automatically each combat phase.</div>
              </div>
              <div className={`ml-auto w-8 h-4 rounded-full transition-colors ${autoCombat ? 'bg-amber-500' : 'bg-secondary border border-border'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white mt-0.5 transition-all ${autoCombat ? 'ml-3.5' : 'ml-0.5'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-card border border-border flex flex-col" style={{ height: 240 }}>
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 shrink-0">
            <MessageSquare size={14} className="text-primary" />
            <h2 className="font-display text-base text-primary">Room Chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 min-h-0">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 text-center mt-4">No messages yet. Say hello!</p>
            ) : (
              chatMessages.map((m, i) => (
                <div key={i} className="flex gap-1.5 items-start text-sm">
                  <span className="font-semibold text-primary/80 shrink-0 text-xs leading-5">{m.fromName}:</span>
                  <span className="text-muted-foreground text-xs leading-5 break-words">{m.text}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="px-3 py-2 border-t border-border shrink-0 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value.slice(0, 200))}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Type a message…"
              className="flex-1 bg-input border border-border px-3 py-1.5 text-sm outline-none focus:border-primary/60 transition-colors text-foreground"
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary disabled:opacity-30 transition-colors"
            >
              <Send size={14} />
            </button>
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
