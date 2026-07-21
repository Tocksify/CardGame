import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../lib/sounds';
import { useLobby } from '../context/LobbyContext';
import { useGame } from '../context/GameContext';
import { loadAccount } from '../store/account';
import { drawFromPool, generateDeck } from '../lib/cards';
import { generateId } from '../store/gameStore';

const BOT_NAMES = [
  'Void Herald', 'Storm Arcane', 'Dusk Weaver', 'Iron Sage',
  'Ash Walker', 'Phantom Mage', 'Blood Hexer', 'Crypt Scholar',
];

const BOT_ELO_RANGE = [900, 1050, 1100, 1200, 850, 980];

interface FoundPlayer {
  name: string;
  elo?: number;
  isBot: boolean;
}

export default function MatchmakingPage() {
  const [, setLocation] = useLocation();
  const { gameMode, ranked } = useLobby();
  const { dispatch } = useGame();

  const account = loadAccount();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [foundPlayers, setFoundPlayers] = useState<FoundPlayer[]>([
    { name: account?.username || 'YOU', elo: account?.elo, isBot: false },
  ]);
  const [status, setStatus] = useState('Searching for opponents...');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // First bot appears after 3s
    timeouts.push(setTimeout(() => {
      const bot1 = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const elo1 = ranked ? BOT_ELO_RANGE[Math.floor(Math.random() * BOT_ELO_RANGE.length)] : undefined;
      setFoundPlayers(p => [...p, { name: bot1, elo: elo1, isBot: true }]);
      setStatus('1 opponent found! Searching for more...');
      sounds.play('matchFound');
    }, 3000));

    // Second bot appears after 5.5s → then countdown
    timeouts.push(setTimeout(() => {
      const bot2 = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const elo2 = ranked ? BOT_ELO_RANGE[Math.floor(Math.random() * BOT_ELO_RANGE.length)] : undefined;
      setFoundPlayers(p => [...p, { name: bot2, elo: elo2, isBot: true }]);
      setStatus('Match found! Starting...');
      sounds.play('matchFound');
    }, 5500));

    // Launch game after 8.5s
    timeouts.push(setTimeout(() => {
      setReady(true);
    }, 8500));

    return () => timeouts.forEach(clearTimeout);
  }, [ranked]);

  useEffect(() => {
    if (!ready) return;

    const makeCardInstance = (tpl: any) => ({ ...tpl, instanceId: `card_${generateId()}` });
    // 8card: give 8 starting cards; draft: empty hand (pre-draft screen handles it)
    const makeHand = () => (gameMode === '8card' ? drawFromPool(8).map(makeCardInstance) : []);
    const makeDeck = () => generateDeck().map(makeCardInstance);

    const bots = foundPlayers.filter(p => p.isBot);

    const players = [
      {
        id: 1, name: account?.username || 'YOU', isHuman: true,
        hp: 30, maxHp: 30, aether: 3, maxAether: 3,
        deck: makeDeck(), hand: makeHand(),
        field: [], artifactSlot: null, artifactSlotTurns: 0,
        pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
        gold: 10, inventory: [], goldPerTurn: 0,
        aetherBonus: 0, perks: [], statBuffs: [],
        elo: account?.elo,
        damageDealtThisTurn: 0, bonusGoldPending: 0,
      },
      ...bots.map((b, i) => ({
        id: i + 2, name: b.name, isHuman: false,
        hp: 30, maxHp: 30, aether: 3, maxAether: 3,
        deck: makeDeck(), hand: makeHand(),
        field: [], artifactSlot: null, artifactSlotTurns: 0,
        pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
        gold: 10, inventory: [], goldPerTurn: 0,
        aetherBonus: 0, perks: [], statBuffs: [],
        elo: b.elo,
        damageDealtThisTurn: 0, bonusGoldPending: 0,
      })),
    ];

    dispatch({
      type: 'START_GAME',
      payload: { players, gameMode: gameMode || '8card', matchType: 'multiplayer', ranked: ranked || false, difficulty: 'Normal' as const },
    });
    // Draft mode: show pre-game card selection screen; 8card: go directly to game
    setLocation(gameMode === 'draft' ? '/pre-draft' : '/game');
  }, [ready]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full flex flex-col items-center gap-8">
        {/* Spinner */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full"
            style={{ animation: 'spin 1s linear infinite' }} />
          <div className="absolute inset-3 border-2 border-transparent border-t-amber-400/60 rounded-full"
            style={{ animation: 'spin 1.8s linear infinite reverse' }} />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-display text-primary mb-1">
            {ranked ? 'RANKED' : 'UNRANKED'} · {gameMode === 'draft' ? '3 Card Draft' : '8 Card Draw'}
          </h2>
          <p className="text-muted-foreground text-sm">{status}</p>
          <p className="text-muted-foreground/40 text-xs mt-1 font-mono">{formatTime(timeElapsed)}</p>
        </div>

        {/* Player slots */}
        <div className="w-full flex flex-col gap-2">
          {[0, 1, 2].map(idx => {
            const player = foundPlayers[idx];
            return (
              <AnimatePresence key={idx}>
                {player ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 p-3 border ${player.isBot ? 'border-border bg-secondary/30' : 'border-primary/40 bg-primary/10'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${player.isBot ? 'bg-secondary' : 'bg-primary/20'}`}>
                      {player.isBot ? '🤖' : '👤'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{player.name}</div>
                      {player.elo !== undefined && (
                        <div className="text-xs text-amber-400">{player.elo} ELO</div>
                      )}
                      {player.isBot && <div className="text-xs text-muted-foreground/50">Bot</div>}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border border-dashed border-border/40 bg-card/20">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-muted-foreground/30 rounded-full border-t-muted-foreground animate-spin" />
                    </div>
                    <span className="text-sm text-muted-foreground/40 italic">Searching...</span>
                  </div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        <button
          onClick={() => { sounds.play('uiClick'); setLocation('/'); }}
          className="text-sm text-muted-foreground hover:text-foreground border border-border px-6 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
