import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Swords, Lock, CheckCircle2, X, ShoppingBag } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { useChallenger } from '../context/ChallengerContext';
import {
  CHALLENGERS,
  Challenger,
  RARITY_COLORS,
  RARITY_GLOW,
  RARITY_BG,
  RARITY_LABEL,
  CHALLENGER_RARITY_ORDER,
} from '../lib/challengers';
import { ChallengerSprite } from '../components/game/ChallengerSprite';

const FILTER_OPTIONS = ['All', 'Owned', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
type Filter = typeof FILTER_OPTIONS[number];

function formatShards(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface ChallengerModalProps {
  challenger: Challenger;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
  onClose: () => void;
}

function ChallengerModal({ challenger, owned, equipped, canAfford, onBuy, onEquip, onClose }: ChallengerModalProps) {
  const rarityColor = RARITY_COLORS[challenger.rarity];
  const rarityBg = RARITY_BG[challenger.rarity];
  const rarityGlow = RARITY_GLOW[challenger.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative max-w-sm w-full border-2 ${rarityColor.split(' ')[0]} ${rarityBg} ${rarityGlow} p-6 flex flex-col gap-4`}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1">
          <X size={18} />
        </button>

        {/* Sprite + Name */}
        <div className="text-center">
          <div className={`w-36 mx-auto mb-3 overflow-hidden border-2 ${rarityColor.split(' ')[0]} ${rarityGlow}`}>
            <ChallengerSprite challengerId={challenger.id} mode="full" className="w-full" />
          </div>
          <h2 className="text-2xl font-display text-foreground">{challenger.name}</h2>
          <p className={`text-sm font-semibold ${rarityColor.split(' ')[1]}`}>{challenger.title}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 border ${rarityColor} font-bold uppercase tracking-wider`}>
            {RARITY_LABEL[challenger.rarity]}
          </span>
        </div>

        {/* Flavor */}
        <p className="text-sm text-muted-foreground italic text-center">"{challenger.description}"</p>

        {/* Ability */}
        <div className={`border ${rarityColor.split(' ')[0]} p-4 ${rarityBg}`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${rarityColor.split(' ')[1]}`}>
            ⚡ {challenger.abilityName}
          </p>
          <p className="text-sm text-foreground leading-relaxed">{challenger.abilityDescription}</p>
        </div>

        {/* Achievement lock note */}
        {challenger.unlockedByAchievement && !owned && (
          <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
            <Lock size={12} /> Unlock via achievement — not purchasable
          </p>
        )}

        {/* Action */}
        {owned ? (
          <button
            onClick={() => { sounds.play('uiClick'); onEquip(); }}
            className={`w-full py-3 font-display font-bold text-lg transition-all ${
              equipped
                ? 'bg-green-700 border border-green-400 text-white'
                : 'bg-primary hover:bg-primary/90 border border-primary text-primary-foreground'
            }`}
          >
            {equipped ? '✓ EQUIPPED' : 'EQUIP'}
          </button>
        ) : challenger.unlockedByAchievement ? (
          <div className="text-center text-muted-foreground text-sm py-2">Complete the achievement to unlock</div>
        ) : (
          <button
            onClick={() => { sounds.play('uiClick'); onBuy(); }}
            disabled={!canAfford}
            className={`w-full py-3 font-display font-bold text-lg transition-all border flex items-center justify-center gap-2 ${
              canAfford
                ? 'bg-amber-700 hover:bg-amber-600 border-amber-400 text-white'
                : 'opacity-40 cursor-not-allowed border-border text-muted-foreground bg-secondary'
            }`}
          >
            <ShoppingBag size={18} />
            {canAfford ? `BUY — ${formatShards(challenger.cost)} Shards` : `Need ${formatShards(challenger.cost)} Shards`}
          </button>
        )}
      </div>
    </div>
  );
}

interface ChallengerCardProps {
  challenger: Challenger;
  owned: boolean;
  equipped: boolean;
  onClick: () => void;
}

function ChallengerCard({ challenger, owned, equipped, onClick }: ChallengerCardProps) {
  const rarityColor = RARITY_COLORS[challenger.rarity];
  const rarityBg = RARITY_BG[challenger.rarity];
  const rarityGlow = RARITY_GLOW[challenger.rarity];

  return (
    <button
      onClick={() => { sounds.play('uiClick'); onClick(); }}
      className={`relative flex flex-col items-center border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${
        equipped
          ? 'border-green-400 bg-green-950/40 shadow-[0_0_15px_rgba(74,222,128,0.4)]'
          : `${rarityColor.split(' ')[0]} ${rarityBg} ${owned ? rarityGlow : ''}`
      }`}
    >
      {/* Status badge */}
      <div className="absolute top-1.5 right-1.5 z-10">
        {equipped ? (
          <CheckCircle2 size={14} className="text-green-400 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
        ) : owned ? (
          <CheckCircle2 size={12} className="text-muted-foreground/60 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
        ) : challenger.unlockedByAchievement ? (
          <Lock size={12} className="text-amber-400 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
        ) : (
          <Lock size={12} className="text-muted-foreground/40 drop-shadow-[0_0_3px_rgba(0,0,0,0.9)]" />
        )}
      </div>

      {/* Sprite face */}
      <div className={`w-full ${!owned ? 'opacity-45 grayscale' : ''}`}>
        <ChallengerSprite challengerId={challenger.id} mode="face" className="w-full block" />
      </div>

      {/* Name + title */}
      <div className={`w-full text-center py-2 px-1.5 border-t ${rarityColor.split(' ')[0]}`} style={{ background: 'rgba(0,0,0,0.4)' }}>
        <p className="font-display text-sm text-foreground font-bold leading-tight truncate">{challenger.name}</p>
        <p className={`text-[10px] ${rarityColor.split(' ')[1]} leading-tight truncate`}>{challenger.title}</p>
      </div>
    </button>
  );
}

export default function ChallengersPage() {
  const [, setLocation] = useLocation();
  const { save, equippedChallenger, isOwned, isEquipped, buyChallenger, equipChallenger } = useChallenger();
  const [filter, setFilter] = useState<Filter>('All');
  const [selectedChallenger, setSelectedChallenger] = useState<Challenger | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBuy = (challenger: Challenger) => {
    if (buyChallenger(challenger.id)) {
      showToast(`${challenger.name} unlocked!`);
      // Auto-equip on purchase
      equipChallenger(challenger.id);
      setSelectedChallenger(null);
    } else {
      showToast('Not enough Arcane Shards!');
    }
  };

  const handleEquip = (challenger: Challenger) => {
    equipChallenger(challenger.id);
    setSelectedChallenger(null);
    const isNowEquipped = !isEquipped(challenger.id);
    showToast(isNowEquipped ? `${challenger.name} unequipped` : `${challenger.name} equipped!`);
  };

  const sortedChallengers = [...CHALLENGERS].sort((a, b) => {
    const ra = CHALLENGER_RARITY_ORDER.indexOf(a.rarity);
    const rb = CHALLENGER_RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return ra - rb;
    const ao = isOwned(a.id) ? 0 : 1;
    const bo = isOwned(b.id) ? 0 : 1;
    return ao - bo;
  });

  const filtered = sortedChallengers.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'Owned') return isOwned(c.id);
    return RARITY_LABEL[c.rarity] === filter;
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-amber-800 border border-amber-400 text-white px-6 py-3 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      {/* Modal */}
      {selectedChallenger && (
        <ChallengerModal
          challenger={selectedChallenger}
          owned={isOwned(selectedChallenger.id)}
          equipped={isEquipped(selectedChallenger.id)}
          canAfford={save.arcaneShards >= selectedChallenger.cost}
          onBuy={() => handleBuy(selectedChallenger)}
          onEquip={() => handleEquip(selectedChallenger)}
          onClose={() => setSelectedChallenger(null)}
        />
      )}

      {/* Header */}
      <header className="flex items-center gap-4 p-5 border-b border-border shrink-0">
        <button
          onClick={() => { sounds.play('uiClick'); setLocation('/'); }}
          className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)]">
            CHALLENGERS
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Select a Challenger to bring their power into battle</p>
        </div>
        {/* Shard balance */}
        <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-600/50 px-4 py-2">
          <span className="text-amber-400 text-lg">◆</span>
          <div>
            <p className="text-amber-300 font-bold text-base leading-none">{formatShards(save.arcaneShards)}</p>
            <p className="text-amber-600 text-[10px]">Arcane Shards</p>
          </div>
        </div>
      </header>

      {/* Equipped banner */}
      {equippedChallenger && (
        <div className="mx-5 mt-4 flex items-center gap-3 bg-green-950/40 border border-green-500/40 p-3">
          <span className="text-2xl">{equippedChallenger.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-300 font-bold">{equippedChallenger.name} <span className="font-normal text-green-500">{equippedChallenger.title}</span></p>
            <p className="text-xs text-muted-foreground truncate">⚡ {equippedChallenger.abilityName}: {equippedChallenger.abilityDescription.split('.')[0]}.</p>
          </div>
          <span className="text-xs text-green-400 font-bold border border-green-500 px-2 py-0.5 shrink-0">ACTIVE</span>
        </div>
      )}

      {/* Earn shards info */}
      <div className="mx-5 mt-2 flex items-center gap-2 bg-card border border-border px-3 py-2 text-xs text-muted-foreground">
        <Swords size={12} className="text-primary shrink-0" />
        Win games to earn <span className="text-amber-400 font-bold mx-1">150 Arcane Shards</span> per victory. Shards are used to unlock new Challengers.
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-5 mt-4 overflow-x-auto pb-1 shrink-0">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => { sounds.play('uiClick'); setFilter(f); }}
            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap border transition-colors ${
              filter === f
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(c => (
            <ChallengerCard
              key={c.id}
              challenger={c}
              owned={isOwned(c.id)}
              equipped={isEquipped(c.id)}
              onClick={() => setSelectedChallenger(c)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">No challengers match this filter.</div>
        )}
      </div>
    </div>
  );
}
