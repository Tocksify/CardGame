import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useGame } from '../context/GameContext';
import { useLobby } from '../context/LobbyContext';
import { CardInstance, FieldCard, Player } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import { ShoppingCart, Package, Info, ShieldAlert, Swords, Heart, Activity, User, ScrollText, Zap, Clock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOP_ITEMS, ShopItemTemplate } from '../lib/cards';
import { CardArt } from '../components/game/CardArt';

// ── Tab → type mapping (fixes the filter bug) ────────────────────────────────
const TAB_TYPE_MAP: Record<string, ShopItemTemplate['type']> = {
  items:  'item',
  stat:   'stat',
  perks:  'perk',
  cards:  'card',
};

// ── Compact field card ────────────────────────────────────────────────────────
const FieldCardUI = ({
  card,
  playable,
  onClick,
  tapped = false,
  combatAnim = null,
}: {
  card: CardInstance | FieldCard;
  playable?: boolean;
  onClick?: () => void;
  tapped?: boolean;
  combatAnim?: { targetId: string; damage: number } | null;
}) => {
  const isCreature = card.type === 'creature';
  const fc = card as FieldCard;
  const displayAtk = fc.currentAtk ?? card.atk ?? 0;
  const displayDef = fc.currentDef ?? card.def ?? 1;
  const isEvolved = fc.evolved;

  let borderCls = 'border-border/60';
  if (card.rarity === 'rare')      borderCls = 'border-purple-500 shadow-[0_0_6px_rgba(147,112,219,0.7)]';
  if (card.rarity === 'legendary') borderCls = 'border-amber-400 shadow-[0_0_10px_rgba(255,165,0,0.8)]';
  if (isEvolved)                   borderCls = 'border-amber-300 shadow-[0_0_14px_rgba(245,197,24,1)]';

  const typeStripe: Record<string, string> = {
    creature: 'bg-blue-700', spell: 'bg-purple-700',
    artifact: 'bg-amber-700', enchantment: 'bg-emerald-700',
  };

  const isHit = combatAnim?.targetId === (card as any).instanceId;

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -4, zIndex: 50 }}
      onClick={onClick}
      className={`relative w-20 h-28 flex-shrink-0 bg-card border-2 cursor-pointer transition-colors duration-200
        ${playable ? 'border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.7)]' : borderCls}
        ${tapped ? 'opacity-60 rotate-[6deg]' : ''}
        ${isHit ? 'animate-[flash-red_0.3s_ease]' : ''}
      `}
    >
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* Name + cost */}
        <div className="h-[18%] flex items-center justify-between px-1 bg-gradient-to-b from-secondary to-transparent">
          <span className="text-[7px] font-display font-bold leading-tight truncate">{card.name}</span>
          <div className="w-4 h-4 flex items-center justify-center bg-card border border-primary text-primary text-[8px] font-bold transform rotate-45 shrink-0">
            <span className="-rotate-45">{card.cost}</span>
          </div>
        </div>
        {/* Art */}
        <div className="h-[38%] w-full">
          <CardArt templateId={card.templateId} type={card.type} />
        </div>
        {/* Type stripe */}
        <div className={`h-[8%] w-full ${typeStripe[card.type]} flex items-center px-1`}>
          <span className="text-[6px] font-bold text-white uppercase tracking-widest leading-none">{card.type}</span>
        </div>
        {/* Description */}
        <div className="h-[22%] p-0.5 bg-black/40 text-[6px] leading-tight text-secondary-foreground overflow-hidden">
          {card.description}
          {isEvolved && <div className="text-amber-400 font-bold">✦ EVOLVED</div>}
        </div>
        {/* Stats */}
        <div className="h-[14%] flex justify-between items-center px-1 border-t border-white/10 bg-black/60">
          {isCreature ? (
            <>
              <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[9px]">
                <Swords size={7} /> {displayAtk}
              </div>
              <div className="flex items-center gap-0.5 text-emerald-500 font-bold text-[9px]">
                <ShieldAlert size={7} /> {displayDef}
              </div>
            </>
          ) : (
            <div className="flex w-full justify-center text-muted-foreground"><Zap size={8} /></div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isHit && (
          <motion.div
            initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center text-2xl font-display font-bold text-red-500 drop-shadow-[0_0_4px_black] z-50 pointer-events-none"
          >
            -{combatAnim!.damage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Hand card (slightly larger) ───────────────────────────────────────────────
const HandCardUI = ({
  card,
  playable,
  onClick,
}: {
  card: CardInstance;
  playable?: boolean;
  onClick?: () => void;
}) => {
  let borderCls = 'border-border shadow-none';
  if (card.rarity === 'rare')      borderCls = 'border-purple-500 shadow-[0_0_8px_rgba(147,112,219,0.7)]';
  if (card.rarity === 'legendary') borderCls = 'border-amber-400 shadow-[0_0_12px_rgba(255,165,0,0.8)]';

  const typeStripe: Record<string, string> = {
    creature: 'bg-blue-700', spell: 'bg-purple-700',
    artifact: 'bg-amber-700', enchantment: 'bg-emerald-700',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.3, y: -20, zIndex: 50 }}
      onClick={onClick}
      className={`relative w-24 h-36 flex-shrink-0 bg-card border-[2px] cursor-pointer transition-colors duration-200
        ${playable ? 'border-primary shadow-[0_0_14px_rgba(30,144,255,0.8)]' : borderCls}
      `}
      onMouseEnter={() => playable && sounds.play('cardHover')}
    >
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        <div className="h-[20%] flex items-center justify-between px-1 bg-gradient-to-b from-secondary to-transparent">
          <span className="text-[9px] font-display font-bold leading-tight truncate">{card.name}</span>
          <div className="w-5 h-5 flex items-center justify-center bg-card border border-primary text-primary text-[9px] font-bold transform rotate-45 shrink-0">
            <span className="-rotate-45">{card.cost}</span>
          </div>
        </div>
        <div className="h-[35%] w-full">
          <CardArt templateId={card.templateId} type={card.type} />
        </div>
        <div className={`h-[8%] w-full ${typeStripe[card.type]} flex items-center px-1`}>
          <span className="text-[7px] font-bold text-white uppercase tracking-widest">{card.type}</span>
        </div>
        <div className="h-[25%] p-1 bg-black/40 text-[7px] leading-tight text-secondary-foreground overflow-hidden">
          {card.description}
        </div>
        <div className="h-[12%] flex justify-between items-center px-1 border-t border-white/10 bg-black/60">
          {card.type === 'creature' ? (
            <>
              <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                <Swords size={9} /> {card.atk}
              </div>
              <div className="flex items-center gap-0.5 text-emerald-500 font-bold text-[10px]">
                <ShieldAlert size={9} /> {card.def}
              </div>
            </>
          ) : (
            <div className="flex w-full justify-center text-muted-foreground"><Zap size={10} /></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Game Page ────────────────────────────────────────────────────────────
export default function GamePage() {
  const [, setLocation] = useLocation();
  const {
    gameState, dispatch, playCard, attackWith, buyItem, useInventoryItem,
    endPhase, achievementToast, combatAnim, announcement,
    shopRotationIds, shopRotationTimeLeft, buyPhaseTimeLeft,
  } = useGame();
  const { animatedBattlefield } = useLobby();

  const [countdown, setCountdown] = useState<number | null>(3);
  const [shopTab, setShopTab] = useState<'items' | 'stat' | 'perks' | 'cards'>('items');
  const [logOpen, setLogOpen] = useState(false);

  // Stable particle positions — generated once via useRef to fix animated battlefield
  const particles = useRef(
    [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
    }))
  ).current;

  useEffect(() => {
    if (gameState.phase === 'countdown') {
       const timers: NodeJS.Timeout[] = [];
       timers.push(setTimeout(() => setCountdown(2), 1000));
       timers.push(setTimeout(() => setCountdown(1), 2000));
       timers.push(setTimeout(() => {
         setCountdown(null);
         dispatch({ type: 'SET_PHASE', payload: 'draw' });
       }, 3000));
       return () => timers.forEach(clearTimeout);
    }
    return undefined;
  }, [gameState.phase, dispatch]);

  if (gameState.players.length === 0) {
    return <div className="p-8">No game active. <button onClick={() => setLocation('/')} className="text-primary underline">Go Home</button></div>;
  }

  const me = gameState.players.find(p => p.isHuman) || gameState.players[0];
  const enemies = gameState.players.filter(p => p.id !== me.id);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer.id === me.id;
  const isDefeated = gameState.phase === 'gameover' && gameState.winner !== me.id;

  // ── Interaction handlers ──────────────────────────────────────────────────
  const handleCardClick = (card: CardInstance) => {
    if (!isMyTurn || gameState.phase !== 'main') return;
    if (me.aether >= card.cost) {
      if (card.type === 'spell' && card.effect?.includes('target')) {
         dispatch({ type: 'SET_TARGETING', payload: { mode: 'spell', sourceId: card.instanceId, pendingAction: null } });
      } else if (card.type === 'enchantment') {
         dispatch({ type: 'SET_TARGETING', payload: { mode: 'enchantment', sourceId: card.instanceId, pendingAction: null } });
      } else {
         playCard(card.instanceId);
      }
    }
  };

  const handleFieldClick = (player: Player, fieldCard: FieldCard) => {
    if (!isMyTurn) return;

    if (gameState.targetingMode === 'spell' || gameState.targetingMode === 'item') {
       if (gameState.targetingMode === 'item') {
          dispatch({ type: 'USE_INVENTORY', payload: { playerId: me.id, instanceId: gameState.sourceId!, targetId: fieldCard.instanceId } });
       } else {
          playCard(gameState.sourceId!, fieldCard.instanceId);
       }
       dispatch({ type: 'CLEAR_TARGETING' });
       return;
    }
    
    if (gameState.targetingMode === 'enchantment' && player.id === me.id) {
       playCard(gameState.sourceId!, fieldCard.instanceId);
       dispatch({ type: 'CLEAR_TARGETING' });
       return;
    }

    if (gameState.targetingMode === 'attack') {
       if (player.id !== me.id) {
          attackWith(gameState.sourceId!, player.id, fieldCard.instanceId);
          dispatch({ type: 'CLEAR_TARGETING' });
       }
       return;
    }

    if (gameState.phase === 'combat' && player.id === me.id && !fieldCard.tapped) {
       dispatch({ type: 'SET_TARGETING', payload: { mode: 'attack', sourceId: fieldCard.instanceId, pendingAction: null } });
    }
  };

  const handleHeroClick = (player: Player) => {
    if (!isMyTurn) return;
    if (gameState.targetingMode === 'spell') {
       playCard(gameState.sourceId!, player.id.toString());
       dispatch({ type: 'CLEAR_TARGETING' });
       return;
    }
    if (gameState.targetingMode === 'attack' && player.id !== me.id) {
       attackWith(gameState.sourceId!, player.id);
       dispatch({ type: 'CLEAR_TARGETING' });
       return;
    }
  };

  const handleInventoryClick = (item: { instanceId: string; effectKey?: string; type?: string }) => {
    if (!isMyTurn || gameState.phase !== 'main') return;
    if (item.effectKey === 'ironheart') return; // passive
    useInventoryItem(item.instanceId);
  };

  const renderAetherCrystals = (current: number, max: number) => {
    const crystals = [];
    for (let i = 0; i < max; i++) {
      crystals.push(
        <div
          key={i}
          className={`w-2.5 h-2.5 transform rotate-45 border ${i < current ? 'bg-primary border-white shadow-[0_0_4px_rgba(30,144,255,0.8)]' : 'bg-transparent border-primary/30'}`}
        />
      );
    }
    return <div className="flex flex-wrap gap-1 justify-center max-w-[80px]">{crystals}</div>;
  };

  // ── Shop item helpers ─────────────────────────────────────────────────────
  const isOwnedItem = (item: ShopItemTemplate): boolean => {
    if (item.stackable) return false;
    if (item.type === 'card') return false;
    const alreadyInInv = me.inventory.some(i => i.itemId === item.id);
    const alreadyPerk = item.effectKey ? me.perks.includes(item.effectKey) : false;
    const alreadyStat = item.effectKey ? me.statBuffs.includes(item.effectKey) : false;
    return alreadyInInv || alreadyPerk || alreadyStat;
  };

  const visibleShopItems = SHOP_ITEMS.filter(i => {
    const matchesTab = i.type === TAB_TYPE_MAP[shopTab];
    const inRotation = shopRotationIds.includes(i.id);
    return matchesTab && inRotation;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[100dvh] w-full bg-kodi-gradient text-foreground flex flex-col overflow-hidden relative font-sans select-none">

      {/* ── Animated Battlefield ──────────────────────────────────────────── */}
      {animatedBattlefield && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,144,255,0.08)_0%,transparent_70%)] animate-[slow-rotate_30s_linear_infinite]" />
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#1e90ff]"
              style={{
                left: p.left,
                top: '100%',
                animation: `float ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Top HUD ───────────────────────────────────────────────────────── */}
      <div className="h-12 bg-[#0a0e14]/95 border-b-2 border-amber-900/40 flex items-center justify-between px-4 z-20 shadow-[0_2px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        {/* Phase indicators */}
        <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-sm border border-amber-900/20">
          {['draw', 'buy', 'main', 'combat', 'end'].map(p => (
            <div
              key={p}
              className={`px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wider border border-transparent transition-all
                ${gameState.phase === p ? 'bg-primary text-white border-primary/50 shadow-[0_0_8px_rgba(30,144,255,0.4)]' : 'text-muted-foreground/60'}
              `}
            >
              {p}
            </div>
          ))}
        </div>

        {/* Turn + timer */}
        <div className="flex flex-col items-center">
          <span className="font-display text-lg font-bold tracking-widest text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
            TURN {gameState.turn}
          </span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
            {isMyTurn ? (
              <span className="text-primary">
                YOUR TURN
                {gameState.phase === 'buy' && buyPhaseTimeLeft !== null && (
                  <span className={`ml-1 font-mono ${buyPhaseTimeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                    [{buyPhaseTimeLeft}s]
                  </span>
                )}
              </span>
            ) : `${currentPlayer.name}'s Turn`}
          </span>
        </div>

        {/* Player stats + buttons */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="font-bold text-xs text-foreground">{me.name}</span>
            <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_#f5c518]" />
              {me.gold.toLocaleString()}g
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_INVENTORY', payload: !gameState.inventoryOpen })}
            className={`p-1.5 border transition-colors ${gameState.inventoryOpen ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border hover:border-primary text-muted-foreground hover:text-primary'}`}
          >
            <Package size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Board ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden min-h-0">

        {/* Fantasy divider line */}
        <div className="absolute inset-x-0 top-1/2 h-px z-0 bg-gradient-to-r from-transparent via-amber-800/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 flex justify-center z-0 pointer-events-none -translate-y-1/2">
          <div className="text-amber-700/30 font-display text-xs tracking-[0.5em] uppercase select-none">⬥ vs ⬥</div>
        </div>

        {/* Enemy Zone */}
        <div className="flex-1 flex flex-col bg-[#130808]/40 border-b border-red-900/20 overflow-y-auto min-h-0">
          {enemies.map((enemy) => {
            const isHeroHit = combatAnim?.targetId === enemy.id.toString();
            return (
              <div key={enemy.id} className="flex-1 flex min-h-[140px] relative p-1">
                {/* Enemy portrait */}
                <div
                  onClick={() => handleHeroClick(enemy)}
                  className={`w-36 p-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer relative z-10 transition-all
                    ${gameState.targetingMode === 'attack' || gameState.targetingMode === 'spell' ? 'hover:scale-105 drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]' : ''}
                  `}
                >
                  <div
                    className={`relative w-16 h-16 bg-black flex items-center justify-center border-2 transition-colors
                      ${isHeroHit ? 'border-red-500 animate-[flash-red_0.3s_ease]' : 'border-red-900/50'}
                    `}
                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                  >
                    <div className="absolute inset-0 bg-red-900/20" />
                    <Activity size={28} className="text-red-500/80 relative z-10" />
                  </div>
                  <div className="text-xs font-display font-bold text-center text-red-200 truncate w-full text-center">{enemy.name}</div>
                  <div className="w-full bg-[#0a0a0a] h-4 border border-[#333] relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-b from-red-500 to-red-800 transition-all duration-300"
                      style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20" />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white z-10">{enemy.hp}/{enemy.maxHp}</span>
                  </div>
                  <AnimatePresence>
                    {isHeroHit && (
                      <motion.div
                        initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}
                        className="absolute top-0 text-3xl font-display font-bold text-red-500 drop-shadow-[0_0_6px_black] z-50 pointer-events-none"
                      >
                        -{combatAnim!.damage}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Enemy field */}
                <div className={`flex-1 p-2 flex items-center gap-2 overflow-x-auto`}>
                  {enemy.field.map(card => (
                    <FieldCardUI
                      key={card.instanceId}
                      card={card}
                      tapped={card.tapped}
                      playable={gameState.targetingMode !== 'none'}
                      onClick={() => handleFieldClick(enemy, card)}
                      combatAnim={combatAnim}
                    />
                  ))}
                  {enemy.field.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                      <span className="font-display text-3xl font-bold tracking-widest text-red-500">ENEMY FIELD</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Player Zone */}
        <div className={`flex-1 flex bg-[#05090f]/80 relative p-1 min-h-0
          ${isMyTurn && gameState.phase === 'main' ? 'shadow-[inset_0_0_30px_rgba(30,144,255,0.07)]' : ''}
        `}>
          {/* Fantasy corner ornaments */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-amber-700/40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-amber-700/40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-amber-700/40 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-amber-700/40 pointer-events-none" />

          {/* Targeting overlay */}
          {gameState.targetingMode !== 'none' && (
            <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center pointer-events-none backdrop-blur-sm">
              <div className="bg-card border-2 border-primary px-6 py-3 text-primary font-display text-xl font-bold tracking-widest uppercase animate-pulse shadow-[0_0_20px_rgba(30,144,255,0.5)]">
                Select Target for {gameState.targetingMode}
              </div>
            </div>
          )}

          {/* Player portrait */}
          <div
            onClick={() => handleHeroClick(me)}
            className={`w-36 p-2 flex flex-col items-center justify-center gap-1.5 relative z-10 transition-all
              ${gameState.targetingMode === 'spell' ? 'hover:scale-105 drop-shadow-[0_0_12px_rgba(30,144,255,0.5)] cursor-pointer' : ''}
            `}
          >
            <div
              className={`relative w-16 h-16 bg-black flex items-center justify-center border-2 transition-colors
                ${combatAnim?.targetId === me.id.toString() ? 'border-red-500 animate-[flash-red_0.3s_ease]' : 'border-primary/70'}
              `}
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            >
              <div className="absolute inset-0 bg-primary/10" />
              <User size={28} className="text-primary relative z-10" />
            </div>
            <div className="text-xs font-display font-bold text-center text-primary drop-shadow-md truncate w-full text-center">{me.name}</div>
            <div className="w-full bg-[#0a0a0a] h-4 border border-[#333] relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-b from-green-500 to-green-800 transition-all duration-300"
                style={{ width: `${(me.hp / me.maxHp) * 100}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-white/20" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white z-10">{me.hp}/{me.maxHp}</span>
            </div>
            <div className="w-full">
              <div className="text-[8px] font-bold text-primary mb-0.5 uppercase tracking-widest text-center">Aether</div>
              {renderAetherCrystals(me.aether, me.maxAether)}
            </div>
            <AnimatePresence>
              {combatAnim?.targetId === me.id.toString() && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}
                  className="absolute top-0 text-3xl font-display font-bold text-red-500 drop-shadow-[0_0_6px_black] z-50 pointer-events-none"
                >
                  -{combatAnim.damage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player field */}
          <div className="flex-1 p-2 flex items-center gap-2 overflow-x-auto relative z-10">
            {me.field.map(card => {
              const canAttack = isMyTurn && gameState.phase === 'combat' && !card.tapped && !card.hasAttackedThisTurn;
              return (
                <FieldCardUI
                  key={card.instanceId}
                  card={card}
                  tapped={card.tapped}
                  playable={canAttack || gameState.targetingMode !== 'none'}
                  onClick={() => handleFieldClick(me, card)}
                  combatAnim={combatAnim}
                />
              );
            })}
            {me.field.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <span className="font-display text-3xl font-bold tracking-widest text-primary">YOUR FIELD</span>
              </div>
            )}
          </div>
        </div>

        {/* Announcement Banner */}
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-x-0 top-1/3 z-50 flex justify-center pointer-events-none"
            >
              <div className="bg-black/80 border-y-4 border-amber-700/60 px-10 py-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
                <h2 className="text-4xl font-display font-bold text-amber-300 tracking-widest drop-shadow-[0_0_8px_rgba(245,197,24,0.6)]">
                  {announcement}
                </h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action + Hand Bar ─────────────────────────────────────────────── */}
      <div className="h-56 bg-[#070b10]/95 border-t-2 border-amber-900/30 flex flex-col z-30 relative shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">

        {/* Action buttons */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {gameState.targetingMode !== 'none' && (
            <button
              onClick={() => dispatch({ type: 'CLEAR_TARGETING' })}
              className="px-4 py-1.5 bg-destructive border border-red-400 text-white font-bold tracking-widest text-xs shadow-lg hover:bg-red-700 transition-colors"
            >
              CANCEL TARGET
            </button>
          )}
          {isMyTurn && gameState.phase === 'buy' && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SHOP', payload: !gameState.shopOpen })}
              className="px-4 py-1.5 bg-[#1a2333] border border-amber-700/60 text-amber-400 font-bold tracking-widest text-xs shadow-lg hover:bg-amber-900/20 transition-colors flex items-center gap-1.5"
            >
              <ShoppingCart size={13} /> SHOP
              {buyPhaseTimeLeft !== null && (
                <span className={`font-mono text-xs ml-1 ${buyPhaseTimeLeft <= 10 ? 'text-red-400' : 'text-amber-400'}`}>
                  {buyPhaseTimeLeft}s
                </span>
              )}
            </button>
          )}
          {isMyTurn && ['buy', 'main', 'combat'].includes(gameState.phase) && (
            <button
              onClick={endPhase}
              className="px-6 py-2 bg-primary border border-white/30 text-white font-display text-sm font-bold tracking-widest shadow-[0_0_12px_rgba(30,144,255,0.4)] hover:shadow-[0_0_20px_rgba(30,144,255,0.7)] transition-all"
            >
              END {gameState.phase.toUpperCase()} →
            </button>
          )}
        </div>

        {/* Hand */}
        <div className="w-full flex-1 overflow-x-auto overflow-y-visible mt-2">
          <div className="flex justify-center items-end min-w-max h-full px-8 pb-2 pt-10 gap-1.5">
            {me.hand.map((card, index) => {
              const offset = index - (me.hand.length - 1) / 2;
              const rotation = me.hand.length > 5 ? offset * 3 : 0;
              const translateY = me.hand.length > 5 ? Math.abs(offset) * 3 : 0;
              return (
                <div
                  key={card.instanceId}
                  style={{ transform: `rotate(${rotation}deg) translateY(${translateY}px)` }}
                  className="transition-transform duration-300"
                >
                  <HandCardUI
                    card={card}
                    playable={isMyTurn && gameState.phase === 'main' && me.aether >= card.cost}
                    onClick={() => handleCardClick(card)}
                  />
                </div>
              );
            })}
            {me.hand.length === 0 && (
              <div className="w-full flex justify-center text-muted-foreground/20 font-display text-xl tracking-widest mb-8">
                HAND EMPTY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Game Log ──────────────────────────────────────────────────────── */}
      <div className={`absolute bottom-56 right-3 z-40 flex flex-col items-end transition-transform duration-300 ${logOpen ? 'translate-x-0' : 'translate-x-[calc(100%-36px)]'}`}>
        <div className="flex items-start">
          <button
            onClick={() => { sounds.play('uiClick'); setLogOpen(!logOpen); }}
            className="w-9 h-9 bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white"
          >
            <ScrollText size={16} />
          </button>
          <div className="w-56 bg-black/85 border border-border p-2 backdrop-blur-sm max-h-52 overflow-y-auto flex flex-col gap-1.5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1 mb-0.5">Game Log</h4>
            {gameState.log.map(entry => (
              <div key={entry.id} className="text-[10px] flex gap-1.5 items-start leading-tight">
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0
                  ${entry.type === 'damage' ? 'bg-red-500' : ''}
                  ${entry.type === 'card' ? 'bg-primary' : ''}
                  ${entry.type === 'gold' ? 'bg-amber-400' : ''}
                  ${entry.type === 'other' ? 'bg-gray-500' : ''}
                `} />
                <span className="text-gray-300">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Achievement Toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: 40 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 40, x: 40 }}
            className="absolute bottom-60 left-3 z-50 bg-card border-2 border-amber-400/60 p-3 flex items-center gap-3 shadow-[0_0_16px_rgba(245,197,24,0.3)]"
          >
            <div className="w-8 h-8 bg-amber-900/30 flex items-center justify-center text-amber-400 border border-amber-400/50">
              <Info size={18} />
            </div>
            <div>
              <div className="text-amber-400 font-bold text-[10px] uppercase tracking-widest">Achievement Unlocked</div>
              <div className="text-white font-display text-sm font-bold">{achievementToast.split(': ')[1]}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shop Panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.shopOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="absolute top-12 right-0 bottom-56 w-72 bg-[#0d1117]/97 border-l-2 border-amber-800/40 flex flex-col shadow-2xl z-40"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-amber-800/30 bg-[#090c12]">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-amber-400" />
                <h3 className="font-display text-base font-bold text-amber-300">THE SHOP</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Rotation timer */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <RefreshCw size={10} />
                  <span className={shopRotationTimeLeft <= 30 ? 'text-amber-400 animate-pulse' : ''}>
                    {formatTime(shopRotationTimeLeft)}
                  </span>
                </div>
                <button onClick={() => dispatch({ type: 'TOGGLE_SHOP', payload: false })} className="text-muted-foreground hover:text-white text-sm">✕</button>
              </div>
            </div>

            {/* Buy phase timer bar */}
            {buyPhaseTimeLeft !== null && (
              <div className="h-1 bg-border/30 relative">
                <div
                  className={`h-full transition-all duration-1000 ${buyPhaseTimeLeft <= 10 ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${(buyPhaseTimeLeft / 30) * 100}%` }}
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-amber-800/20 bg-[#090c12]">
              {(['items', 'stat', 'perks', 'cards'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { sounds.play('uiClick'); setShopTab(tab); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2
                    ${shopTab === tab ? 'bg-amber-900/20 text-amber-300 border-amber-600' : 'text-muted-foreground border-transparent hover:bg-secondary/50'}
                  `}
                >
                  {tab === 'stat' ? 'Stats' : tab}
                </button>
              ))}
            </div>

            {/* Rotation notice */}
            <div className="px-3 py-1 bg-amber-900/10 border-b border-amber-800/20 flex items-center gap-1 text-[10px] text-amber-500/80">
              <RefreshCw size={9} />
              <span>Shop rotates in {formatTime(shopRotationTimeLeft)}</span>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              {visibleShopItems.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-8 opacity-50">
                  No items this rotation.<br />Next rotation in {formatTime(shopRotationTimeLeft)}.
                </div>
              )}
              {visibleShopItems.map(item => {
                const canAfford = me.gold >= item.cost;
                const owned = isOwnedItem(item);
                const disabled = !canAfford || owned || gameState.phase !== 'buy';
                return (
                  <div
                    key={item.id}
                    className={`border p-2 flex flex-col gap-1.5 relative group transition-colors
                      ${owned ? 'border-amber-700/30 bg-amber-900/10 opacity-70' : canAfford ? 'border-border bg-background/60 hover:border-amber-700/50' : 'border-border/20 bg-background/30 opacity-50'}
                    `}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs text-foreground leading-tight">{item.name}</span>
                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        <span className="flex items-center gap-0.5 text-amber-400 text-xs font-bold bg-amber-900/30 px-1.5 py-0.5 border border-amber-800/40">
                          {item.cost.toLocaleString()}g
                        </span>
                        {item.stackable && (
                          <span className="text-[8px] text-emerald-400 font-bold">STACKABLE</span>
                        )}
                        {owned && (
                          <span className="text-[8px] text-amber-500 font-bold">OWNED</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
                    <button
                      disabled={disabled}
                      onClick={() => buyItem(item.id)}
                      className={`py-1 text-[10px] font-bold border transition-colors
                        ${owned ? 'bg-amber-900/20 text-amber-600 border-amber-800/30 cursor-not-allowed' :
                          !disabled ? 'bg-secondary hover:bg-amber-900/30 text-white border-border hover:border-amber-700 cursor-pointer' :
                          'bg-background text-muted-foreground border-border cursor-not-allowed'}
                      `}
                    >
                      {owned ? 'ALREADY OWNED' : gameState.phase !== 'buy' ? 'BUY PHASE ONLY' : !canAfford ? 'NOT ENOUGH GOLD' : 'PURCHASE'}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inventory Panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.inventoryOpen && (
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="absolute top-12 left-0 bottom-56 w-64 bg-[#0d1117]/97 border-r-2 border-amber-800/40 flex flex-col shadow-2xl z-40"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-amber-800/30 bg-[#090c12] shrink-0">
              <h3 className="font-display text-base font-bold text-amber-300 flex items-center gap-2">
                <Package size={16} className="text-amber-400" /> INVENTORY
              </h3>
              <button onClick={() => dispatch({ type: 'TOGGLE_INVENTORY', payload: false })} className="text-muted-foreground hover:text-white text-sm">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-2">
                {[...Array(8)].map((_, i) => {
                  const item = me.inventory[i];
                  const isPassive = item?.effectKey === 'ironheart';
                  const isClickable = item && isMyTurn && gameState.phase === 'main' && !isPassive;
                  return (
                    <div
                      key={i}
                      onClick={() => item && handleInventoryClick(item)}
                      className={`h-20 border flex flex-col items-center justify-center p-1.5 text-center transition-colors
                        ${!item ? 'border-border/20 bg-black/20' :
                          isPassive ? 'border-amber-700/40 bg-amber-900/10 cursor-default' :
                          isClickable ? 'border-primary/60 bg-secondary/30 hover:border-primary hover:bg-secondary/50 cursor-pointer' :
                          'border-border/40 bg-secondary/20 cursor-default opacity-60'}
                      `}
                    >
                      {item ? (
                        <>
                          <Package size={18} className={isPassive ? 'text-amber-400 mb-1' : 'text-primary mb-1'} />
                          <span className="text-[9px] font-bold leading-tight text-center">{item.name}</span>
                          {isPassive && <span className="text-[8px] text-amber-500 mt-0.5">PASSIVE</span>}
                          {!isPassive && isMyTurn && gameState.phase === 'main' && (
                            <span className="text-[8px] text-primary mt-0.5">CLICK TO USE</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground/25 text-[10px] font-bold">EMPTY</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-amber-800/20 bg-[#090c12] shrink-0">
              Click an item during your <span className="text-primary font-bold">Main Phase</span> to use it.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Countdown Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[10rem] font-display font-bold text-amber-400 drop-shadow-[0_0_40px_rgba(245,197,24,0.6)]"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Game Over Overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.phase === 'gameover' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/97 z-50 flex items-center justify-center backdrop-blur-md"
          >
            <div className="text-center flex flex-col items-center gap-4 p-10 border-2 bg-[#0a0e14] max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.9)]"
              style={{ borderColor: isDefeated ? 'rgba(220,38,38,0.5)' : 'rgba(245,197,24,0.5)' }}
            >
              {/* Title */}
              <h2 className={`text-6xl font-display font-bold drop-shadow-[0_0_16px_currentColor]
                ${isDefeated ? 'text-red-500' : 'text-amber-400'}
              `}>
                {isDefeated ? 'DEFEATED' : 'VICTORY!'}
              </h2>

              {/* Fantasy flavour text */}
              <p className="text-muted-foreground text-sm italic">
                {isDefeated
                  ? '"Even the mightiest arcane warriors fall in battle."'
                  : '"The realm bows to your arcane mastery!"'}
              </p>

              {/* Stats */}
              <div className="w-full flex flex-col gap-2 text-left bg-black/50 p-4 border border-white/5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turns Survived</span>
                  <span className="font-bold text-white">{gameState.turn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gold Earned</span>
                  <span className="font-bold text-amber-400">{(me.goldEarnedThisGame || 0).toLocaleString()}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creatures Destroyed</span>
                  <span className="font-bold text-red-400">{me.creaturesKilledThisGame || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cards Played</span>
                  <span className="font-bold text-primary">{me.cardsPlayedThisGame || 0}</span>
                </div>
              </div>

              {/* Buttons — defeat: quit only · victory: play again + quit */}
              <div className="flex gap-3 w-full mt-2">
                {!isDefeated && (
                  <button
                    onClick={() => setLocation('/lobby')}
                    className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold tracking-widest border border-amber-500/50 hover:border-amber-300 transition-colors text-sm"
                  >
                    PLAY AGAIN
                  </button>
                )}
                <button
                  onClick={() => setLocation('/')}
                  className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold tracking-widest border border-border text-sm transition-colors"
                >
                  MAIN MENU
                </button>
              </div>

              {/* Defeat extra note */}
              {isDefeated && (
                <p className="text-muted-foreground/60 text-[11px]">Return to main menu to start a new game.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
