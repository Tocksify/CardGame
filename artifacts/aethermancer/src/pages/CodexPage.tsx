import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Lock, X, BookOpen } from 'lucide-react';
import { sounds } from '../lib/sounds';
import { useCodex } from '../context/CodexContext';
import { CARD_TEMPLATES, CardTemplate, CardRarity, CardType, getCardAbilities } from '../lib/cards';

// ── Visual theme config ──────────────────────────────────────────────────────
const THEME_CONFIG: Record<string, { emoji: string; gradient: string }> = {
  fire:      { emoji: '🔥', gradient: 'from-red-950 via-red-900 to-orange-900' },
  water:     { emoji: '💧', gradient: 'from-blue-950 via-blue-900 to-cyan-900' },
  earth:     { emoji: '🪨', gradient: 'from-stone-900 via-stone-800 to-green-950' },
  poison:    { emoji: '☠️', gradient: 'from-green-950 via-green-900 to-emerald-950' },
  frost:     { emoji: '❄️', gradient: 'from-sky-950 via-blue-900 to-indigo-950' },
  shadow:    { emoji: '🌑', gradient: 'from-purple-950 via-slate-900 to-gray-950' },
  void:      { emoji: '🌌', gradient: 'from-violet-950 via-purple-950 to-black' },
  aether:    { emoji: '✨', gradient: 'from-blue-900 via-indigo-900 to-blue-950' },
  iron:      { emoji: '⚙️', gradient: 'from-zinc-800 via-zinc-900 to-slate-900' },
  dragon:    { emoji: '🐉', gradient: 'from-red-950 via-rose-950 to-amber-950' },
  celestial: { emoji: '⭐', gradient: 'from-yellow-900 via-amber-900 to-yellow-950' },
  storm:     { emoji: '⛈️', gradient: 'from-slate-800 via-blue-950 to-slate-950' },
  electric:  { emoji: '⚡', gradient: 'from-yellow-900 via-amber-950 to-blue-950' },
  huntress:  { emoji: '🏹', gradient: 'from-green-900 via-amber-950 to-green-950' },
  unknown:   { emoji: '❓', gradient: 'from-gray-950 via-gray-900 to-black' },
  nature:    { emoji: '🌿', gradient: 'from-green-900 via-emerald-900 to-green-950' },
  blood:     { emoji: '🩸', gradient: 'from-red-950 via-rose-950 to-red-900' },
  crystal:   { emoji: '💎', gradient: 'from-cyan-900 via-sky-900 to-cyan-950' },
  wind:      { emoji: '🌬️', gradient: 'from-sky-800 via-blue-900 to-sky-950' },
  arcane:    { emoji: '🔮', gradient: 'from-purple-900 via-indigo-900 to-purple-950' },
  bone:      { emoji: '💀', gradient: 'from-gray-700 via-zinc-800 to-gray-900' },
  // fallbacks by card type
  spell:       { emoji: '🌟', gradient: 'from-violet-900 via-purple-900 to-indigo-950' },
  artifact:    { emoji: '🏺', gradient: 'from-amber-900 via-yellow-900 to-amber-950' },
  enchantment: { emoji: '🔵', gradient: 'from-blue-900 via-cyan-900 to-blue-950' },
  character:   { emoji: '👤', gradient: 'from-gray-800 via-gray-900 to-gray-950' },
};

// ── Rarity styling ────────────────────────────────────────────────────────────
const RARITY_STYLES: Record<CardRarity, { border: string; glow: string; badge: string; label: string; section: string }> = {
  common:    { border: 'border-gray-500/60',  glow: '',                                              badge: 'bg-gray-800 text-gray-300',    label: 'Common',    section: 'text-gray-400' },
  rare:      { border: 'border-purple-500/70', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.35)]',      badge: 'bg-purple-950 text-purple-300', label: 'Rare',      section: 'text-purple-400' },
  legendary: { border: 'border-amber-500/70',  glow: 'shadow-[0_0_10px_rgba(245,158,11,0.45)]',     badge: 'bg-amber-950 text-amber-300',   label: 'Legendary', section: 'text-amber-400' },
  secret:    { border: 'border-red-500/70',    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',        badge: 'bg-red-950 text-red-300',       label: 'Secret',    section: 'text-red-400' },
};

// ── Ability flavor text ───────────────────────────────────────────────────────
const ABILITY_FLAVOR: Record<string, [string, string, string]> = {
  fire:      ['Hurls a blazing ember, scorching the target.',       'Erupts in a column of searing flame.',                  'Triggers a volcanic apocalypse, incinerating all.'],
  water:     ['Crashes a wave into the target.',                    'Unleashes a raging torrent that floods the battlefield.', 'Summons a catastrophic maelstrom that obliterates.'],
  earth:     ['Hurls a chunk of stone at the target.',              'Shatters the ground, launching boulders at the target.',  'Triggers a full seismic tremor that cracks the world.'],
  poison:    ['Lashes the target with a venomous strike.',          'Bites deep and injects a plague into the target.',        'Detonates a toxic explosion engulfing everything.'],
  frost:     ['Fires a shard of ice at the target.',                'Blasts the target with a bolt of blizzard energy.',       'Drops the temperature to absolute zero, freezing all.'],
  shadow:    ['Strikes from the shadows, dealing swift damage.',    'Hurls a lance of pure darkness at the target.',           'Unleashes oblivion — a wave of nothingness.'],
  void:      ['Fires a null ray that disrupts the target.',         'Opens a rift in space that tears through the target.',    'Collapses dimensions, dealing crushing void damage.'],
  aether:    ['Fires a bolt of raw aetheric energy.',              'Erupts in an arcane nova, blasting the target.',          'Releases an aetheric cataclysm of pure power.'],
  iron:      ['Strikes with a reinforced iron fist.',               'Bashes the target with a shield-edge blow.',              'Crushes the target with a bastion-breaking strike.'],
  dragon:    ['Bites with ancient draconic jaws.',                  'Exhales a torrent of draconic flame.',                    'Channels ancient fury in a devastating assault.'],
  celestial: ['Smites the target with divine light.',               'Surges with holy energy, blasting the target.',           'Calls down celestial wrath upon the target.'],
  storm:     ['Strikes with a gale-force wind slash.',              'Hurls a charged thunder bolt at the target.',             'Conjures a devastating tempest that tears through all.'],
  electric:  ['Delivers a sharp electric shock.',                   'Channels arc lightning across the target.',               'Calls a thunderstrike of devastating voltage.'],
  huntress:  ['Looses a precise arrow at the target.',              'Fires a piercing shot that punches through armor.',       'Takes a perfect deadshot at vital points.'],
  unknown:   ['Strikes with unknowable force.',                     'Pulses with void energy from beyond.',                    'Annihilates the target with absolute power.'],
  nature:    ['Lashes the target with a vine whip.',                "Calls an overgrowth of thorns and roots upon the target.", "Invokes nature's fury in a devastating assault."],
  blood:     ['Drives a blood-soaked blade into the target.',       'Hemorrhages the target with a savage wound.',             'Triggers a bloodbath of unstoppable carnage.'],
  crystal:   ['Slashes with a razor-sharp crystal shard.',          'Bursts prismatic light across the target.',               'Unleashes a crystal annihilation — shards everywhere.'],
  wind:      ['Slashes the target with a gust of air.',             'Spins into a cyclone slash, striking hard.',              'Calls a hurricane that shatters the target.'],
  arcane:    ['Strikes with focused arcane force.',                 'Surges raw mana into a devastating attack.',              'Overloads the target with catastrophic arcane power.'],
  bone:      ['Strikes the target with a bone shard.',              'Crushes with a skeletal slam.',                           "Invokes death rattle — the last sound the target hears."],
};

function getThemeKey(card: CardTemplate): string {
  return card.artTheme || card.type;
}

function getAbilityDescription(card: CardTemplate, abilityIndex: number): string {
  const abilities = getCardAbilities(card);
  const ability = abilities[abilityIndex];
  const flavors = ABILITY_FLAVOR[card.artTheme || ''] ?? [
    'Strikes the target with force.',
    'Unleashes a powerful blow on the target.',
    'Delivers a devastating ultimate attack.',
  ];
  const flavor = flavors[abilityIndex] ?? flavors[0];
  const isUltimate = abilityIndex === 2;
  const deltaStr = ability.atkDelta > 0 ? ` (+${ability.atkDelta} ATK)` : '';
  return `${isUltimate ? '★ ULTIMATE — ' : ''}${flavor} Deals ATK${deltaStr} damage. Cooldown: ${ability.cooldown} turn${ability.cooldown !== 1 ? 's' : ''}.`;
}

// ── Type display helpers ──────────────────────────────────────────────────────
const TYPE_LABELS: Record<CardType, string> = {
  character:   '⚔️ CHARACTER',
  spell:       '🌟 SPELL',
  artifact:    '🏺 ARTIFACT',
  enchantment: '🔵 ENCHANTMENT',
};

const KEYWORD_LABELS: Record<string, string> = {
  taunt:       '🛡️ Taunt',
  stealth:     '👁️ Stealth',
  haste:       '⚡ Haste',
  poison_on_hit: '☠️ Poison on Hit',
  stun_on_hit: '💫 Stun on Hit',
  flame_aura:  '🔥 Flame Aura',
  heavy_armor: '🪖 Heavy Armor',
  heal_on_kill: '💚 Heal on Kill',
  electric:    '⚡ Electric',
  electric_aura: '⚡ Electric Aura',
  shadow_silence: '🌑 Shadow Silence',
};

const RARITY_ORDER: CardRarity[] = ['common', 'rare', 'legendary', 'secret'];

// ── Card discovery grid item ──────────────────────────────────────────────────
interface CodexCardProps {
  card: CardTemplate;
  discovered: boolean;
  onClick: () => void;
}

function CodexCard({ card, discovered, onClick }: CodexCardProps) {
  const rarity = card.rarity ?? 'common';
  const styles = RARITY_STYLES[rarity];
  const themeKey = getThemeKey(card);
  const theme = THEME_CONFIG[themeKey] ?? THEME_CONFIG.character;

  if (!discovered) {
    return (
      <button
        onClick={() => { sounds.play('uiClick'); onClick(); }}
        className="relative flex flex-col overflow-hidden border border-gray-700/50 bg-gray-950/80 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        aria-label="Undiscovered card"
      >
        {/* Art area */}
        <div className="w-full aspect-[3/4] bg-gray-900/60 flex items-center justify-center">
          <Lock size={24} className="text-gray-700" />
        </div>
        {/* Name bar */}
        <div className="w-full text-center py-1.5 px-1 border-t border-gray-700/40" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <p className="font-display text-xs text-gray-600 font-bold">???</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => { sounds.play('uiClick'); onClick(); }}
      className={`relative flex flex-col overflow-hidden border-2 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${styles.border} ${styles.glow}`}
    >
      {/* Art area */}
      <div className={`w-full aspect-[3/4] bg-gradient-to-b ${theme.gradient} flex flex-col items-center justify-center gap-1 relative`}>
        <span className="text-3xl drop-shadow-lg">{theme.emoji}</span>
        {/* Stats for characters */}
        {card.type === 'character' && (
          <div className="flex gap-2 text-xs font-bold mt-1">
            <span className="text-red-300">⚔️{card.atk}</span>
            <span className="text-blue-300">🛡{card.def}</span>
          </div>
        )}
        {/* Cost badge */}
        <div className="absolute top-1 left-1 bg-black/60 border border-white/20 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {card.cost}
        </div>
      </div>
      {/* Name + rarity bar */}
      <div className="w-full text-center py-1.5 px-1 border-t border-white/10" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <p className="font-display text-[11px] text-foreground font-bold leading-tight truncate">{card.name}</p>
        <p className={`text-[9px] font-semibold uppercase tracking-wider ${styles.section}`}>{styles.label}</p>
      </div>
    </button>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────
interface ModalProps {
  card: CardTemplate;
  onClose: () => void;
}

function CodexModal({ card, onClose }: ModalProps) {
  const rarity = card.rarity ?? 'common';
  const styles = RARITY_STYLES[rarity];
  const themeKey = getThemeKey(card);
  const theme = THEME_CONFIG[themeKey] ?? THEME_CONFIG.character;
  const isChar = card.type === 'character';
  const abilities = isChar ? getCardAbilities(card) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative max-w-sm w-full border-2 ${styles.border} ${styles.glow} bg-gray-950 flex flex-col overflow-hidden max-h-[90dvh]`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground p-1">
          <X size={18} />
        </button>

        {/* Art header */}
        <div className={`w-full h-36 bg-gradient-to-b ${theme.gradient} flex flex-col items-center justify-center relative shrink-0`}>
          <span className="text-6xl drop-shadow-xl">{theme.emoji}</span>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
          {/* Name + badges */}
          <div className="text-center">
            <h2 className="text-2xl font-display text-foreground leading-tight">{card.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${styles.border} ${styles.badge}`}>
                {styles.label}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {TYPE_LABELS[card.type]}
              </span>
              <span className="text-[10px] text-muted-foreground border border-white/10 px-1.5 py-0.5">
                Cost: {card.cost} ✦
              </span>
            </div>
          </div>

          {/* Stats (character only) */}
          {isChar && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-950/40 border border-red-800/40 p-3 text-center">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-0.5">Attack</p>
                <p className="text-2xl font-bold text-red-300">{card.atk}</p>
              </div>
              <div className="bg-blue-950/40 border border-blue-800/40 p-3 text-center">
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-0.5">Defense</p>
                <p className="text-2xl font-bold text-blue-300">{card.def}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-black/30 border border-white/10 p-3">
            <p className="text-sm text-muted-foreground leading-relaxed italic">"{card.description}"</p>
          </div>

          {/* Keywords */}
          {card.keywords && card.keywords.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {card.keywords.map(kw => (
                  <span key={kw} className="text-xs bg-secondary border border-border px-2 py-0.5 text-foreground font-semibold">
                    {KEYWORD_LABELS[kw] ?? kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Effect (spells / artifacts) */}
          {card.effect && (
            <div className="bg-black/30 border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Effect Key</p>
              <p className="text-xs text-primary font-mono">{card.effect}</p>
            </div>
          )}

          {/* Abilities (characters only) */}
          {isChar && abilities && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Abilities</p>
              <div className="flex flex-col gap-2">
                {abilities.map((ab, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border ${idx === 2 ? `${styles.border} bg-black/40` : 'border-white/10 bg-black/20'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-bold ${idx === 2 ? styles.section : 'text-foreground'}`}>
                        {idx === 2 ? '★ ' : ''}{ab.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground border border-white/10 px-1.5 py-0.5">
                        CD: {ab.cooldown}t
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getAbilityDescription(card, idx)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Codex page ───────────────────────────────────────────────────────────
const CODEX_CARDS = CARD_TEMPLATES.filter(c => !c.templateId.startsWith('ev_'));

export default function CodexPage() {
  const [, setLocation] = useLocation();
  const { isDiscovered } = useCodex();
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);
  const [filterRarity, setFilterRarity] = useState<CardRarity | 'all'>('all');
  const [filterType, setFilterType] = useState<CardType | 'all'>('all');

  const discoveredCount = useMemo(
    () => CODEX_CARDS.filter(c => isDiscovered(c.templateId)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDiscovered, CODEX_CARDS.length],
  );

  const grouped = useMemo(() => {
    return RARITY_ORDER.map(rarity => {
      const cards = CODEX_CARDS
        .filter(c => {
          if (c.rarity !== rarity) return false;
          if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
          if (filterType !== 'all' && c.type !== filterType) return false;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return { rarity, cards };
    }).filter(g => g.cards.length > 0);
  }, [filterRarity, filterType]);

  const RARITY_FILTERS: Array<CardRarity | 'all'> = ['all', 'common', 'rare', 'legendary', 'secret'];
  const TYPE_FILTERS: Array<CardType | 'all'> = ['all', 'character', 'spell', 'artifact', 'enchantment'];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Modal */}
      {selectedCard && isDiscovered(selectedCard.templateId) && (
        <CodexModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}

      {/* Header */}
      <header className="flex items-center gap-4 p-5 border-b border-border shrink-0">
        <button
          onClick={() => { sounds.play('uiClick'); setLocation('/'); }}
          className="p-2 hover:bg-secondary border border-transparent hover:border-border transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-display text-primary drop-shadow-[0_0_5px_rgba(30,144,255,0.5)] flex items-center gap-2">
            <BookOpen size={28} /> CARD CODEX
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Discover cards by drawing them in battle</p>
        </div>
        {/* Progress */}
        <div className="bg-card border border-border px-4 py-2 text-right shrink-0">
          <p className="text-primary font-bold text-lg leading-none">{discoveredCount}<span className="text-muted-foreground text-sm font-normal">/{CODEX_CARDS.length}</span></p>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Discovered</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-secondary w-full shrink-0">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(discoveredCount / CODEX_CARDS.length) * 100}%` }}
        />
      </div>

      {/* Filters */}
      <div className="px-4 pt-3 pb-2 flex flex-col gap-2 shrink-0">
        {/* Rarity filter */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {RARITY_FILTERS.map(r => (
            <button
              key={r}
              onClick={() => { sounds.play('uiClick'); setFilterRarity(r); }}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 ${
                filterRarity === r
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {r === 'all' ? 'All Rarities' : RARITY_STYLES[r as CardRarity].label}
            </button>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => { sounds.play('uiClick'); setFilterType(t); }}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 ${
                filterType === t
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid grouped by rarity */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {grouped.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">No cards match this filter.</div>
        )}
        {grouped.map(({ rarity, cards }) => {
          const styles = RARITY_STYLES[rarity];
          const sectionDiscovered = cards.filter(c => isDiscovered(c.templateId)).length;
          return (
            <div key={rarity} className="mb-8">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3 py-2 border-b border-white/10">
                <h2 className={`text-lg font-display font-bold uppercase tracking-widest ${styles.section}`}>
                  {styles.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {sectionDiscovered}/{cards.length} discovered
                </span>
              </div>
              {/* Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {cards.map(card => (
                  <CodexCard
                    key={card.templateId}
                    card={card}
                    discovered={isDiscovered(card.templateId)}
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
