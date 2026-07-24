export type ChallengerRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Challenger {
  id: string;
  name: string;
  title: string;
  rarity: ChallengerRarity;
  cost: number; // Arcane Shards cost (0 = free starter)
  icon: string; // emoji icon
  description: string; // short flavor
  abilityName: string;
  abilityDescription: string; // full ability text shown in modal
  effectKeys: string[]; // effect keys applied in-game
  unlockedByAchievement?: string; // achievement ID that unlocks this for free
  isFreeStarter?: boolean;
}

export const CHALLENGERS: Challenger[] = [
  // ─── FREE STARTERS ────────────────────────────────────────────────────────
  {
    id: 'kael',
    name: 'Kael',
    title: 'the Novice',
    rarity: 'common',
    cost: 0,
    icon: '⚔️',
    isFreeStarter: true,
    description: 'Every journey starts somewhere. Kael brings gold.',
    abilityName: 'Head Start',
    abilityDescription: 'You begin every game with 300 bonus gold, giving you an early edge in the shop.',
    effectKeys: ['bonus_gold_start_300'],
  },
  {
    id: 'lyra',
    name: 'Lyra',
    title: 'the Wanderer',
    rarity: 'common',
    cost: 0,
    icon: '🌿',
    isFreeStarter: true,
    description: 'A traveler who grows stronger with every card drawn.',
    abilityName: 'Vitality Draw',
    abilityDescription: 'Each time you draw cards at the start of your turn, you restore 1 HP.',
    effectKeys: ['heal_on_draw_1'],
  },

  // ─── COMMON ───────────────────────────────────────────────────────────────
  {
    id: 'theron',
    name: 'Theron',
    title: 'the Ironclad',
    rarity: 'common',
    cost: 1000,
    icon: '🛡️',
    description: 'His body has weathered a thousand toxins. None can slow him.',
    abilityName: 'Iron Constitution',
    abilityDescription: 'You are completely immune to poison effects during battle. No enemy character or spell can poison you.',
    effectKeys: ['perk_poison_immune'],
  },
  {
    id: 'mira',
    name: 'Mira',
    title: 'the Fortunate',
    rarity: 'common',
    cost: 1500,
    icon: '🍀',
    description: 'Luck follows her everywhere — especially into the shop.',
    abilityName: 'Merchant\'s Favor',
    abilityDescription: 'All shop items cost 15% less gold, rounded down. This applies to every item throughout the game.',
    effectKeys: ['discount_shop_15'],
  },

  // ─── UNCOMMON ─────────────────────────────────────────────────────────────
  {
    id: 'aldric',
    name: 'Aldric',
    title: 'the Goldseeker',
    rarity: 'uncommon',
    cost: 3000,
    icon: '💰',
    description: 'Every fallen enemy fills his coffers. Death is very profitable.',
    abilityName: 'Bounty Hunter',
    abilityDescription: 'Killing an enemy character earns 100 gold instead of the usual 50. More kills, more wealth.',
    effectKeys: ['double_kill_gold'],
  },
  {
    id: 'sessa',
    name: 'Sessa',
    title: 'the Cartomancer',
    rarity: 'uncommon',
    cost: 4000,
    icon: '🃏',
    description: 'Her hands never stop dealing. The cards always come to her.',
    abilityName: 'Extra Draw',
    abilityDescription: 'Draw 1 extra card at the start of every turn. Your hand grows faster than anyone else\'s.',
    effectKeys: ['perk_draw_1'],
  },
  {
    id: 'vorn',
    name: 'Vorn',
    title: 'the Unshakeable',
    rarity: 'uncommon',
    cost: 5000,
    icon: '⚡',
    description: 'Lightning struck him 12 times. He barely noticed.',
    abilityName: 'Clear Mind',
    abilityDescription: 'You are completely immune to stun effects during battle. No enemy can rob you of your Aether or skip your turn.',
    effectKeys: ['perk_stun_immune'],
  },
  {
    id: 'rook',
    name: 'Rook',
    title: 'the Veteran',
    rarity: 'uncommon',
    cost: 0,
    icon: '🏆',
    description: 'Earned through hardship. His body is a map of old wars.',
    abilityName: 'Battle-Hardened',
    abilityDescription: 'You start every game with 10 extra HP (40 total). Veteran endurance keeps you in the fight longer.',
    effectKeys: ['bonus_hp_10'],
    unlockedByAchievement: 'win_3_games',
  },

  // ─── RARE ─────────────────────────────────────────────────────────────────
  {
    id: 'draela',
    name: 'Draela',
    title: 'the Spiritcaller',
    rarity: 'rare',
    cost: 10000,
    icon: '👻',
    description: 'Death is not the end when Draela calls your name.',
    abilityName: 'Last Breath',
    abilityDescription: 'Once per game, the first character you lose is immediately revived with full DEF on the following draw phase. This can only happen once.',
    effectKeys: ['revive_first_death'],
  },
  {
    id: 'nyx',
    name: 'Nyx',
    title: 'the Shadowweaver',
    rarity: 'rare',
    cost: 12000,
    icon: '🌑',
    description: 'Shadows obey her. Her spells tear through armor like smoke.',
    abilityName: 'Arcane Surge',
    abilityDescription: 'All your spells deal 2 extra damage, regardless of the spell or target. Your magical damage is unmatched.',
    effectKeys: ['spell_power_2'],
  },
  {
    id: 'ferrus',
    name: 'Ferrus',
    title: 'the Arcane',
    rarity: 'rare',
    cost: 15000,
    icon: '✨',
    description: 'He breathes aether like others breathe air.',
    abilityName: 'Mana Font',
    abilityDescription: 'You start every game with +3 maximum Aether (6 total on turn 1). Play powerful cards earlier than anyone else.',
    effectKeys: ['bonus_aether_3'],
  },
  {
    id: 'seraph',
    name: 'Seraph',
    title: 'the Blessed',
    rarity: 'rare',
    cost: 0,
    icon: '💚',
    description: 'Victory without pain. Her characters sustain her.',
    abilityName: 'Divine Retribution',
    abilityDescription: 'Each time one of your characters kills an enemy character, you heal 2 HP. Every kill keeps you alive longer.',
    effectKeys: ['heal_on_kill_2'],
    unlockedByAchievement: 'win_no_damage',
  },

  // ─── EPIC ─────────────────────────────────────────────────────────────────
  {
    id: 'auren',
    name: 'Auren',
    title: 'the Lifebinder',
    rarity: 'epic',
    cost: 30000,
    icon: '💖',
    description: 'Life flows from her presence. She cannot lose what she endlessly restores.',
    abilityName: 'Eternal Bloom',
    abilityDescription: 'At the start of each of your turns, you automatically restore 1 HP. Over a long game, this adds up to a significant advantage.',
    effectKeys: ['heal_per_turn_1'],
  },
  {
    id: 'zeth',
    name: 'Zeth',
    title: 'the Plunderer',
    rarity: 'epic',
    cost: 45000,
    icon: '🗡️',
    description: 'He takes lives and gold in equal measure. The battlefield is his vault.',
    abilityName: 'Spoils of War',
    abilityDescription: 'When you kill an enemy character, you also steal 5% of the enemy hero\'s current gold. Devastating on top of normal kill bounties.',
    effectKeys: ['steal_pct_on_kill'],
  },
  {
    id: 'vael',
    name: 'Vael',
    title: 'the Architect',
    rarity: 'epic',
    cost: 60000,
    icon: '📜',
    description: 'He designs destiny. Every game begins with a masterpiece in hand.',
    abilityName: 'Prepared Grandeur',
    abilityDescription: 'You start every game with a random Legendary card already in your hand. The most powerful creatures arrive early.',
    effectKeys: ['start_legendary'],
  },
  {
    id: 'malachar',
    name: 'Malachar',
    title: 'the Legend-Touched',
    rarity: 'epic',
    cost: 0,
    icon: '⭐',
    description: 'He touched greatness and was forever changed.',
    abilityName: 'Empowered by Legend',
    abilityDescription: 'All your spells deal 1 extra damage AND all your characters gain +1 ATK and +1 DEF when played. A powerful dual boost for all strategies.',
    effectKeys: ['spell_power_1', 'perk_deploy_bonus'],
    unlockedByAchievement: 'legendary_played',
  },

  // ─── LEGENDARY ────────────────────────────────────────────────────────────
  {
    id: 'solaris',
    name: 'Solaris',
    title: 'the Sungod',
    rarity: 'legendary',
    cost: 150000,
    icon: '☀️',
    description: 'Light incarnate. Armies follow her into oblivion.',
    abilityName: 'Solar Dominion',
    abilityDescription: 'Every character you play gains +1 ATK and +1 DEF on deployment. Your spells also deal +1 extra damage. A relentless dual offensive advantage.',
    effectKeys: ['perk_deploy_bonus', 'spell_power_1'],
  },
  {
    id: 'void_herald',
    name: 'The Void Herald',
    title: 'Harbinger of Nothing',
    rarity: 'legendary',
    cost: 250000,
    icon: '🌌',
    description: 'Not alive. Not dead. Something in between that cannot be destroyed.',
    abilityName: 'Death Denial',
    abilityDescription: 'Once per game, when you would be reduced to 0 HP, you instead survive at 1 HP. The Void Herald will not let you fall.',
    effectKeys: ['perk_undying'],
  },
  {
    id: 'prime',
    name: 'Aethermancer Prime',
    title: 'Master of the Arcane',
    rarity: 'legendary',
    cost: 500000,
    icon: '💎',
    description: 'The pinnacle of arcane mastery. Every game is already won.',
    abilityName: 'Absolute Mastery',
    abilityDescription: 'Start with +4 maximum Aether (7 total on turn 1). Draw 1 extra card per turn. Kill gold is doubled (100g per kill). The complete package.',
    effectKeys: ['bonus_aether_4', 'perk_draw_1', 'double_kill_gold'],
  },
];

export const CHALLENGER_RARITY_ORDER: ChallengerRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const RARITY_COLORS: Record<ChallengerRarity, string> = {
  common: 'border-slate-500 text-slate-300',
  uncommon: 'border-green-500 text-green-300',
  rare: 'border-blue-500 text-blue-300',
  epic: 'border-purple-500 text-purple-300',
  legendary: 'border-yellow-500 text-yellow-300',
};

export const RARITY_GLOW: Record<ChallengerRarity, string> = {
  common: '',
  uncommon: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
  rare: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  epic: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]',
  legendary: 'shadow-[0_0_20px_rgba(234,179,8,0.6)]',
};

export const RARITY_BG: Record<ChallengerRarity, string> = {
  common: 'bg-slate-800/60',
  uncommon: 'bg-green-950/40',
  rare: 'bg-blue-950/40',
  epic: 'bg-purple-950/40',
  legendary: 'bg-yellow-950/30',
};

export const RARITY_LABEL: Record<ChallengerRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function getChallengerById(id: string): Challenger | undefined {
  return CHALLENGERS.find(c => c.id === id);
}

export function getLegendaryCardIds(): string[] {
  // Returns legendary card template IDs for the "start_legendary" effect
  return ['c10', 'c11', 'h3', 'h9', 'h18', 'h19', 'l1', 'l2'];
}
