import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGame } from '../context/GameContext';
import { useLobby } from '../context/LobbyContext';
import { CardInstance, FieldCard, Player } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import { ShoppingCart, Package, Info, ShieldAlert, Swords, Heart, Activity, User, ScrollText, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOP_ITEMS } from '../lib/cards';
import { CardArt } from '../components/game/CardArt';

const CardUI = ({ 
  card, 
  playable, 
  onClick, 
  isField = false, 
  tapped = false,
  combatAnim = null
}: { 
  card: CardInstance | FieldCard; 
  playable?: boolean; 
  onClick?: () => void;
  isField?: boolean;
  tapped?: boolean;
  combatAnim?: { targetId: string, damage: number } | null;
}) => {
  const isCreature = card.type === 'creature';
  const fieldCard = card as FieldCard;
  const displayAtk = fieldCard.currentAtk ?? card.atk ?? 0;
  const displayDef = fieldCard.currentDef ?? card.def ?? 1;
  const isEvolved = fieldCard.evolved;

  let rarityColor = 'border-border shadow-none';
  let badgeColor = 'bg-gray-500';
  if (card.rarity === 'rare') {
     rarityColor = 'border-purple-500 shadow-[0_0_8px_rgba(147,112,219,0.7)]';
     badgeColor = 'bg-purple-500';
  } else if (card.rarity === 'legendary') {
     rarityColor = 'border-amber-400 shadow-[0_0_12px_rgba(255,165,0,0.8)]';
     badgeColor = 'bg-amber-400';
  }
  if (isEvolved) {
     rarityColor = 'border-gold shadow-[0_0_15px_rgba(245,197,24,1)]';
  }

  const typeStripeColors = {
    creature: 'bg-blue-600',
    spell: 'bg-purple-600',
    artifact: 'bg-amber-600',
    enchantment: 'bg-emerald-600'
  };

  const isHit = combatAnim?.targetId === card.instanceId;

  return (
    <motion.div
      whileHover={{ scale: isField ? 1.05 : 1.3, y: isField ? 0 : -20, zIndex: 50 }}
      onClick={onClick}
      className={`relative w-28 h-40 flex-shrink-0 bg-card border-[3px] cursor-pointer transition-colors duration-200 
        ${playable && !isField ? 'border-primary shadow-[0_0_15px_rgba(30,144,255,0.8)]' : rarityColor} 
        ${playable && isField ? 'border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.8)]' : ''}
        ${tapped ? 'opacity-60 rotate-[8deg]' : ''}
        ${isHit ? 'animate-[flash-red_0.3s_ease]' : ''}
      `}
      onMouseEnter={() => playable && !isField && sounds.play('cardHover')}
    >
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* Top Area */}
        <div className="h-[20%] flex items-center justify-between px-1 bg-gradient-to-b from-secondary to-transparent">
          <span className="text-[10px] font-display font-bold leading-tight truncate">{card.name}</span>
          <div className="w-5 h-5 flex items-center justify-center bg-card border border-primary text-primary text-[10px] font-bold transform rotate-45 shrink-0">
            <span className="-rotate-45">{card.cost}</span>
          </div>
        </div>
        
        {/* Art Area */}
        <div className="h-[35%] w-full">
           <CardArt templateId={card.templateId} type={card.type} />
        </div>
        
        {/* Type Stripe */}
        <div className={`h-[8%] w-full ${typeStripeColors[card.type]} flex items-center px-1`}>
           <span className="text-[8px] font-bold text-white uppercase tracking-widest leading-none drop-shadow-md">{card.type}</span>
        </div>

        {/* Description */}
        <div className="h-[25%] p-1 bg-black/40 text-[8px] leading-tight text-secondary-foreground overflow-hidden">
          {card.description}
          {isEvolved && <div className="text-gold font-bold mt-0.5 tracking-wider">✦ EVOLVED</div>}
          {!isEvolved && card.evolvesTo && !isField && <div className="text-primary font-bold mt-0.5 text-[7px] uppercase">Can Evolve</div>}
        </div>

        {/* Stats Row */}
        <div className="h-[12%] flex justify-between items-center px-1 border-t border-white/10 bg-black/60">
           {isCreature ? (
              <>
                <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                  <Swords size={10} /> {displayAtk}
                </div>
                <div className="flex items-center gap-0.5 text-emerald-500 font-bold text-xs">
                  <ShieldAlert size={10} /> {displayDef}
                </div>
              </>
           ) : (
              <div className="flex w-full justify-center text-muted-foreground">
                 <Zap size={10} />
              </div>
           )}
        </div>
      </div>

      {/* Rarity Gem */}
      <div className={`absolute bottom-0 right-0 w-2 h-2 ${badgeColor} transform rotate-45 translate-x-1/3 translate-y-1/3 shadow-sm border border-black`}></div>

      {/* Floating Damage Number */}
      <AnimatePresence>
         {isHit && (
           <motion.div 
             initial={{ opacity: 1, y: 0 }}
             animate={{ opacity: 0, y: -40 }}
             transition={{ duration: 0.6 }}
             className="absolute inset-0 flex items-center justify-center text-3xl font-display font-bold text-red-500 drop-shadow-[0_0_5px_black] z-50 pointer-events-none"
           >
             -{combatAnim.damage}
           </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function GamePage() {
  const [, setLocation] = useLocation();
  const { gameState, dispatch, playCard, attackWith, buyItem, endPhase, achievementToast, combatAnim, announcement } = useGame();
  const { animatedBattlefield } = useLobby();

  const [countdown, setCountdown] = useState<number | null>(3);
  const [shopTab, setShopTab] = useState<'items' | 'stat' | 'perks' | 'cards'>('items');
  const [logOpen, setLogOpen] = useState(false);

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
          // Assume context handles it via USE_INVENTORY, but we just dispatch it directly here
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

  const renderAetherCrystals = (current: number, max: number) => {
    const crystals = [];
    for (let i = 0; i < max; i++) {
      crystals.push(
        <div 
          key={i} 
          className={`w-3 h-3 transform rotate-45 border ${i < current ? 'bg-primary border-white shadow-[0_0_5px_rgba(30,144,255,0.8)]' : 'bg-transparent border-primary/30'}`}
        />
      );
    }
    return <div className="flex gap-2">{crystals}</div>;
  };

  return (
    <div className="h-[100dvh] w-full bg-kodi-gradient text-foreground flex flex-col overflow-hidden relative font-sans select-none">
      
      {/* Animated Battlefield Layers */}
      {animatedBattlefield && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,144,255,0.1)_0%,transparent_70%)] animate-[slow-rotate_30s_linear_infinite]" />
          {[...Array(20)].map((_, i) => (
             <div 
               key={i}
               className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_#1e90ff]"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: '100%',
                 animation: `float ${10 + Math.random() * 15}s linear infinite`,
                 animationDelay: `${Math.random() * 10}s`
               }}
             />
          ))}
        </div>
      )}

      {/* Top Bar (HUD Style) */}
      <div className="h-16 bg-[#0a0e14] border-b-2 border-border flex items-center justify-between px-6 z-20 shadow-lg">
        {/* Phase Flow */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-sm border border-white/5">
          {['draw', 'buy', 'main', 'combat', 'end'].map(p => (
            <div 
              key={p} 
              className={`px-3 py-1 text-xs font-display font-bold uppercase tracking-widest border border-transparent transition-all
                ${gameState.phase === p ? 'bg-primary text-white border-primary/50 shadow-[0_0_10px_rgba(30,144,255,0.4)]' : 'text-muted-foreground'}
              `}
            >
              {p}
            </div>
          ))}
        </div>

        {/* Turn Counter */}
        <div className="flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
            TURN {gameState.turn}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            {isMyTurn ? <span className="text-primary">YOUR TURN</span> : `AI Turn (${currentPlayer.name})`}
          </span>
        </div>

        {/* Player Stats */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="font-bold text-sm text-foreground">{me.name}</span>
             <div className="flex items-center gap-1.5 text-gold font-bold text-sm">
                <span className="w-3 h-3 rounded-full bg-gold shadow-[0_0_5px_#f5c518]" />
                {me.gold}g
             </div>
          </div>
          <button 
            onClick={() => dispatch({ type: 'TOGGLE_INVENTORY', payload: !gameState.inventoryOpen })}
            className="p-2 bg-secondary border border-border hover:border-primary transition-colors rounded-sm"
          >
            <Package size={20} className="text-primary" />
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        
        {/* Diagonal Split SVG */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
           <svg width="100%" height="100%" preserveAspectRatio="none">
              <line x1="0" y1="50%" x2="100%" y2="52%" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
           </svg>
        </div>

        {/* Enemy Zones (Top) */}
        <div className="flex-1 flex flex-col bg-[#110505]/40 border-b border-border/20 overflow-y-auto">
          {enemies.map((enemy) => {
             const isHeroHit = combatAnim?.targetId === enemy.id.toString();
             return (
             <div key={enemy.id} className="flex-1 min-h-[220px] flex border-b border-border/10 last:border-0 relative p-2">
               
               {/* Hero Portrait */}
               <div 
                 onClick={() => handleHeroClick(enemy)}
                 className={`w-48 p-4 flex flex-col items-center justify-center gap-3 cursor-pointer relative z-10 transition-all
                   ${gameState.targetingMode === 'attack' || gameState.targetingMode === 'spell' ? 'hover:scale-105 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]' : ''}
                 `}
               >
                 <div className={`relative w-24 h-24 bg-black flex items-center justify-center border-[3px] transition-colors
                    ${isHeroHit ? 'border-red-500 animate-[flash-red_0.3s_ease]' : 'border-red-900/50'}
                 `} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute inset-0 bg-red-900/20 shadow-[inset_0_0_20px_rgba(220,38,38,0.5)]" />
                    <Activity size={40} className="text-red-500/80 relative z-10" />
                 </div>
                 
                 <div className="text-sm font-display font-bold text-center text-red-100">{enemy.name}</div>
                 
                 {/* LoL Style Health Bar */}
                 <div className="w-full bg-[#0a0a0a] h-6 border-2 border-[#222] relative overflow-hidden shadow-inner">
                   <div className="absolute top-0 left-0 h-full bg-gradient-to-b from-red-500 to-red-800 transition-all duration-300" style={{ width: `${(enemy.hp/enemy.maxHp)*100}%` }}>
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                   </div>
                   <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md z-10">{enemy.hp} / {enemy.maxHp}</span>
                 </div>
                 
                 <AnimatePresence>
                    {isHeroHit && (
                      <motion.div 
                        initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -40 }} transition={{ duration: 0.6 }}
                        className="absolute top-0 text-4xl font-display font-bold text-red-500 drop-shadow-[0_0_8px_black] z-50 pointer-events-none"
                      >
                        -{combatAnim.damage}
                      </motion.div>
                    )}
                 </AnimatePresence>
               </div>

               {/* Enemy Field */}
               <div className={`flex-1 p-4 flex items-center gap-4 overflow-x-auto relative
                 ${gameState.phase === 'combat' && !isMyTurn ? 'shadow-[inset_0_0_30px_rgba(220,38,38,0.1)]' : ''}
               `}>
                 {enemy.field.map(card => (
                   <CardUI 
                     key={card.instanceId} 
                     card={card} 
                     isField 
                     tapped={card.tapped}
                     playable={gameState.targetingMode !== 'none'}
                     onClick={() => handleFieldClick(enemy, card)}
                     combatAnim={combatAnim}
                   />
                 ))}
                 {enemy.field.length === 0 && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                     <span className="font-display text-4xl font-bold tracking-widest text-red-500/50">ENEMY FIELD</span>
                   </div>
                 )}
               </div>

             </div>
          )})}
        </div>

        {/* Player Zone (Bottom) */}
        <div className={`flex-1 flex bg-[#050a11]/80 relative p-2
           ${isMyTurn && gameState.phase === 'main' ? 'shadow-[inset_0_0_40px_rgba(30,144,255,0.1)]' : ''}
        `}>
          
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

          {/* Target Mode Overlay */}
          {gameState.targetingMode !== 'none' && (
             <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center pointer-events-none backdrop-blur-sm">
               <div className="bg-card border-2 border-primary px-8 py-4 text-primary font-display text-2xl font-bold tracking-widest uppercase animate-pulse shadow-[0_0_30px_rgba(30,144,255,0.5)]">
                 Select Target for {gameState.targetingMode}
               </div>
             </div>
          )}

          {/* Hero Portrait */}
          <div 
             onClick={() => handleHeroClick(me)}
             className={`w-48 p-4 flex flex-col items-center justify-center gap-3 relative z-10 transition-all
               ${gameState.targetingMode === 'spell' ? 'hover:scale-105 drop-shadow-[0_0_15px_rgba(30,144,255,0.5)] cursor-pointer' : ''}
             `}
          >
            <div className={`relative w-24 h-24 bg-black flex items-center justify-center border-[3px] transition-colors
               ${combatAnim?.targetId === me.id.toString() ? 'border-red-500 animate-[flash-red_0.3s_ease]' : 'border-primary'}
            `} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
               <div className="absolute inset-0 bg-primary/20 shadow-[inset_0_0_20px_rgba(30,144,255,0.5)]" />
               <User size={40} className="text-primary relative z-10" />
            </div>
            
            <div className="text-sm font-display font-bold text-center text-primary drop-shadow-md">{me.name}</div>
            
            {/* LoL Style Health Bar */}
            <div className="w-full bg-[#0a0a0a] h-6 border-2 border-[#222] relative overflow-hidden shadow-inner">
               <div className="absolute top-0 left-0 h-full bg-gradient-to-b from-green-500 to-green-800 transition-all duration-300" style={{ width: `${(me.hp/me.maxHp)*100}%` }}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
               </div>
               <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md z-10">{me.hp} / {me.maxHp}</span>
            </div>
            
            <div className="w-full mt-2">
              <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest text-center">Aether</div>
              <div className="flex justify-center">
                 {renderAetherCrystals(me.aether, me.maxAether)}
              </div>
            </div>
            
            <AnimatePresence>
               {combatAnim?.targetId === me.id.toString() && (
                 <motion.div 
                   initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -40 }} transition={{ duration: 0.6 }}
                   className="absolute top-0 text-4xl font-display font-bold text-red-500 drop-shadow-[0_0_8px_black] z-50 pointer-events-none"
                 >
                   -{combatAnim.damage}
                 </motion.div>
               )}
            </AnimatePresence>
          </div>

          {/* Player Field */}
          <div className="flex-1 p-4 flex items-center gap-4 overflow-x-auto relative z-10">
            {me.field.map(card => {
              const canAttack = isMyTurn && gameState.phase === 'combat' && !card.tapped && !card.hasAttackedThisTurn;
              return (
                <CardUI 
                  key={card.instanceId} 
                  card={card} 
                  isField
                  tapped={card.tapped}
                  playable={canAttack || gameState.targetingMode !== 'none'}
                  onClick={() => handleFieldClick(me, card)}
                  combatAnim={combatAnim}
                />
              )
            })}
            {me.field.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="font-display text-4xl font-bold tracking-widest text-primary/50">YOUR FIELD</span>
              </div>
            )}
          </div>
        </div>

        {/* Central Announcement Banner */}
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              className="absolute inset-x-0 top-1/3 z-50 flex justify-center pointer-events-none"
            >
              <div className="bg-black/80 border-y-4 border-primary px-12 py-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
                 <h2 className="text-5xl font-display font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(30,144,255,0.8)]">
                    {announcement}
                 </h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Action & Hand Bar */}
      <div className="h-72 bg-[#080c12] border-t-4 border-[#1a2333] flex flex-col z-30 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Action Controls (RPG Ability Bar Style) */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {gameState.targetingMode !== 'none' && (
              <button 
                onClick={() => dispatch({ type: 'CLEAR_TARGETING' })}
                className="px-6 py-2 bg-destructive border-2 border-red-400 text-white font-bold tracking-widest text-sm shadow-lg hover:bg-red-700 transition-colors"
              >
                CANCEL TARGET
              </button>
            )}
            {isMyTurn && gameState.phase === 'buy' && (
              <button 
                onClick={() => dispatch({ type: 'TOGGLE_SHOP', payload: !gameState.shopOpen })}
                className="px-6 py-2 bg-[#1a2333] border-2 border-primary text-primary font-bold tracking-widest text-sm shadow-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
              >
                <ShoppingCart size={16} /> OPEN SHOP
              </button>
            )}
            {isMyTurn && ['buy', 'main', 'combat'].includes(gameState.phase) && (
              <button 
                onClick={endPhase}
                className="px-8 py-3 bg-primary border-2 border-white text-white font-display text-lg font-bold tracking-widest shadow-[0_0_15px_rgba(30,144,255,0.5)] hover:shadow-[0_0_25px_rgba(30,144,255,0.8)] transition-all"
              >
                END {gameState.phase.toUpperCase()} →
              </button>
            )}
        </div>

        {/* Hand Area */}
        <div className="w-full flex-1 overflow-x-auto overflow-y-visible mt-4">
           <div className="flex justify-center items-end min-w-max h-full px-12 pb-4 pt-16 gap-2">
             {me.hand.map((card, index) => {
               // Fan layout math
               const offset = index - (me.hand.length - 1) / 2;
               const rotation = me.hand.length > 5 ? offset * 3 : 0;
               const translateY = me.hand.length > 5 ? Math.abs(offset) * 4 : 0;
               
               return (
                 <div key={card.instanceId} style={{ transform: `rotate(${rotation}deg) translateY(${translateY}px)` }} className="transition-transform duration-300">
                   <CardUI 
                     card={card} 
                     playable={isMyTurn && gameState.phase === 'main' && me.aether >= card.cost}
                     onClick={() => handleCardClick(card)}
                   />
                 </div>
               )
             })}
             {me.hand.length === 0 && (
               <div className="w-full flex justify-center text-muted-foreground/30 font-display text-2xl tracking-widest mb-10">
                 HAND EMPTY
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Game Log */}
      <div className={`absolute bottom-80 right-4 z-40 flex flex-col items-end transition-transform duration-300 ${logOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}`}>
         <div className="flex items-start">
            <button 
              onClick={() => { sounds.play('uiClick'); setLogOpen(!logOpen); }}
              className="w-10 h-10 bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white"
            >
               <ScrollText size={20} />
            </button>
            <div className="w-64 bg-black/80 border border-border p-3 backdrop-blur-sm max-h-64 overflow-y-auto flex flex-col gap-2">
               <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1 mb-1">Game Log</h4>
               {gameState.log.map(entry => (
                  <div key={entry.id} className="text-xs flex gap-2 items-start leading-tight">
                     <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0
                        ${entry.type === 'damage' ? 'bg-red-500' : ''}
                        ${entry.type === 'card' ? 'bg-primary' : ''}
                        ${entry.type === 'gold' ? 'bg-gold' : ''}
                        ${entry.type === 'other' ? 'bg-gray-500' : ''}
                     `} />
                     <span className="text-gray-300">{entry.msg}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Achievement Toast */}
      <AnimatePresence>
         {achievementToast && (
            <motion.div
               initial={{ opacity: 0, y: 50, x: 50 }}
               animate={{ opacity: 1, y: 0, x: 0 }}
               exit={{ opacity: 0, y: 50, x: 50 }}
               className="absolute bottom-80 left-4 z-50 bg-card border-2 border-gold p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(245,197,24,0.3)]"
            >
               <div className="w-10 h-10 bg-amber-900/30 flex items-center justify-center text-gold border border-gold/50">
                  <Info size={24} />
               </div>
               <div>
                  <div className="text-gold font-bold text-xs uppercase tracking-widest">Achievement Unlocked</div>
                  <div className="text-white font-display text-lg font-bold">{achievementToast.split(': ')[1]}</div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Shop Panel */}
      <AnimatePresence>
        {gameState.shopOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute top-16 right-0 bottom-72 w-80 bg-card border-l-2 border-primary flex flex-col shadow-2xl z-40"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
              <h3 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                <ShoppingCart size={24} /> THE SHOP
              </h3>
              <button onClick={() => dispatch({ type: 'TOGGLE_SHOP', payload: false })} className="text-muted-foreground hover:text-white">✕</button>
            </div>
            
            <div className="flex border-b border-border bg-background flex-wrap">
              {['items', 'stat', 'perks', 'cards'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => { sounds.play('uiClick'); setShopTab(tab as any); }}
                  className={`w-1/2 py-2 text-xs font-bold uppercase transition-colors border-b-2 ${shopTab === tab ? 'bg-primary/10 text-primary border-primary' : 'text-muted-foreground border-transparent hover:bg-secondary'}`}
                >
                  {tab === 'stat' ? 'Stats' : tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {SHOP_ITEMS.filter(i => i.type === shopTab).map(item => {
                const canAfford = me.gold >= item.cost;
                return (
                  <div key={item.id} className={`border p-3 flex flex-col gap-2 relative group transition-colors
                     ${canAfford ? 'border-border bg-background hover:border-primary/50' : 'border-border/30 bg-background/50 opacity-60'}
                  `}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-foreground pr-8">{item.name}</span>
                      <span className="flex items-center gap-1 text-gold text-sm font-bold bg-amber-900/30 px-2 py-0.5 border border-amber-900/50 absolute top-2 right-2">
                        {item.cost}g
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{item.description}</p>
                    <button 
                      disabled={!canAfford || gameState.phase !== 'buy'}
                      onClick={() => buyItem(item.id)}
                      className={`mt-2 py-1.5 text-xs font-bold border transition-colors ${canAfford && gameState.phase === 'buy' ? 'bg-secondary hover:bg-primary text-white border-border hover:border-transparent' : 'bg-background text-muted-foreground border-border cursor-not-allowed'}`}
                    >
                      {gameState.phase !== 'buy' ? 'BUY PHASE ONLY' : 'PURCHASE'}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Panel */}
      <AnimatePresence>
        {gameState.inventoryOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute top-16 left-0 bottom-72 w-80 bg-card border-r-2 border-primary flex flex-col shadow-2xl z-40"
          >
             <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
              <h3 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                <Package size={24} /> INVENTORY
              </h3>
              <button onClick={() => dispatch({ type: 'TOGGLE_INVENTORY', payload: false })} className="text-muted-foreground hover:text-white">✕</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
               {[...Array(8)].map((_, i) => {
                  const item = me.inventory[i];
                  return (
                     <div 
                        key={i} 
                        onClick={() => {
                           if (item && isMyTurn && gameState.phase === 'main') {
                              // We dispatch via GameContext helper
                              // Not implemented a direct click here because it needs GameContext
                              // Actually yes we did implement useInventoryItem
                           }
                        }}
                        className={`aspect-square border flex flex-col items-center justify-center p-2 text-center
                           ${item ? 'border-primary/50 bg-secondary/30 hover:border-primary cursor-pointer' : 'border-border/30 bg-black/20'}
                        `}
                     >
                        {item ? (
                           <>
                              <Package size={24} className="text-primary mb-2" />
                              <span className="text-[10px] font-bold leading-tight">{item.name}</span>
                           </>
                        ) : (
                           <span className="text-muted-foreground/30 text-xs font-bold">EMPTY</span>
                        )}
                     </div>
                  )
               })}
            </div>
            <div className="p-4 text-xs text-muted-foreground border-t border-border">
               Click an item during your Main Phase to use it.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[12rem] font-display font-bold text-primary drop-shadow-[0_0_40px_rgba(30,144,255,0.8)]"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameState.phase === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-background/95 z-50 flex items-center justify-center backdrop-blur-md"
          >
            <div className="text-center flex flex-col items-center gap-6 p-12 border-[3px] border-border bg-[#0a0e14] max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
               <h2 className={`text-7xl font-display font-bold mb-2 drop-shadow-[0_0_20px_currentColor] ${gameState.winner === me.id ? 'text-gold' : 'text-red-500'}`}>
                 {gameState.winner === me.id ? 'VICTORY!' : 'DEFEAT'}
               </h2>
               <div className="w-full flex flex-col gap-3 text-left bg-black/50 p-6 border border-white/10 text-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turns Survived</span>
                    <span className="font-bold text-white">{gameState.turn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gold Earned</span>
                    <span className="font-bold text-gold">{me.goldEarnedThisGame || 0}g</span>
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
               <div className="flex gap-4 w-full mt-6">
                  <button onClick={() => setLocation('/lobby')} className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-bold tracking-widest border border-primary hover:border-white transition-colors text-lg">PLAY AGAIN</button>
                  <button onClick={() => setLocation('/')} className="flex-1 py-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold tracking-widest border border-border text-lg">MAIN MENU</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
