import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useGame } from '../context/GameContext';
import { useLobby } from '../context/LobbyContext';
import { CardInstance, FieldCard, Player } from '../store/gameStore';
import { sounds } from '../lib/sounds';
import {
  ShoppingCart, Package, Info, ShieldAlert, Swords, Heart,
  Activity, User, ScrollText, Zap, Clock, RefreshCw, Sparkles, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOP_ITEMS, ShopItemTemplate, CARD_TEMPLATES } from '../lib/cards';
import { CardArt } from '../components/game/CardArt';

// ── Tab → type mapping ────────────────────────────────────────────────────
// Perks tab shows both 'stat' (passive field buffs) and 'perk' (permanent player upgrades)
const SHOP_TAB_TYPES: Record<string, ShopItemTemplate['type'][]> = {
  items: ['item'],
  perks: ['stat', 'perk'],
  artifacts: ['artifact'],
  cards: ['card'],
};

// ── Card type colors (MTG-style) ──────────────────────────────────────────
const TYPE_FRAME: Record<string, { bg: string; bar: string; glow: string; icon: React.ReactNode }> = {
  character:   { bg: '#0e1f3d', bar: '#1a3a6e', glow: 'rgba(60,100,200,0.6)',  icon: <Swords size={7} /> },
  spell:       { bg: '#2a0a0a', bar: '#6e1a1a', glow: 'rgba(200,60,60,0.6)',   icon: <Zap size={7} /> },
  artifact:    { bg: '#241600', bar: '#6e4e1a', glow: 'rgba(200,140,60,0.6)',  icon: <Package size={7} /> },
  enchantment: { bg: '#072210', bar: '#1a5a2e', glow: 'rgba(60,180,100,0.6)', icon: <Sparkles size={7} /> },
};

// ── Rarity border / shadow ────────────────────────────────────────────────
function rarityBorder(rarity?: string, evolved?: boolean): string {
  if (evolved) return 'border-amber-300 shadow-[0_0_14px_rgba(245,197,24,1)]';
  if (rarity === 'legendary') return 'border-amber-400 shadow-[0_0_10px_rgba(255,180,0,0.9)]';
  if (rarity === 'rare')      return 'border-purple-400 shadow-[0_0_7px_rgba(160,80,220,0.8)]';
  return 'border-[#4a3000]/80';
}

// ── Evolution progress bar ────────────────────────────────────────────────
const EvoProgress = ({ card }: { card: FieldCard }) => {
  if (!card.evolvesTo || card.evolved) return null;
  const tpl = CARD_TEMPLATES.find(t => t.templateId === card.templateId);
  const cond = tpl?.evolveCondition;
  if (!cond) return null;
  let current = 0, target = 0, label = '';
  if (cond.turnsOnField !== undefined) {
    current = card.turnsOnField; target = cond.turnsOnField; label = `⏳ ${current}/${target}`;
  } else if (cond.damageDealt !== undefined) {
    current = card.damageDealt; target = cond.damageDealt; label = `⚔ ${current}/${target}`;
  }
  if (target === 0) return null;
  const pct = Math.min(100, (current / target) * 100);
  return (
    <div className="w-full px-0.5 mt-0.5">
      <div className="w-full h-1 bg-black/60 border border-amber-900/40 overflow-hidden">
        <div className="h-full transition-all duration-500"
             style={{ width: `${pct}%`, background: pct >= 80 ? 'linear-gradient(90deg, #c9a227, #ffe066)' : 'linear-gradient(90deg, #4a7a2e, #7ac95a)' }} />
      </div>
      <div className="text-[5px] text-center text-amber-500/80 leading-none mt-0.5 font-display">{label} EVO</div>
    </div>
  );
};

// ── Field / Arena card ────────────────────────────────────────────────────
const ArenaCardUI = ({
  card, onClick, tapped = false, targetable = false, combatAnim = null, size = 'md',
}: {
  card: CardInstance | FieldCard;
  onClick?: () => void;
  tapped?: boolean;
  targetable?: boolean;
  combatAnim?: { targetId: string; damage: number } | null;
  size?: 'sm' | 'md';
}) => {
  const frame = TYPE_FRAME[card.type] || TYPE_FRAME.character;
  const fc = card as FieldCard;
  const displayAtk = fc.currentAtk ?? card.atk ?? 0;
  const displayDef = fc.currentDef ?? card.def ?? 1;
  const isEvolved = fc.evolved;
  const isHit = combatAnim?.targetId === (card as any).instanceId;
  const borderCls = rarityBorder(card.rarity, isEvolved);
  const w = size === 'sm' ? 'w-[86px]' : 'w-[106px]';
  const h = size === 'sm' ? 'h-[124px]' : 'h-[154px]';

  return (
    <motion.div
      whileHover={{ scale: 1.12, y: -6, zIndex: 60 }}
      onClick={onClick}
      title={card.name}
      className={`relative ${w} ${h} flex-shrink-0 border-2 cursor-pointer transition-colors duration-200 overflow-hidden
        ${targetable ? 'border-amber-400 shadow-[0_0_12px_rgba(201,162,39,0.8)] animate-pulse' : borderCls}
        ${tapped ? 'opacity-55 rotate-[8deg]' : ''}
        ${isHit ? 'animate-[flash-red_0.3s_ease]' : ''}
      `}
      style={{ background: frame.bg }}
    >
      <div className="h-[19%] flex items-center justify-between px-1 relative"
           style={{ background: `linear-gradient(90deg, ${frame.bar}dd, ${frame.bar}88)` }}>
        <span className="text-[10px] font-display font-bold text-amber-100 leading-tight truncate pr-0.5">{card.name}</span>
        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] text-white"
             style={{ background: 'radial-gradient(circle, #2a1a00, #1a0d00)', border: '1px solid #c9a227', boxShadow: '0 0 4px rgba(201,162,39,0.6)' }}>
          {card.cost}
        </div>
      </div>
      <div className="h-[35%] w-full"><CardArt templateId={card.templateId} type={card.type} /></div>
      <div className="h-[7%] w-full flex items-center px-1" style={{ background: `${frame.bar}99` }}>
        <span className="text-[9px] text-amber-200/80 font-display uppercase tracking-widest truncate leading-none">{card.type}</span>
      </div>
      <div className="flex-1 px-1 py-0.5 text-[9px] leading-tight overflow-y-auto scrollbar-thin"
           style={{ background: 'linear-gradient(180deg, #1a1208 0%, #120e06 100%)', color: '#c8b888', minHeight: 0 }}>
        {card.description}
        {isEvolved && <div className="text-amber-400 font-bold text-[9px] mt-0.5">✦ EVOLVED</div>}
        <EvoProgress card={fc} />
      </div>
      <div className="h-[14%] flex-shrink-0 flex items-center justify-between px-1"
           style={{ background: 'linear-gradient(180deg, #0e0a05, #080603)', borderTop: '1px solid rgba(74,48,0,0.5)' }}>
        {card.type === 'character' ? (
          <>
            <div className="flex items-center gap-0.5 font-bold text-[13px]" style={{ color: '#e8a030' }}><Swords size={10} />{displayAtk}</div>
            <div className="text-[9px]" style={{ color: 'rgba(201,162,39,0.4)' }}>◆</div>
            <div className="flex items-center gap-0.5 font-bold text-[13px]" style={{ color: '#5db860' }}><ShieldAlert size={10} />{displayDef}<span style={{ color: 'rgba(93,184,96,0.45)', fontSize: '9px', fontWeight: 'normal' }}>/{card.def ?? displayDef}</span></div>
          </>
        ) : (
          <div className="flex w-full justify-center" style={{ color: frame.bar }}>{frame.icon}</div>
        )}
      </div>
      <AnimatePresence>
        {isHit && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -35, scale: 1.4 }} transition={{ duration: 0.65 }}
            className="absolute inset-0 flex items-center justify-center text-2xl font-display font-black text-red-400 drop-shadow-[0_0_6px_black] z-50 pointer-events-none"
          >
            -{combatAnim!.damage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Artifact Slot display ─────────────────────────────────────────────────
const ArtifactSlotUI = ({
  artifact, turnsInSlot, isMe, canSell, onSell,
}: {
  artifact: CardInstance | null;
  turnsInSlot: number;
  isMe?: boolean;
  canSell?: boolean;
  onSell?: () => void;
}) => {
  const locked = artifact && turnsInSlot < 2;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="text-[6px] font-display uppercase tracking-wider"
           style={{ color: 'rgba(200,140,60,0.6)' }}>Artifact</div>
      {artifact ? (
        <div className="relative">
          <div
            className="w-14 border-2 flex flex-col items-center justify-center px-1 py-1 gap-0.5"
            style={{
              background: 'linear-gradient(180deg, #241600, #180e00)',
              borderColor: locked ? 'rgba(180,80,80,0.7)' : 'rgba(200,140,60,0.7)',
              boxShadow: locked
                ? '0 0 8px rgba(180,80,80,0.3)'
                : '0 0 10px rgba(200,140,60,0.4)',
              minHeight: 48,
            }}
            title={artifact.description}
          >
            <Package size={10} style={{ color: '#c9a227' }} />
            <span className="text-[5px] font-display font-bold text-amber-200 text-center leading-tight truncate w-full">{artifact.name}</span>
            <span className="text-[5px] italic text-amber-700 text-center leading-tight truncate w-full">{artifact.description?.slice(0, 20)}</span>
            {locked && (
              <span className="text-[5px] font-display text-red-400">🔒 {2 - turnsInSlot}t</span>
            )}
          </div>
          {isMe && canSell && !locked && (
            <button
              onClick={onSell}
              title={`Sell for ${artifact.cost * 75}g`}
              className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[7px] font-bold hover:opacity-80 transition-opacity z-10"
              style={{
                background: 'rgba(100,60,0,0.9)',
                border: '1px solid rgba(201,162,39,0.6)',
                color: '#c9a227',
              }}
            >
              $
            </button>
          )}
        </div>
      ) : (
        <div
          className="w-14 border border-dashed flex items-center justify-center"
          style={{
            borderColor: 'rgba(200,140,60,0.2)',
            background: 'rgba(200,140,60,0.03)',
            minHeight: 48,
          }}
        >
          <span className="text-[6px] font-display text-center" style={{ color: 'rgba(200,140,60,0.2)' }}>Empty</span>
        </div>
      )}
    </div>
  );
};

// ── Hand card ─────────────────────────────────────────────────────────────
const HandCardUI = ({
  card, playable, staged, onClick,
}: {
  card: CardInstance;
  playable?: boolean;
  staged?: boolean;
  onClick?: () => void;
}) => {
  const frame = TYPE_FRAME[card.type] || TYPE_FRAME.character;
  const borderCls = rarityBorder(card.rarity);

  return (
    <motion.div
      whileHover={{ scale: 1.25, y: -24, zIndex: 60 }}
      onClick={onClick}
      onMouseEnter={() => playable && sounds.play('cardHover')}
      className={`relative w-36 h-56 flex-shrink-0 border-[2px] cursor-pointer transition-all duration-200 overflow-hidden
        ${playable
          ? 'border-amber-400 shadow-[0_0_18px_rgba(201,162,39,0.8),0_0_6px_rgba(201,162,39,0.4)]'
          : staged
            ? 'border-red-500/70 shadow-[0_0_10px_rgba(200,60,60,0.5)]'
            : borderCls}
      `}
      style={{ background: staged ? '#1a0808' : frame.bg }}
    >
      {staged && (
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-center py-0.5"
             style={{ background: 'rgba(180,30,30,0.9)' }}>
          <span className="text-[8px] font-display font-bold uppercase tracking-wider text-red-200">⚡ Staged</span>
        </div>
      )}
      <div className="h-[18%] flex items-center justify-between px-1.5"
           style={{ background: `linear-gradient(90deg, ${frame.bar}ff, ${frame.bar}99)` }}>
        <span className="text-[13px] font-display font-bold text-amber-100 leading-tight truncate">{card.name}</span>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-display font-black text-[13px] text-amber-100"
             style={{ background: 'radial-gradient(circle, #2a1a00, #120d00)', border: '1px solid #c9a227', boxShadow: '0 0 5px rgba(201,162,39,0.7)' }}>
          {card.cost}
        </div>
      </div>
      <div className="h-[33%] w-full"><CardArt templateId={card.templateId} type={card.type} /></div>
      <div className="h-[7%] flex items-center px-1.5" style={{ background: `${frame.bar}bb` }}>
        <span className="text-[10px] text-amber-100/80 font-display uppercase tracking-widest">{card.type}</span>
      </div>
      <div className="flex-1 p-1.5 text-[11px] leading-snug overflow-y-auto scrollbar-thin"
           style={{ background: 'linear-gradient(180deg, #1c1508 0%, #120e06 100%)', color: '#cbb888', minHeight: 0 }}>
        {card.description}
      </div>
      <div className="h-[12%] flex-shrink-0 flex items-center justify-between px-1.5"
           style={{ background: 'linear-gradient(180deg, #0e0a05, #070503)', borderTop: '1px solid rgba(74,48,0,0.5)' }}>
        {card.type === 'character' ? (
          <>
            <div className="flex items-center gap-0.5 font-display font-bold text-[15px]" style={{ color: '#e8a030' }}><Swords size={12} />{card.atk}</div>
            <div className="flex items-center gap-0.5 font-display font-bold text-[15px]" style={{ color: '#5db860' }}><ShieldAlert size={12} />{card.def}</div>
          </>
        ) : (
          <div className="flex w-full justify-center" style={{ color: frame.bar }}>{frame.icon}</div>
        )}
      </div>
    </motion.div>
  );
};

// ── Arena positions ───────────────────────────────────────────────────────
type PositionId = 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const POSITION_CFG: Record<PositionId, { wrapperCls: string; inner: string; cardArea: string; horizontal?: boolean }> = {
  left:           { wrapperCls: 'left-0 top-1/2 -translate-y-1/2', inner: 'flex-row',         cardArea: 'flex-row flex-wrap gap-1 max-w-[120px]' },
  right:          { wrapperCls: 'right-0 top-1/2 -translate-y-1/2', inner: 'flex-row-reverse', cardArea: 'flex-row flex-wrap gap-1 max-w-[120px]' },
  top:            { wrapperCls: 'top-0 left-1/2 -translate-x-1/2', inner: 'flex-row-reverse',  cardArea: 'flex-row gap-1', horizontal: true },
  bottom:         { wrapperCls: 'bottom-0 left-1/2 -translate-x-1/2', inner: 'flex-row',       cardArea: 'flex-row gap-1', horizontal: true },
  'top-left':     { wrapperCls: 'top-0 left-0',   inner: 'flex-col',         cardArea: 'flex-row flex-wrap gap-1 max-w-[120px]' },
  'top-right':    { wrapperCls: 'top-0 right-0',  inner: 'flex-col',         cardArea: 'flex-row flex-wrap gap-1 max-w-[120px]' },
  'bottom-left':  { wrapperCls: 'bottom-0 left-0',  inner: 'flex-col-reverse', cardArea: 'flex-row flex-wrap gap-1 max-w-[120px]' },
  'bottom-right': { wrapperCls: 'bottom-0 right-0', inner: 'flex-col-reverse', cardArea: 'flex-row flex-wrap gap-1 max-w-[120px]' },
};

// Local player (index 0) is ALWAYS at 'bottom' — enemies spread around the top
function getPositions(count: number): PositionId[] {
  switch (count) {
    case 2: return ['bottom', 'top'];
    case 3: return ['bottom', 'top-left', 'top-right'];
    case 4: return ['bottom', 'top-left', 'top', 'top-right'];
    case 5: return ['bottom', 'bottom-left', 'top-left', 'top-right', 'bottom-right'];
    case 6: return ['bottom', 'bottom-left', 'top-left', 'top', 'top-right', 'bottom-right'];
    default: return ['bottom', 'top'];
  }
}

// ── Player Zone ───────────────────────────────────────────────────────────
const PlayerZone = ({
  player, posId, isMe, isMyTurn, phase, targetingMode, onHeroClick, onCardClick,
  combatAnim, aether, maxAether, onSellArtifact, onSellCreature,
}: {
  player: Player;
  posId: PositionId;
  isMe: boolean;
  isMyTurn: boolean;
  phase: string;
  targetingMode: string;
  onHeroClick: () => void;
  onCardClick: (card: FieldCard) => void;
  combatAnim: { targetId: string; damage: number } | null;
  aether?: number;
  maxAether?: number;
  onSellArtifact?: () => void;
  onSellCreature?: (instanceId: string) => void;
}) => {
  const cfg = POSITION_CFG[posId];
  const isHeroHit = combatAnim?.targetId === player.id.toString();
  const heroTargetable = targetingMode === 'attack' || targetingMode === 'spell';
  const hp = player.hp, maxHp = player.maxHp;
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const hpColor = hpPct > 60 ? '#4ade80' : hpPct > 25 ? '#f59e0b' : '#ef4444';
  const crests = ['#c9a227', '#e05050', '#50a0e0', '#50c878', '#c050e0', '#e08030'];
  const crestColor = isMe ? '#c9a227' : crests[(player.id % crests.length)];

  return (
    <div className={`absolute z-10 ${cfg.wrapperCls}`}>
      <div className={`flex ${cfg.inner} items-center gap-1 p-1`}>

        {/* Portrait + stats block */}
        <div
          onClick={onHeroClick}
          className={`flex flex-col items-center gap-0.5 relative
            ${heroTargetable && !isMe ? 'cursor-crosshair hover:scale-105 transition-transform' : ''}
          `}
        >
          <div
            className={`relative flex items-center justify-center transition-all duration-200
              ${isHeroHit ? 'animate-[flash-red_0.3s_ease]' : ''}
              ${heroTargetable && !isMe ? 'drop-shadow-[0_0_10px_rgba(201,162,39,0.8)]' : ''}
            `}
            style={{
              width: 52, height: 52,
              clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
              background: `radial-gradient(ellipse at 30% 30%, ${crestColor}22, #080503)`,
              border: `2px solid ${crestColor}60`,
            }}
          >
            {isMe ? <User size={22} style={{ color: crestColor }} /> : <Activity size={22} style={{ color: crestColor }} />}
            {player.field.some(c => c.evolved) && (
              <div className="absolute inset-0" style={{ animation: 'evolve-glow 2s ease-in-out infinite' }} />
            )}
            {(player.isDead || player.hp <= 0) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
                <span className="text-[8px] font-display font-black text-red-400 tracking-widest">DEAD</span>
              </div>
            )}
          </div>

          <div className="text-[8px] font-display font-bold text-center leading-tight max-w-[60px] truncate flex items-center gap-1"
               style={{ color: isMe ? '#c9a227' : (player.hp <= 0 || player.isDead) ? 'rgba(180,50,50,0.7)' : '#c8b888', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
            {player.name}
          </div>

          <div className="w-14 h-3 border relative overflow-hidden"
               style={{ background: '#0a0604', borderColor: 'rgba(74,48,0,0.6)' }}>
            <div className="absolute top-0 left-0 h-full transition-all duration-500"
                 style={{ width: `${hpPct}%`, background: `linear-gradient(90deg, ${hpColor}99, ${hpColor})` }}>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10" />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-display font-bold text-white"
                  style={{ textShadow: '0 0 3px rgba(0,0,0,1)' }}>
              {hp}/{maxHp}
            </span>
          </div>

          {isMe && aether !== undefined && maxAether !== undefined && (
            <div className="flex flex-wrap gap-0.5 justify-center max-w-[60px]">
              {Array.from({ length: maxAether }).map((_, i) => (
                <div key={i}
                     className="w-2 h-2 border"
                     style={{
                       transform: 'rotate(45deg)',
                       background: i < aether ? '#c9a227' : 'transparent',
                       borderColor: i < aether ? '#f0cc55' : 'rgba(74,48,0,0.4)',
                       boxShadow: i < aether ? '0 0 4px rgba(201,162,39,0.7)' : 'none',
                     }} />
              ))}
            </div>
          )}

          <AnimatePresence>
            {isHeroHit && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 1 }} animate={{ opacity: 0, y: -30, scale: 1.5 }} transition={{ duration: 0.7 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl font-display font-black text-red-400 drop-shadow-[0_0_6px_black] z-50 pointer-events-none whitespace-nowrap"
              >
                -{combatAnim!.damage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Artifact slot — shown only for the local player, placed left of field */}
        {isMe && (
          <ArtifactSlotUI
            artifact={player.artifactSlot ?? null}
            turnsInSlot={player.artifactSlotTurns}
            isMe={isMe}
            canSell={isMyTurn && phase === 'main'}
            onSell={onSellArtifact}
          />
        )}

        {/* Field cards area */}
        {player.field.length > 0 && (
          <div className={`flex ${cfg.cardArea} overflow-hidden`} style={{ maxWidth: cfg.horizontal ? undefined : 120, maxHeight: cfg.horizontal ? undefined : 200 }}>
            {player.field.map(card => {
              const isTargetable = targetingMode !== 'none' && !isMe;
              const canSellThis = isMe && isMyTurn && phase === 'main' && onSellCreature;
              return (
                <div key={card.instanceId} className="relative">
                  <ArenaCardUI
                    card={card}
                    size="sm"
                    tapped={card.tapped}
                    targetable={isTargetable}
                    onClick={() => onCardClick(card)}
                    combatAnim={combatAnim}
                  />
                  {canSellThis && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSellCreature!(card.instanceId); }}
                      title={`Sell for ${card.cost * (card.rarity === 'legendary' ? 100 : card.rarity === 'rare' ? 75 : 50)}g`}
                      className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[7px] font-bold hover:opacity-80 transition-opacity z-20"
                      style={{
                        background: 'rgba(100,60,0,0.95)',
                        border: '1px solid rgba(201,162,39,0.7)',
                        color: '#c9a227',
                      }}
                    >
                      $
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {player.field.length === 0 && (
          <div className="w-16 h-20 border border-dashed flex items-center justify-center text-center"
               style={{ borderColor: `${crestColor}20`, background: `${crestColor}05` }}>
            <span className="text-[7px] font-display uppercase" style={{ color: `${crestColor}30` }}>Empty</span>
          </div>
        )}

        {/* Opponent hand — face-down card backs with count */}
        {!isMe && (
          <div className="flex flex-col items-center gap-0.5 ml-1 shrink-0">
            <div className="relative" style={{ width: 36, height: 50 }}>
              {/* Depth shadow cards */}
              {player.hand.length > 2 && (
                <div className="absolute" style={{
                  width: 26, height: 38, top: -4, left: 7,
                  background: '#100303', border: '1px solid rgba(110,20,20,0.3)', borderRadius: 2,
                }} />
              )}
              {player.hand.length > 1 && (
                <div className="absolute" style={{
                  width: 28, height: 40, top: -2, left: 4,
                  background: '#180505', border: '1px solid rgba(140,28,28,0.35)', borderRadius: 2,
                }} />
              )}
              {/* Top face-down card */}
              <div className="absolute flex items-center justify-center" style={{
                width: 30, height: 42, top: 0, left: 2,
                background: 'linear-gradient(135deg, #2d0808 0%, #1a0404 100%)',
                border: '1px solid rgba(160,40,40,0.55)',
                borderRadius: 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
              }}>
                {/* Card back inner pattern */}
                <div style={{
                  position: 'absolute', inset: 3,
                  border: '1px solid rgba(160,40,40,0.2)',
                  backgroundImage: 'repeating-linear-gradient(45deg, rgba(160,40,40,0.08) 0px, rgba(160,40,40,0.08) 1px, transparent 1px, transparent 5px)',
                }} />
                {player.hand.length > 0 ? (
                  <span className="relative font-display font-bold text-[11px]" style={{ color: 'rgba(220,70,70,0.9)', zIndex: 1 }}>
                    {player.hand.length}
                  </span>
                ) : (
                  <span className="relative font-display text-[9px]" style={{ color: 'rgba(160,40,40,0.4)', zIndex: 1 }}>—</span>
                )}
              </div>
            </div>
            <span className="font-display uppercase text-[6px]" style={{ color: 'rgba(160,40,40,0.55)', letterSpacing: '0.1em' }}>
              hand
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Water pool + islands ──────────────────────────────────────────────────
const ISLAND_POSITIONS: Record<PositionId, { top?: string; bottom?: string; left?: string; right?: string; transform?: string; clip: string }> = {
  left:           { left: '0%', top: '50%', transform: 'translateY(-50%)', clip: 'polygon(0 20%, 55% 0%, 55% 100%, 0 80%)' },
  right:          { right: '0%', top: '50%', transform: 'translateY(-50%)', clip: 'polygon(45% 0%, 100% 20%, 100% 80%, 45% 100%)' },
  top:            { top: '0%', left: '50%', transform: 'translateX(-50%)', clip: 'polygon(10% 0%, 90% 0%, 100% 55%, 0% 55%)' },
  bottom:         { bottom: '0%', left: '50%', transform: 'translateX(-50%)', clip: 'polygon(0 45%, 100% 45%, 90% 100%, 10% 100%)' },
  'top-left':     { top: '0%', left: '0%', clip: 'polygon(0 0, 65% 0, 65% 20%, 20% 65%, 0 65%)' },
  'top-right':    { top: '0%', right: '0%', clip: 'polygon(35% 0, 100% 0, 100% 65%, 80% 65%, 35% 20%)' },
  'bottom-left':  { bottom: '0%', left: '0%', clip: 'polygon(0 35%, 20% 35%, 65% 80%, 65% 100%, 0 100%)' },
  'bottom-right': { bottom: '0%', right: '0%', clip: 'polygon(35% 80%, 80% 35%, 100% 35%, 100% 100%, 35% 100%)' },
};

const WaterPool = ({ animated, playerCount, positions }: { animated: boolean; playerCount: number; positions: PositionId[] }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
    {/* Stone floor backdrop grid */}
    <div className="absolute inset-0"
         style={{ background: 'radial-gradient(ellipse at center, rgba(20,12,4,0) 0%, rgba(8,5,2,0.5) 100%)' }} />

    {/* Islands at each player position */}
    {positions.slice(0, playerCount).map((pos) => {
      const cfg = ISLAND_POSITIONS[pos] || ISLAND_POSITIONS.left;
      return (
        <div
          key={pos}
          className="absolute"
          style={{
            width: pos === 'top' || pos === 'bottom' ? '40%' : pos === 'left' || pos === 'right' ? '22%' : '28%',
            height: pos === 'top' || pos === 'bottom' ? '22%' : pos === 'left' || pos === 'right' ? '40%' : '28%',
            top: cfg.top,
            bottom: cfg.bottom,
            left: cfg.left,
            right: cfg.right,
            transform: cfg.transform,
            clipPath: cfg.clip,
            background: 'linear-gradient(135deg, #2a1c08 0%, #1c1206 40%, #221608 70%, #181006 100%)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), 0 0 12px rgba(0,60,100,0.3)',
          }}
        >
          {/* Stone texture dots */}
          {[...Array(6)].map((_, i) => (
            <div key={i}
                 className="absolute rounded-full"
                 style={{
                   width: 3 + (i % 3), height: 3 + (i % 3),
                   left: `${15 + (i * 13) % 70}%`, top: `${20 + (i * 17) % 60}%`,
                   background: 'rgba(201,162,39,0.05)', border: '1px solid rgba(74,48,0,0.2)',
                 }} />
          ))}
        </div>
      );
    })}

    {/* Outer ambient glow */}
    <div className="absolute w-96 h-56 rounded-[50%]"
         style={{ background: 'radial-gradient(ellipse at center, rgba(0,80,140,0.12) 0%, transparent 70%)' }} />

    {/* Main pool — organic/irregular ellipse shape */}
    <div className="relative"
         style={{ width: 200, height: 130 }}>
      {/* Pool body */}
      <div className="absolute inset-0"
           style={{
             borderRadius: '62% 38% 54% 46% / 48% 52% 48% 52%',
             background: 'radial-gradient(ellipse at 38% 35%, rgba(0,140,220,0.55) 0%, rgba(0,80,160,0.65) 40%, rgba(0,40,110,0.78) 75%, rgba(0,20,60,0.92) 100%)',
             boxShadow: 'inset 0 0 40px rgba(0,80,140,0.5), inset 0 0 80px rgba(0,40,100,0.3), 0 0 40px rgba(0,60,120,0.3)',
             border: '2px solid rgba(0,120,200,0.3)',
           }} />

      {/* Shimmer surface highlight */}
      <div className="absolute"
           style={{
             inset: '10% 15% 40% 15%',
             borderRadius: '60% 40% 50% 50%',
             background: 'radial-gradient(ellipse at 35% 40%, rgba(120,210,255,0.18) 0%, transparent 60%)',
             animation: animated ? 'water-shimmer 3s ease-in-out infinite' : 'none',
           }} />

      {/* Rune ring */}
      <div className="absolute inset-[18%] border"
           style={{
             borderRadius: '50%',
             borderColor: 'rgba(0,160,240,0.12)',
             animation: animated ? 'water-rotate 22s linear infinite' : 'none',
           }}>
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <div key={deg}
               className="absolute w-1 h-1 rounded-full"
               style={{
                 background: 'rgba(0,200,255,0.35)',
                 top: '50%', left: '50%',
                 transform: `rotate(${deg}deg) translateY(-180%) translate(-50%,-50%)`,
               }} />
        ))}
      </div>

      {/* Ripple rings */}
      {animated && [1, 2, 3].map(i => (
        <div key={i}
             className="absolute border"
             style={{
               inset: `${-i * 14}px`,
               borderRadius: '62% 38% 54% 46% / 48% 52% 48% 52%',
               borderColor: `rgba(0,140,220,${0.22 - i * 0.06})`,
               animation: `ripple-out ${2.5 + i * 0.8}s ease-out infinite`,
               animationDelay: `${i * 0.7}s`,
             }} />
      ))}

      {/* Center rune */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-[22px] font-display select-none"
             style={{
               color: 'rgba(0,160,255,0.18)',
               textShadow: '0 0 12px rgba(0,120,200,0.4)',
               animation: animated ? 'water-rotate 8s linear infinite reverse' : 'none',
               lineHeight: 1,
             }}>
          ✦
        </div>
      </div>

      {/* Edge foam / shoreline highlights */}
      {[15, 70, 140, 200, 260, 320].map((deg, i) => (
        <div key={i}
             className="absolute w-3 h-1.5 rounded-full"
             style={{
               background: 'rgba(200,240,255,0.12)',
               top: `${50 + 44 * Math.sin(deg * Math.PI / 180)}%`,
               left: `${50 + 48 * Math.cos(deg * Math.PI / 180)}%`,
               transform: `rotate(${deg}deg) translate(-50%, -50%)`,
             }} />
      ))}
    </div>
  </div>
);

// ── Floating particles ────────────────────────────────────────────────────
const PARTICLES = [...Array(18)].map(() => ({
  left: `${Math.random() * 100}%`,
  dur: 12 + Math.random() * 18,
  delay: Math.random() * 12,
}));

// ── Pending Spell Badge ───────────────────────────────────────────────────
const PendingSpellBadge = ({ spell }: { spell: { name: string; targetId?: string } }) => (
  <div className="flex items-center gap-1 px-2 py-0.5 border"
       style={{
         background: 'rgba(80,10,10,0.8)',
         borderColor: 'rgba(200,60,60,0.6)',
         boxShadow: '0 0 6px rgba(200,60,60,0.3)',
       }}>
    <Zap size={8} style={{ color: '#e05050' }} />
    <span className="text-[8px] font-display font-bold" style={{ color: '#e08080' }}>{spell.name}</span>
  </div>
);

// ── Main Game Page ────────────────────────────────────────────────────────
export default function GamePage() {
  const [, setLocation] = useLocation();
  const {
    gameState, dispatch, playCard, stageSpell, sellArtifact, sellCreature, sellHandCard, attackWith,
    buyItem, useInventoryItem, equipInventoryItem, endPhase, pickDraftCard, achievementToast, combatAnim, announcement,
    shopRotationIds, shopRotationTimeLeft, buyPhaseTimeLeft,
  } = useGame();
  const { animatedBattlefield } = useLobby();

  const [countdown, setCountdown] = useState<number | null>(3);
  const [shopTab, setShopTab] = useState<'items' | 'perks' | 'artifacts' | 'cards'>('items');
  const [invTab, setInvTab] = useState<'items' | 'perks'>('items');
  const [logOpen, setLogOpen] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [relicDragOver, setRelicDragOver] = useState(false);
  const [cantPlayReason, setCantPlayReason] = useState<string | null>(null);
  const cantPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return (
      <div className="p-8 font-display text-amber-300">
        No game active.{' '}
        <button onClick={() => setLocation('/')} className="text-amber-400 underline">Go Home</button>
      </div>
    );
  }

  const me = gameState.players.find(p => p.isHuman) || gameState.players[0];
  const enemies = gameState.players.filter(p => p.id !== me.id);
  const allPlayers = [me, ...enemies];
  const positions = getPositions(allPlayers.length);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer.id === me.id;
  const isDefeated = gameState.phase === 'gameover' && gameState.winner !== me.id;

  // ── Interaction handlers ────────────────────────────────────────────────
  const flashReason = (msg: string) => {
    setCantPlayReason(msg);
    if (cantPlayTimer.current) clearTimeout(cantPlayTimer.current);
    cantPlayTimer.current = setTimeout(() => setCantPlayReason(null), 2000);
  };

  const handleCardClick = (card: CardInstance) => {
    if (!isMyTurn) { flashReason("It's not your turn"); return; }
    if (gameState.phase !== 'main') { flashReason(`Cards can only be played in the Main phase`); return; }
    if (me.aether < card.cost) { flashReason(`Not enough Aether — need ${card.cost}, have ${me.aether}`); return; }
    if (me.cardsPlayedByType[card.type]) { flashReason(`Already played a ${card.type} this turn`); return; }

    if (card.type === 'spell') {
      if (card.effect?.includes('target')) {
        dispatch({ type: 'SET_TARGETING', payload: { mode: 'spell', sourceId: card.instanceId, pendingAction: null } });
      } else {
        stageSpell(card.instanceId);
      }
    } else if (card.type === 'enchantment') {
      dispatch({ type: 'SET_TARGETING', payload: { mode: 'enchantment', sourceId: card.instanceId, pendingAction: null } });
    } else if (card.type === 'artifact') {
      if (me.artifactSlot && me.artifactSlotTurns < 2) {
        flashReason(`Artifact locked — ${2 - me.artifactSlotTurns} more turn${2 - me.artifactSlotTurns > 1 ? 's' : ''} before you can swap`);
        return;
      }
      playCard(card.instanceId);
    } else if (card.type === 'character') {
      if (me.field.length >= 4) { flashReason('Field is full — sell or wait to deploy another character'); return; }
      playCard(card.instanceId);
    } else {
      playCard(card.instanceId);
    }
  };

  const handleFieldClick = (player: Player, fieldCard: FieldCard) => {
    if (!isMyTurn) return;

    if (gameState.targetingMode === 'spell' || gameState.targetingMode === 'item') {
      if (gameState.targetingMode === 'item') {
        dispatch({ type: 'USE_INVENTORY', payload: { playerId: me.id, instanceId: gameState.sourceId!, targetId: fieldCard.instanceId } });
      } else {
        // Stage spell with target
        stageSpell(gameState.sourceId!, fieldCard.instanceId);
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
      // Stage spell targeting hero
      stageSpell(gameState.sourceId!, player.id.toString());
      dispatch({ type: 'CLEAR_TARGETING' });
      return;
    }
    if (gameState.targetingMode === 'attack' && player.id !== me.id) {
      attackWith(gameState.sourceId!, player.id);
      dispatch({ type: 'CLEAR_TARGETING' });
      return;
    }
  };

  const handleInventoryClick = (item: { instanceId: string; effectKey?: string }) => {
    if (!isMyTurn || gameState.phase !== 'main') return;
    if (item.effectKey === 'ironheart') return;
    useInventoryItem(item.instanceId);
  };

  // ── Shop helpers ──────────────────────────────────────────────────────
  const isOwnedItem = (item: ShopItemTemplate): boolean => {
    if (item.stackable || item.type === 'card') return false;
    return (
      me.inventory.some(i => i.itemId === item.id) ||
      (item.effectKey ? me.perks.includes(item.effectKey) : false) ||
      (item.effectKey ? me.statBuffs.includes(item.effectKey) : false)
    );
  };

  const visibleShopItems = SHOP_ITEMS.filter(i =>
    (SHOP_TAB_TYPES[shopTab] || []).includes(i.type) && shopRotationIds.includes(i.id)
  );

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const targetingLabel: Record<string, string> = {
    spell:       'Select a target for your spell',
    attack:      'Select an enemy to attack',
    enchantment: 'Select your character to enchant',
    item:        'Select a target for this item',
  };

  return (
    <div className="h-[100dvh] w-full bg-kodi-gradient text-foreground flex flex-col overflow-hidden relative select-none"
         style={{ fontFamily: "'IM Fell English', Georgia, serif" }}>

      {/* Ambient particles */}
      {animatedBattlefield && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p, i) => (
            <div key={i}
                 className="absolute w-0.5 h-0.5 rounded-full"
                 style={{
                   left: p.left, top: '100%',
                   background: i % 3 === 0 ? '#c9a227' : i % 3 === 1 ? 'rgba(0,140,220,0.7)' : 'rgba(180,80,80,0.6)',
                   boxShadow: `0 0 4px currentColor`,
                   animation: `float ${p.dur}s linear infinite`,
                   animationDelay: `${p.delay}s`,
                 }} />
          ))}
        </div>
      )}

      {/* ── Top HUD ─────────────────────────────────────────────────────── */}
      <div className="h-14 z-20 flex items-center justify-between px-4 shrink-0 relative"
           style={{
             background: 'linear-gradient(180deg, #100b06 0%, #0d0906 100%)',
             borderBottom: '2px solid #3a2800',
             boxShadow: '0 2px 20px rgba(0,0,0,0.8), 0 1px 0 rgba(201,162,39,0.15)',
           }}>
        <div className="absolute left-0 top-0 w-24 h-full pointer-events-none"
             style={{ background: 'linear-gradient(90deg, rgba(201,162,39,0.04), transparent)' }} />

        <div className="flex items-center gap-0.5 relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-amber-800/40 text-xs select-none">❧</div>
          {['draw','buy','main','combat','end'].map(p => (
            <div key={p} className={`phase-pip ${gameState.phase === p ? 'active' : ''}`}>{p}</div>
          ))}
        </div>

        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <div className="text-[10px] font-display uppercase tracking-[0.4em] text-amber-700/70 leading-none">— Turn —</div>
          <div className="text-2xl font-display font-black leading-tight"
               style={{ color: '#c9a227', textShadow: '0 0 12px rgba(201,162,39,0.4)' }}>
            {gameState.turn}
          </div>
          <div className="text-[9px] font-display uppercase tracking-widest leading-none"
               style={{ color: isMyTurn ? '#c9a227' : '#7a6040' }}>
            {isMyTurn ? (
              <span>
                Your Turn
                {gameState.phase === 'buy' && buyPhaseTimeLeft !== null && (
                  <span className={`ml-1 font-mono ${buyPhaseTimeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}`}>
                    [{buyPhaseTimeLeft}s]
                  </span>
                )}
              </span>
            ) : `${currentPlayer.name}'s Turn`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0">
            <span className="text-[10px] font-display text-amber-600 uppercase tracking-wider">{me.name}</span>
            <div className="flex items-center gap-1 text-sm font-display font-bold"
                 style={{ color: '#c9a227', textShadow: '0 0 6px rgba(201,162,39,0.5)' }}>
              <span className="w-2.5 h-2.5 rounded-full"
                    style={{ background: '#c9a227', boxShadow: '0 0 5px rgba(201,162,39,0.8)' }} />
              {me.gold.toLocaleString()}g
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_INVENTORY', payload: !gameState.inventoryOpen })}
            className="btn-fantasy p-1.5 text-xs"
            style={{ minWidth: 32 }}
          >
            <Package size={14} />
          </button>
        </div>

        <div className="absolute right-0 top-0 w-24 h-full pointer-events-none"
             style={{ background: 'linear-gradient(270deg, rgba(201,162,39,0.04), transparent)' }} />
      </div>

      {/* ── Arena ───────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden min-h-0 z-10">

        {/* Stone texture overlay */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               background: `
                 repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(201,162,39,0.015) 32px, rgba(201,162,39,0.015) 33px),
                 repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(201,162,39,0.015) 32px, rgba(201,162,39,0.015) 33px)
               `,
             }} />

        {/* Cardinal divider lines */}
        <div className="absolute inset-x-0 top-1/2 h-px pointer-events-none"
             style={{ background: 'linear-gradient(90deg, transparent, rgba(74,48,0,0.25) 20%, rgba(74,48,0,0.25) 80%, transparent)' }} />
        <div className="absolute inset-y-0 left-1/2 w-px pointer-events-none"
             style={{ background: 'linear-gradient(180deg, transparent, rgba(74,48,0,0.25) 20%, rgba(74,48,0,0.25) 80%, transparent)' }} />

        {/* Water pool with islands */}
        <WaterPool animated={animatedBattlefield} playerCount={allPlayers.length} positions={positions} />

        {/* Player zones */}
        {allPlayers.map((player, idx) => {
          const posId = positions[idx] ?? 'right';
          return (
            <PlayerZone
              key={player.id}
              player={player}
              posId={posId}
              isMe={player.isHuman}
              isMyTurn={isMyTurn}
              phase={gameState.phase}
              targetingMode={gameState.targetingMode}
              onHeroClick={() => handleHeroClick(player)}
              onCardClick={(card) => handleFieldClick(player, card)}
              combatAnim={combatAnim}
              aether={player.isHuman ? me.aether : undefined}
              maxAether={player.isHuman ? me.maxAether : undefined}
              onSellArtifact={player.isHuman ? sellArtifact : undefined}
              onSellCreature={player.isHuman ? sellCreature : undefined}
            />
          );
        })}

        {/* Targeting toast */}
        <AnimatePresence>
          {gameState.targetingMode !== 'none' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 pointer-events-auto"
              style={{
                background: 'linear-gradient(180deg, rgba(30,18,4,0.97) 0%, rgba(20,12,2,0.97) 100%)',
                border: '1px solid rgba(201,162,39,0.5)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 12px rgba(201,162,39,0.15)',
              }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#c9a227', boxShadow: '0 0 6px rgba(201,162,39,0.8)' }} />
              <span className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: '#c9a227' }}>
                {targetingLabel[gameState.targetingMode] ?? 'Select target'}
              </span>
              <button
                onClick={() => dispatch({ type: 'CLEAR_TARGETING' })}
                className="ml-2 text-[10px] font-display uppercase tracking-widest px-2 py-0.5 border transition-colors hover:opacity-80"
                style={{ borderColor: 'rgba(180,50,50,0.6)', color: '#e05050', background: 'rgba(60,10,10,0.5)' }}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcement banner */}
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.1, y: -10 }}
              className="absolute inset-x-0 flex justify-center z-50 pointer-events-none"
              style={{ top: '42%' }}
            >
              <div className="px-10 py-4 text-center relative"
                   style={{
                     background: 'linear-gradient(180deg, rgba(20,10,0,0.95) 0%, rgba(12,6,0,0.95) 100%)',
                     borderTop: '3px solid rgba(201,162,39,0.7)',
                     borderBottom: '3px solid rgba(201,162,39,0.7)',
                     boxShadow: '0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(201,162,39,0.15)',
                   }}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/50 font-display text-lg">❧</div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-700/50 font-display text-lg">❧</div>
                <h2 className="text-4xl font-display font-black tracking-widest"
                    style={{ color: '#c9a227', textShadow: '0 0 20px rgba(201,162,39,0.6), 0 2px 4px rgba(0,0,0,0.9)' }}>
                  {announcement}
                </h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Can't-play reason toast ───────────────────────────────────── */}
        <AnimatePresence>
          {cantPlayReason && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 pointer-events-none whitespace-nowrap"
              style={{
                background: 'linear-gradient(180deg, rgba(30,8,8,0.97) 0%, rgba(20,4,4,0.97) 100%)',
                border: '1px solid rgba(220,60,60,0.65)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.85), 0 0 14px rgba(200,50,50,0.2)',
              }}
            >
              <span className="font-display text-sm font-bold tracking-widest" style={{ color: '#e07070' }}>
                ✕  {cantPlayReason}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Action + Hand Bar ──────────────────────────────────────────── */}
      <div className="shrink-0 z-20 relative flex flex-col"
           style={{
             height: 320,
             background: 'linear-gradient(0deg, #080504 0%, #0d0906 100%)',
             borderTop: '2px solid #3a2800',
             boxShadow: '0 -4px 24px rgba(0,0,0,0.7), 0 -1px 0 rgba(201,162,39,0.12)',
           }}>

        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.35) 20%, rgba(201,162,39,0.35) 80%, transparent)' }} />

        {/* Action buttons + pending spells row */}
        <div className="h-12 flex items-center justify-between gap-2 px-4 shrink-0">
          {/* Left: pending spells queue */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
            {me.pendingSpells.length > 0 && (
              <>
                <span className="text-[7px] font-display uppercase tracking-wider shrink-0" style={{ color: 'rgba(200,60,60,0.7)' }}>
                  ⚡ Combat:
                </span>
                {me.pendingSpells.map(s => (
                  <PendingSpellBadge key={s.instanceId} spell={s} />
                ))}
              </>
            )}
          </div>

          {/* Center: action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {gameState.targetingMode !== 'none' && (
              <button
                onClick={() => dispatch({ type: 'CLEAR_TARGETING' })}
                className="btn-fantasy px-3 py-1 text-[10px]"
                style={{ borderColor: 'rgba(180,50,50,0.7)', color: '#e05050' }}
              >
                ✕ Cancel
              </button>
            )}
            {isMyTurn && gameState.phase === 'buy' && (
              <button
                onClick={() => dispatch({ type: 'TOGGLE_SHOP', payload: !gameState.shopOpen })}
                className="btn-fantasy px-3 py-1 text-[10px] flex items-center gap-1.5"
              >
                <ShoppingCart size={11} />
                The Shop
                {buyPhaseTimeLeft !== null && (
                  <span className={`font-mono text-[10px] ${buyPhaseTimeLeft <= 10 ? 'text-red-400 animate-pulse' : ''}`}>
                    [{buyPhaseTimeLeft}s]
                  </span>
                )}
              </button>
            )}
            {isMyTurn && ['buy','main','combat'].includes(gameState.phase) && (
              <button
                onClick={endPhase}
                className="btn-fantasy btn-fantasy-primary px-5 py-1 text-[11px]"
              >
                End {gameState.phase} ›
              </button>
            )}
          </div>

          {/* Right: type limit indicators */}
          {isMyTurn && gameState.phase === 'main' && (
            <div className="flex items-center gap-1 shrink-0">
              {(['character','spell','artifact','enchantment'] as const).map(type => {
                const used = !!me.cardsPlayedByType[type];
                const colors: Record<string,string> = { character:'#4a7ae0', spell:'#e04040', artifact:'#c9a227', enchantment:'#4aaa60' };
                return (
                  <div key={type}
                       className="text-[6px] font-display uppercase px-1 py-0.5 border leading-none"
                       style={{
                         borderColor: used ? `${colors[type]}40` : `${colors[type]}80`,
                         color: used ? `${colors[type]}40` : colors[type],
                         textDecoration: used ? 'line-through' : 'none',
                         background: used ? 'rgba(0,0,0,0.3)' : `${colors[type]}10`,
                       }}>
                    {type.slice(0,3)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hand area + Artifact drop zone */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* ── Artifact Drop Slot ── */}
          {(() => {
            const artifactLocked = me.artifactSlot !== null && me.artifactSlotTurns < 2;
            const canDrop = isMyTurn && gameState.phase === 'main'
              && !me.cardsPlayedByType['artifact']
              && !(me.artifactSlot !== null && me.artifactSlotTurns < 2);

            const handleArtifactDrop = (e: React.DragEvent) => {
              e.preventDefault();
              setRelicDragOver(false);
              if (!canDrop) return;
              // Accept artifact cards from hand
              const cardId = e.dataTransfer.getData('artifactCardId');
              if (cardId) { playCard(cardId); return; }
              // Accept items from inventory
              const invId = e.dataTransfer.getData('inventoryItemId');
              if (invId) { equipInventoryItem(invId); return; }
            };

            return (
              <div className="flex flex-col items-center justify-center shrink-0 px-2 gap-1"
                   style={{ width: 100, borderRight: '1px solid rgba(74,48,0,0.3)' }}>
                <div className="text-[7px] font-display uppercase tracking-wider"
                     style={{ color: 'rgba(200,140,60,0.65)' }}>Artifact Slot</div>

                {me.artifactSlot ? (
                  /* Equipped artifact */
                  <div className="relative w-20"
                       style={{
                         background: 'linear-gradient(180deg, #241600, #180e00)',
                         border: `2px solid ${artifactLocked ? 'rgba(180,80,80,0.7)' : 'rgba(200,140,60,0.7)'}`,
                         boxShadow: artifactLocked
                           ? '0 0 8px rgba(180,80,80,0.3)'
                           : '0 0 14px rgba(200,140,60,0.5)',
                         minHeight: 96,
                         padding: '6px',
                       }}
                       title={me.artifactSlot.description}>
                    <div className="flex flex-col items-center gap-0.5">
                      <Package size={14} style={{ color: '#c9a227' }} />
                      <span className="text-[7px] font-display font-bold text-amber-200 text-center leading-tight w-full truncate">
                        {me.artifactSlot.name}
                      </span>
                      <span className="text-[6px] italic text-amber-700 text-center leading-tight w-full" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {me.artifactSlot.description?.slice(0, 36)}
                      </span>
                      {artifactLocked ? (
                        <span className="text-[7px] font-display text-red-400 mt-0.5">
                          🔒 {2 - me.artifactSlotTurns}t left
                        </span>
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(!isMyTurn || gameState.phase !== 'main') ? undefined : sellArtifact}
                          title={`Unequip & sell for ${me.artifactSlot.cost * 75}g`}
                          className="mt-1 px-2 py-0.5 text-[7px] font-display font-bold cursor-pointer hover:opacity-80 transition-opacity select-none"
                          style={{
                            background: 'rgba(100,60,0,0.9)',
                            border: '1px solid rgba(201,162,39,0.6)',
                            color: '#c9a227',
                            opacity: (!isMyTurn || gameState.phase !== 'main') ? 0.3 : 1,
                          }}
                        >
                          Sell {me.artifactSlot.cost * 75}g
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty drop zone */
                  <div
                    onDragOver={(e) => { if (canDrop) { e.preventDefault(); setRelicDragOver(true); } }}
                    onDragLeave={() => setRelicDragOver(false)}
                    onDrop={handleArtifactDrop}
                    className="w-20 flex flex-col items-center justify-center gap-1 transition-all duration-150"
                    style={{
                      minHeight: 96,
                      border: relicDragOver
                        ? '2px solid rgba(200,140,60,0.9)'
                        : '2px dashed rgba(200,140,60,0.3)',
                      background: relicDragOver
                        ? 'rgba(200,140,60,0.12)'
                        : 'rgba(200,140,60,0.03)',
                      boxShadow: relicDragOver ? '0 0 14px rgba(200,140,60,0.5)' : 'none',
                    }}
                  >
                    <Package size={18} style={{ color: relicDragOver ? 'rgba(200,140,60,0.9)' : 'rgba(200,140,60,0.25)' }} />
                    <span className="text-[6px] font-display text-center leading-tight"
                          style={{ color: relicDragOver ? 'rgba(200,140,60,0.9)' : 'rgba(200,140,60,0.25)' }}>
                      {canDrop ? 'Drop Artifact' : 'Empty'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Hand cards ── */}
          <div className="flex-1 overflow-x-auto overflow-y-visible min-h-0">
            <div className="flex justify-center items-end min-w-max h-full px-4 pb-2 pt-1 gap-1">
              {me.hand.map((card, index) => {
                const offset = index - (me.hand.length - 1) / 2;
                const rotation = me.hand.length > 5 ? offset * 3 : 0;
                const translateY = me.hand.length > 5 ? Math.abs(offset) * 4 : 0;
                const typeUsed = !!me.cardsPlayedByType[card.type];
                const isStaged = me.pendingSpells.some(s => s.instanceId === card.instanceId);
                const canAfford = me.aether >= card.cost;
                const artifactLocked = card.type === 'artifact' && me.artifactSlot !== null && me.artifactSlotTurns < 2;
                const fieldFull = card.type === 'character' && me.field.length >= 4;
                const playable = isMyTurn && gameState.phase === 'main' && canAfford && !typeUsed && !artifactLocked && !fieldFull;
                const canSellFromHand = isMyTurn && (gameState.phase === 'main' || gameState.phase === 'buy');
                const rarityMult = card.rarity === 'legendary' || card.rarity === 'secret' ? 50 : card.rarity === 'rare' ? 35 : 20;
                const handSellPrice = Math.max(10, card.cost * rarityMult);
                const isDraggableArtifact = card.type === 'artifact' && playable;

                return (
                  <div key={card.instanceId}
                       style={{ transform: `rotate(${rotation}deg) translateY(${translateY}px)` }}
                       className="transition-transform duration-200 relative"
                       draggable={isDraggableArtifact}
                       onDragStart={(e) => {
                         if (isDraggableArtifact) {
                           e.dataTransfer.setData('artifactCardId', card.instanceId);
                           e.dataTransfer.effectAllowed = 'move';
                         }
                       }}>
                    <HandCardUI
                      card={card}
                      playable={playable}
                      staged={isStaged}
                      onClick={() => handleCardClick(card)}
                    />
                    {isDraggableArtifact && (
                      <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-0.5 pointer-events-none"
                           style={{ background: 'linear-gradient(0deg, rgba(200,140,60,0.25), transparent)' }}>
                        <span className="text-[5px] font-display uppercase tracking-wider"
                              style={{ color: 'rgba(200,140,60,0.7)' }}>drag to equip</span>
                      </div>
                    )}
                    {canSellFromHand && (
                      <button
                        onClick={(e) => { e.stopPropagation(); sellHandCard(card.instanceId); }}
                        title={`Discard for ${handSellPrice}g`}
                        className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[7px] font-bold hover:opacity-90 transition-opacity z-20"
                        style={{
                          background: 'rgba(80,40,0,0.97)',
                          border: '1px solid rgba(201,162,39,0.6)',
                          color: '#c9a227',
                          boxShadow: '0 0 4px rgba(201,162,39,0.3)',
                        }}
                      >
                        $
                      </button>
                    )}
                  </div>
                );
              })}
              {me.hand.length === 0 && (
                <div className="font-display text-lg tracking-[0.4em] uppercase select-none mb-4"
                     style={{ color: 'rgba(74,48,0,0.4)' }}>
                  — Hand Empty —
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Combat phase hint */}
        {isMyTurn && gameState.phase === 'combat' && me.pendingSpells.length > 0 && (
          <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
            <div className="px-3 py-0.5 text-[8px] font-display uppercase tracking-wider"
                 style={{ background: 'rgba(180,30,30,0.9)', color: '#ffaaaa' }}>
              ⚡ Spells firing...
            </div>
          </div>
        )}
      </div>

      {/* ── Game Log ────────────────────────────────────────────────────── */}
      <div className={`absolute bottom-56 right-3 z-40 flex flex-col items-end transition-transform duration-300 ${logOpen ? 'translate-x-0' : 'translate-x-[calc(100%-36px)]'}`}
           style={{ bottom: 280 }}>
        <div className="flex items-start">
          <button
            onClick={() => { sounds.play('uiClick'); setLogOpen(!logOpen); }}
            className="w-9 h-9 btn-fantasy flex items-center justify-center"
          >
            <ScrollText size={15} />
          </button>
          <div className="w-56 max-h-52 overflow-y-auto flex flex-col gap-1 p-2"
               style={{ background: 'rgba(8,5,2,0.93)', border: '1px solid #3a2800', borderLeft: 'none' }}>
            <h4 className="text-[9px] font-display uppercase tracking-widest pb-1 mb-0.5"
                style={{ borderBottom: '1px solid rgba(74,48,0,0.4)', color: '#7a6040' }}>
              Chronicle
            </h4>
            {gameState.log.map(entry => (
              <div key={entry.id} className="text-[9px] flex gap-1.5 items-start leading-tight">
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0
                  ${entry.type==='damage' ? 'bg-red-600' : ''}
                  ${entry.type==='card'   ? 'bg-amber-500' : ''}
                  ${entry.type==='gold'   ? 'bg-yellow-500' : ''}
                  ${entry.type==='other'  ? 'bg-stone-500' : ''}
                `} />
                <span style={{ color: '#a89060' }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Achievement Toast ────────────────────────────────────────────── */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="absolute left-3 z-50 flex items-center gap-3 p-3"
            style={{
              bottom: 290,
              background: 'linear-gradient(135deg, rgba(20,12,2,0.97), rgba(14,8,2,0.97))',
              border: '2px solid rgba(201,162,39,0.5)',
              boxShadow: '0 0 20px rgba(201,162,39,0.2)',
            }}
          >
            <div className="w-8 h-8 flex items-center justify-center border"
                 style={{ background: 'rgba(201,162,39,0.1)', borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}>
              <Info size={16} />
            </div>
            <div>
              <div className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#c9a227' }}>Achievement Unlocked</div>
              <div className="text-sm font-display font-bold" style={{ color: '#f0d888' }}>{achievementToast.split(': ')[1]}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shop Panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.shopOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="absolute top-14 right-0 w-72 flex flex-col z-40"
            style={{
              bottom: 0,
              background: 'linear-gradient(180deg, #0d0906 0%, #090604 100%)',
              borderLeft: '2px solid #3a2800',
              boxShadow: '-8px 0 24px rgba(0,0,0,0.8)',
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 shrink-0"
                 style={{ background: 'linear-gradient(180deg, #110d07, #0d0906)', borderBottom: '1px solid #3a2800' }}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={14} style={{ color: '#c9a227' }} />
                <h3 className="font-display text-sm font-bold" style={{ color: '#c9a227', letterSpacing: '0.15em' }}>
                  The Arcanist's Market
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[9px]" style={{ color: '#7a6040' }}>
                  <RefreshCw size={9} />
                  <span className={shopRotationTimeLeft <= 30 ? 'text-amber-400 animate-pulse' : ''}>
                    {formatTime(shopRotationTimeLeft)}
                  </span>
                </div>
                <button onClick={() => dispatch({ type: 'TOGGLE_SHOP', payload: false })}
                        className="text-sm hover:opacity-70 transition-opacity"
                        style={{ color: '#7a6040' }}>✕</button>
              </div>
            </div>

            {buyPhaseTimeLeft !== null && (
              <div className="h-0.5 shrink-0" style={{ background: 'rgba(74,48,0,0.3)' }}>
                <div className="h-full transition-all duration-1000"
                     style={{
                       width: `${(buyPhaseTimeLeft / 30) * 100}%`,
                       background: buyPhaseTimeLeft <= 10
                         ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                         : 'linear-gradient(90deg, #92701a, #c9a227)',
                     }} />
              </div>
            )}

            <div className="flex shrink-0" style={{ borderBottom: '1px solid #2a1e0a' }}>
              {(['items','perks','artifacts','cards'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { sounds.play('uiClick'); setShopTab(tab); }}
                  className="flex-1 py-1.5 text-[8px] font-display uppercase tracking-wider transition-all border-b-2"
                  style={{
                    borderColor: shopTab === tab ? '#c9a227' : 'transparent',
                    background: shopTab === tab ? 'rgba(201,162,39,0.08)' : 'transparent',
                    color: shopTab === tab ? '#c9a227' : '#5a4020',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              {visibleShopItems.length === 0 && (
                <div className="text-center py-8 font-display text-xs italic" style={{ color: '#5a4020' }}>
                  No wares this rotation.<br />Refreshes in {formatTime(shopRotationTimeLeft)}.
                </div>
              )}
              {visibleShopItems.map(item => {
                const canAfford = me.gold >= item.cost;
                const owned = isOwnedItem(item);
                const disabled = !canAfford || owned || gameState.phase !== 'buy';
                const isPerk     = item.type === 'perk';
                const isStat     = item.type === 'stat';
                const isArtifact = item.type === 'artifact';
                const isCard     = item.type === 'card';
                const isItem     = item.type === 'item';
                const frameGlow  = isPerk ? 'rgba(120,60,220,0.6)' : isStat ? 'rgba(60,160,220,0.6)' : isArtifact ? 'rgba(200,140,60,0.8)' : isCard ? 'rgba(80,130,220,0.6)' : 'rgba(200,120,30,0.6)';
                const frameBar   = isPerk ? '#3a1860' : isStat ? '#143060' : isArtifact ? '#2a1a00' : isCard ? '#102060' : '#2a1200';
                const frameBg    = isPerk ? '#130a20' : isStat ? '#080f1e' : isArtifact ? '#1a0e00' : isCard ? '#080f1e' : '#120800';
                const typeLabel  = isPerk ? 'PERK' : isStat ? 'PASSIVE' : isArtifact ? 'ARTIFACT' : isCard ? 'CARD' : 'ITEM';
                const typeColor  = isPerk ? '#b070ff' : isStat ? '#60b0ff' : '#c9a227';
                const hasCardArt = (isArtifact || isCard) && item.cardTemplateId;
                const cardTpl    = hasCardArt ? CARD_TEMPLATES.find(t => t.templateId === item.cardTemplateId) : null;
                return (
                  <div key={item.id}
                       className="relative flex flex-col overflow-hidden"
                       style={{
                         background: frameBg,
                         border: `1.5px solid ${owned ? 'rgba(201,162,39,0.35)' : canAfford ? frameGlow : 'rgba(30,20,10,0.5)'}`,
                         boxShadow: canAfford && !owned ? `0 0 8px ${frameGlow}` : 'none',
                         opacity: canAfford || owned ? 1 : 0.45,
                       }}>
                    {/* Header bar */}
                    <div className="flex items-center justify-between px-2 py-1" style={{ background: frameBar }}>
                      <span className="font-display font-bold text-[9px] leading-tight truncate" style={{ color: '#e8d080', maxWidth: 110 }}>
                        {item.name}
                      </span>
                      <span className="font-display font-bold text-[8px] ml-1 shrink-0"
                            style={{ color: '#c9a227', background: 'rgba(0,0,0,0.4)', padding: '0 4px' }}>
                        {item.cost.toLocaleString()}g
                      </span>
                    </div>
                    {/* Art area */}
                    <div className="h-16 w-full relative overflow-hidden"
                         style={{ background: `linear-gradient(180deg, ${frameBg}ee, #050300)` }}>
                      {hasCardArt && cardTpl ? (
                        <CardArt templateId={item.cardTemplateId!} type={cardTpl.type} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {isPerk && <Sparkles size={30} style={{ color: 'rgba(176,112,255,0.3)' }} />}
                          {isStat && <Activity size={30} style={{ color: 'rgba(96,176,255,0.3)' }} />}
                          {isItem && <Package size={30} style={{ color: 'rgba(200,140,60,0.28)' }} />}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-5"
                           style={{ background: `linear-gradient(0deg, ${frameBg}, transparent)` }} />
                    </div>
                    {/* Type badge row */}
                    <div className="flex items-center gap-1 px-2 pt-1">
                      <span className="text-[7px] font-display font-bold uppercase tracking-wider px-1 rounded-sm"
                            style={{
                              background: isPerk ? 'rgba(120,60,220,0.2)' : isStat ? 'rgba(60,160,220,0.2)' : 'rgba(200,140,60,0.2)',
                              color: typeColor,
                              border: `1px solid ${isPerk ? 'rgba(120,60,220,0.3)' : isStat ? 'rgba(60,160,220,0.3)' : 'rgba(200,140,60,0.3)'}`,
                            }}>
                        {typeLabel}
                      </span>
                      {item.stackable && (
                        <span className="text-[7px] font-display uppercase" style={{ color: '#5db860' }}>STACKABLE</span>
                      )}
                      {owned && (
                        <span className="text-[7px] font-display uppercase ml-auto" style={{ color: '#c9a227' }}>OWNED</span>
                      )}
                    </div>
                    {/* Description */}
                    <p className="px-2 pb-1.5 pt-0.5 text-[8px] leading-snug italic" style={{ color: '#8a7050' }}>
                      {item.description}
                    </p>
                    {/* Buy button */}
                    <button
                      disabled={disabled}
                      onClick={() => buyItem(item.id)}
                      className="btn-fantasy py-0.5 text-[8px] w-full rounded-none"
                      style={owned ? { borderColor: 'rgba(74,48,0,0.3)', color: '#5a4020', cursor: 'not-allowed' } : {}}
                    >
                      {owned ? 'Owned' : gameState.phase !== 'buy' ? 'Buy Phase Only' : !canAfford ? 'Need Gold' : 'Purchase'}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inventory Panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.inventoryOpen && (
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="absolute top-14 left-0 w-64 flex flex-col z-40"
            style={{
              bottom: 0,
              background: 'linear-gradient(180deg, #0d0906 0%, #090604 100%)',
              borderRight: '2px solid #3a2800',
              boxShadow: '8px 0 24px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 shrink-0"
                 style={{ background: 'linear-gradient(180deg, #110d07, #0d0906)', borderBottom: '1px solid #3a2800' }}>
              <h3 className="font-display text-sm font-bold flex items-center gap-2" style={{ color: '#c9a227', letterSpacing: '0.12em' }}>
                <Package size={14} style={{ color: '#c9a227' }} /> Satchel
              </h3>
              <button onClick={() => dispatch({ type: 'TOGGLE_INVENTORY', payload: false })}
                      className="hover:opacity-70 transition-opacity text-sm"
                      style={{ color: '#5a4020' }}>✕</button>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0" style={{ borderBottom: '1px solid #2a1e0a' }}>
              {(['items', 'perks'] as const).map(t => (
                <button key={t}
                  onClick={() => setInvTab(t)}
                  className="flex-1 py-1.5 text-[9px] font-display uppercase tracking-wider transition-all border-b-2"
                  style={{
                    borderColor: invTab === t ? '#c9a227' : 'transparent',
                    background: invTab === t ? 'rgba(201,162,39,0.08)' : 'transparent',
                    color: invTab === t ? '#c9a227' : '#5a4020',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── Items tab — card grid ── */}
            {invTab === 'items' && (
              <div className="flex-1 overflow-y-auto p-2">
                {(() => {
                  // Show only non-stat items (stat items appear in Perks tab)
                  const invItems = me.inventory.filter(i => i.type !== 'stat');
                  if (invItems.length === 0) {
                    return (
                      <div className="text-center py-8 font-display text-xs italic" style={{ color: '#5a4020' }}>
                        Your satchel is empty.<br />Buy items from the shop.
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col gap-2">
                      {invItems.map(item => {
                        const isStatItem = item.type === 'stat';
                        const isPassive = item.effectKey === 'ironheart' || isStatItem;
                        const canUse = !isPassive && isMyTurn && gameState.phase === 'main';
                        const frameBar  = isPassive ? '#143060' : '#2a1600';
                        const frameBg   = isPassive ? '#060e1c' : '#0d0800';
                        const typeColor = isPassive ? '#60b0ff' : '#c9a227';
                        return (
                          <div key={item.instanceId}
                               className="relative flex flex-col overflow-hidden"
                               style={{
                                 background: frameBg,
                                 border: `1.5px solid ${canUse ? 'rgba(200,140,60,0.8)' : isPassive ? 'rgba(60,160,220,0.3)' : 'rgba(74,48,0,0.4)'}`,
                                 boxShadow: canUse ? '0 0 8px rgba(200,140,60,0.35)' : 'none',
                                 cursor: canUse ? 'pointer' : 'default',
                               }}
                               onClick={() => canUse && handleInventoryClick(item)}>
                            {/* Header bar */}
                            <div className="flex items-center justify-between px-2 py-1" style={{ background: frameBar }}>
                              <span className="font-display font-bold text-[10px] leading-tight truncate" style={{ color: '#e8d080', maxWidth: 130 }}>{item.name}</span>
                              {isPassive ? <Activity size={9} style={{ color: typeColor, flexShrink: 0 }} /> : <Package size={9} style={{ color: typeColor, flexShrink: 0 }} />}
                            </div>
                            {/* Art area */}
                            <div className="h-14 w-full flex items-center justify-center relative overflow-hidden"
                                 style={{ background: isPassive ? 'linear-gradient(180deg,#0a1528,#060e1c)' : 'linear-gradient(180deg,#1e0e02,#100800)' }}>
                              {isPassive
                                ? <Activity size={28} style={{ color: 'rgba(96,176,255,0.3)' }} />
                                : <Package size={28} style={{ color: 'rgba(200,140,60,0.28)' }} />}
                              <div className="absolute inset-x-0 bottom-0 h-4"
                                   style={{ background: `linear-gradient(0deg, ${frameBg}, transparent)` }} />
                            </div>
                            {/* Type badge */}
                            <div className="px-2 pt-1 flex items-center gap-1">
                              <span className="text-[7px] font-display uppercase tracking-wider px-1 rounded-sm"
                                    style={{ background: isPassive ? 'rgba(60,160,220,0.15)' : 'rgba(200,140,60,0.12)', color: typeColor, border: `1px solid ${isPassive ? 'rgba(60,160,220,0.25)' : 'rgba(200,140,60,0.2)'}` }}>
                                {isPassive ? 'PASSIVE' : 'ITEM'}
                              </span>
                            </div>
                            {/* Description */}
                            <p className="px-2 pb-1.5 pt-0.5 text-[8px] leading-snug italic" style={{ color: '#8a7050' }}>{item.description}</p>
                            {/* Use button */}
                            {canUse && (
                              <button className="btn-fantasy py-0.5 text-[8px] w-full rounded-none"
                                      onClick={(e) => { e.stopPropagation(); handleInventoryClick(item); }}>
                                Use
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Perks tab — owned perks + stat items ── */}
            {invTab === 'perks' && (
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                {/* Stat items (passive field buffs) */}
                {me.inventory.filter(i => i.type === 'stat').map(item => (
                  <div key={item.instanceId} className="flex flex-col overflow-hidden"
                       style={{ background: '#080f1e', border: '1px solid rgba(60,160,220,0.25)' }}>
                    <div className="flex items-center gap-1.5 px-2 py-1"
                         style={{ background: '#143060', borderBottom: '1px solid rgba(60,160,220,0.2)' }}>
                      <Activity size={9} style={{ color: '#60b0ff', flexShrink: 0 }} />
                      <span className="font-display font-bold text-[9px] truncate" style={{ color: '#90d0ff' }}>
                        {item.name}
                      </span>
                      <span className="text-[7px] font-display ml-auto shrink-0 uppercase"
                            style={{ color: 'rgba(96,176,255,0.6)' }}>ACTIVE</span>
                    </div>
                    <p className="px-2 py-1 text-[8px] italic leading-snug" style={{ color: '#5080a0' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
                {/* Perk items (permanent player upgrades) */}
                {me.perks.map((perkKey, idx) => {
                  const perkDef = SHOP_ITEMS.find(i => i.effectKey === perkKey);
                  if (!perkDef) return null;
                  return (
                    <div key={idx} className="flex flex-col overflow-hidden"
                         style={{ background: '#130a20', border: '1px solid rgba(120,60,220,0.25)' }}>
                      <div className="flex items-center gap-1.5 px-2 py-1"
                           style={{ background: '#3a1860', borderBottom: '1px solid rgba(120,60,220,0.2)' }}>
                        <Sparkles size={9} style={{ color: '#b070ff', flexShrink: 0 }} />
                        <span className="font-display font-bold text-[9px] truncate" style={{ color: '#d090ff' }}>
                          {perkDef.name}
                        </span>
                        <span className="text-[7px] font-display ml-auto shrink-0 uppercase"
                              style={{ color: 'rgba(176,112,255,0.6)' }}>PERK</span>
                      </div>
                      <p className="px-2 py-1 text-[8px] italic leading-snug" style={{ color: '#7050a0' }}>
                        {perkDef.description}
                      </p>
                    </div>
                  );
                })}
                {me.inventory.filter(i => i.type === 'stat').length === 0 && me.perks.length === 0 && (
                  <div className="text-center py-8 font-display text-xs italic" style={{ color: '#5a4020' }}>
                    No perks yet.<br />Buy from the Perks tab in the shop.
                  </div>
                )}
              </div>
            )}

            {/* Footer hint */}
            <div className="px-3 py-2 shrink-0 text-[9px] italic"
                 style={{ color: '#5a4020', borderTop: '1px solid rgba(74,48,0,0.3)', background: 'rgba(8,5,2,0.5)' }}>
              {invTab === 'items'
                ? <>Items are <span style={{ color: '#c9a227' }}>passive</span> or click to <span style={{ color: '#c9a227' }}>use</span> during Main phase.</>
                : <>Perks &amp; passives are always active.</>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draft Overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.phase === 'draft' && gameState.draftOptions.length > 0 && isMyTurn && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(8,5,2,0.92)' }}
          >
            <div className="text-[10px] font-display uppercase tracking-[0.5em] mb-2" style={{ color: '#7a6040' }}>
              Choose one card to add to your hand
            </div>
            <h2 className="text-2xl font-display font-black mb-8" style={{ color: '#c9a227', letterSpacing: '0.1em' }}>
              DRAFT PHASE
            </h2>
            <div className="flex gap-6 items-start flex-wrap justify-center px-6">
              {gameState.draftOptions.map(card => {
                const frame = TYPE_FRAME[card.type] || TYPE_FRAME.character;
                return (
                  <motion.div
                    key={card.templateId}
                    whileHover={{ scale: 1.08, y: -8 }}
                    onClick={() => pickDraftCard(card)}
                    className="w-32 border-2 cursor-pointer flex flex-col overflow-hidden transition-colors"
                    style={{
                      background: frame.bg,
                      borderColor: card.rarity === 'secret' ? '#e040fb' : card.rarity === 'legendary' ? '#c9a227' : card.rarity === 'rare' ? '#9c4bdc' : 'rgba(74,48,0,0.8)',
                      boxShadow: card.rarity === 'secret' ? '0 0 20px rgba(224,64,251,0.6)' : card.rarity === 'legendary' ? '0 0 15px rgba(201,162,39,0.7)' : card.rarity === 'rare' ? '0 0 12px rgba(160,80,220,0.5)' : 'none',
                      height: 192,
                    }}
                  >
                    <div className="h-8 flex items-center justify-between px-1.5 shrink-0" style={{ background: `${frame.bar}dd` }}>
                      <span className="text-[9px] font-display font-bold text-amber-100 truncate">{card.name}</span>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white shrink-0"
                           style={{ background: '#2a1a00', border: '1px solid #c9a227' }}>{card.cost}</div>
                    </div>
                    <div className="h-20 w-full shrink-0">
                      <CardArt templateId={card.templateId} type={card.type} artTheme={(card as any).artTheme} />
                    </div>
                    <div className="flex-1 p-1 text-[7px] leading-tight overflow-hidden" style={{ background: '#120e06', color: '#cbb888' }}>
                      <div className="font-display uppercase text-[6px] mb-0.5" style={{ color: frame.bar }}>
                        {card.type} · {card.rarity}
                        {card.atk !== undefined && <span> · {card.atk}/{card.def}</span>}
                      </div>
                      {card.description}
                    </div>
                    <div className="h-6 flex items-center justify-center text-[7px] font-display font-bold uppercase tracking-wider"
                         style={{ background: 'rgba(201,162,39,0.08)', borderTop: '1px solid rgba(74,48,0,0.4)', color: '#c9a227' }}>
                      SELECT
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Multiplayer Death Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {me.hp <= 0 && gameState.matchType === 'multiplayer' && gameState.phase !== 'gameover' && !isSpectating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(4,2,1,0.92)' }}
          >
            <div className="text-center flex flex-col items-center gap-5 p-10 max-w-sm w-full"
                 style={{ background: 'linear-gradient(180deg, #140c04 0%, #0d0804 100%)', border: '2px solid rgba(180,40,40,0.6)' }}>
              <div className="text-3xl">☠</div>
              <h2 className="text-4xl font-display font-black" style={{ color: '#b02828', letterSpacing: '0.05em' }}>DEFEATED</h2>
              <p className="text-sm italic" style={{ color: '#7a6040' }}>
                The battle rages on. You may spectate or return to the main hall.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsSpectating(true)}
                  className="btn-fantasy flex-1 py-3 text-sm"
                >
                  Spectate
                </button>
                <button
                  onClick={() => setLocation('/')}
                  className="btn-fantasy flex-1 py-3 text-sm"
                  style={{ borderColor: 'rgba(74,48,0,0.5)' }}
                >
                  Quit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Spectating Banner ─────────────────────────────────────────────── */}
      {isSpectating && me.hp <= 0 && gameState.phase !== 'gameover' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 pointer-events-auto"
             style={{ background: 'rgba(30,18,4,0.95)', border: '1px solid rgba(201,162,39,0.4)' }}>
          <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#c9a227' }}>
            👁 Spectating
          </span>
          <button onClick={() => setLocation('/')} className="text-[9px] font-display uppercase text-muted-foreground hover:text-foreground border border-border px-2 py-0.5">
            Quit
          </button>
        </div>
      )}

      {/* ── Countdown Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(8,5,2,0.92)' }}
          >
            <div className="text-[10px] font-display uppercase tracking-[0.5em] mb-4" style={{ color: '#7a6040' }}>
              The match begins in
            </div>
            <motion.div
              key={countdown}
              initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="font-display font-black"
              style={{ fontSize: '10rem', lineHeight: 1, color: '#c9a227', textShadow: '0 0 60px rgba(201,162,39,0.5), 0 4px 8px rgba(0,0,0,0.9)' }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Game Over Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState.phase === 'gameover' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            style={{ background: 'rgba(4,2,1,0.96)' }}
          >
            <div className="text-center flex flex-col items-center gap-5 p-10 max-w-md w-full relative"
                 style={{
                   background: 'linear-gradient(180deg, #140c04 0%, #0d0804 100%)',
                   border: `2px solid ${isDefeated ? 'rgba(180,40,40,0.6)' : 'rgba(201,162,39,0.6)'}`,
                   boxShadow: `0 0 60px rgba(0,0,0,0.95), 0 0 30px ${isDefeated ? 'rgba(180,40,40,0.1)' : 'rgba(201,162,39,0.1)'}`,
                 }}>
              {['top-left','top-right','bottom-left','bottom-right'].map(corner => (
                <div key={corner}
                     className={`absolute w-8 h-8 pointer-events-none ${corner.includes('top') ? 'top-0' : 'bottom-0'} ${corner.includes('left') ? 'left-0' : 'right-0'}`}
                     style={{
                       borderTop: corner.includes('top') ? `2px solid ${isDefeated ? 'rgba(180,40,40,0.5)' : 'rgba(201,162,39,0.5)'}` : 'none',
                       borderBottom: corner.includes('bottom') ? `2px solid ${isDefeated ? 'rgba(180,40,40,0.5)' : 'rgba(201,162,39,0.5)'}` : 'none',
                       borderLeft: corner.includes('left') ? `2px solid ${isDefeated ? 'rgba(180,40,40,0.5)' : 'rgba(201,162,39,0.5)'}` : 'none',
                       borderRight: corner.includes('right') ? `2px solid ${isDefeated ? 'rgba(180,40,40,0.5)' : 'rgba(201,162,39,0.5)'}` : 'none',
                     }} />
              ))}

              <div className="text-2xl select-none" style={{ color: isDefeated ? 'rgba(180,40,40,0.5)' : 'rgba(201,162,39,0.5)' }}>
                {isDefeated ? '☠' : '✦'}
              </div>
              <h2 className="text-6xl font-display font-black leading-none"
                  style={{
                    color: isDefeated ? '#b02828' : '#c9a227',
                    textShadow: `0 0 30px ${isDefeated ? 'rgba(180,40,40,0.5)' : 'rgba(201,162,39,0.5)'}, 0 4px 8px rgba(0,0,0,0.9)`,
                    letterSpacing: '0.05em',
                  }}>
                {isDefeated ? 'DEFEATED' : 'VICTORY'}
              </h2>

              <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${isDefeated ? 'rgba(180,40,40,0.4)' : 'rgba(201,162,39,0.4)'}, transparent)` }} />

              <p className="text-sm italic leading-relaxed" style={{ color: '#7a6040', fontFamily: "'IM Fell English', Georgia, serif" }}>
                {isDefeated
                  ? '"Even the mightiest arcane warriors fall in battle. The realm endures."'
                  : '"The realm bows before your arcane mastery. Songs shall be sung of this victory."'}
              </p>

              <div className="w-full flex flex-col gap-2 text-left p-4"
                   style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,48,0,0.25)' }}>
                {[
                  { label: 'Turns Survived',  value: gameState.turn,                              color: '#c8b888' },
                  { label: 'Gold Earned',      value: `${(me.goldEarnedThisGame||0).toLocaleString()}g`, color: '#c9a227' },
                  { label: 'Characters Slain', value: me.creaturesKilledThisGame || 0,             color: '#e05050' },
                  { label: 'Cards Played',     value: me.cardsPlayedThisGame || 0,                 color: '#70a0c0' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs italic" style={{ color: '#5a4020' }}>{row.label}</span>
                    <span className="font-display font-bold text-sm" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 w-full">
                {!isDefeated && (
                  <button onClick={() => setLocation('/lobby')} className="btn-fantasy flex-1 py-3 text-sm">
                    Play Again
                  </button>
                )}
                <button onClick={() => setLocation('/')} className="btn-fantasy flex-1 py-3 text-sm"
                        style={{ borderColor: 'rgba(74,48,0,0.5)' }}>
                  Main Menu
                </button>
              </div>

              {isDefeated && (
                <p className="text-[10px] italic" style={{ color: 'rgba(74,48,0,0.6)' }}>
                  Return to the main hall to start anew.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
