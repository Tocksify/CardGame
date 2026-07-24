export type CardType = 'character' | 'spell' | 'artifact' | 'enchantment';
export type CardRarity = 'common' | 'rare' | 'legendary' | 'secret';

export interface CardTemplate {
  templateId: string;
  name: string;
  type: CardType;
  cost: number;
  atk?: number;
  def?: number;
  description: string;
  effect?: string;
  keywords?: string[];
  rarity?: CardRarity;
  evolvesTo?: string;
  evolveCondition?: { turnsOnField?: number; damageDealt?: number };
  /** Visual theme for card art */
  artTheme?: string;
}

export interface CardAbility {
  name: string;
  /** Added to the card's currentAtk at the time of use. */
  atkDelta: number;
  /** Turns the owner must wait (counting only their own turns) before using again. */
  cooldown: number;
}

// ── Ability name sets keyed by art theme ───────────────────────────────────
const ABILITY_THEMES: Record<string, [string, string, string]> = {
  fire:      ['Ember Strike',  'Inferno Blast',       'Pyroclasm'],
  water:     ['Tidal Surge',   'Torrent',              'Maelstrom'],
  earth:     ['Rock Throw',    'Earthshatter',         'Tremor'],
  poison:    ['Venom Strike',  'Plague Bite',          'Toxic Explosion'],
  frost:     ['Ice Shard',     'Blizzard Bolt',        'Absolute Zero'],
  shadow:    ['Shadow Strike', 'Dark Lance',           'Oblivion'],
  void:      ['Null Ray',      'Void Rift',            'Dimensional Collapse'],
  aether:    ['Aether Bolt',   'Arcane Nova',          'Aetheric Cataclysm'],
  iron:      ['Iron Strike',   'Shield Bash',          'Bastion Crush'],
  dragon:    ['Dragon Bite',   'Flame Breath',         'Ancient Fury'],
  celestial: ['Divine Smite',  'Holy Surge',           'Celestial Wrath'],
  storm:     ['Gale Strike',   'Thunder Bolt',         'Tempest'],
  electric:  ['Shock',         'Arc Lightning',        'Thunderstrike'],
  huntress:  ['Arrow Shot',    'Piercing Shot',        'Deadshot'],
  unknown:   ['Enigma Strike', 'Void Pulse',           'Annihilation'],
};

/**
 * Returns the 3 abilities for a character card based on its art theme.
 *   Ability 1 — Basic  : same ATK, cooldown 1 turn
 *   Ability 2 — Stronger: ATK +2,  cooldown 2 turns
 *   Ability 3 — Ultimate: ATK +4,  cooldown 4 turns
 */
export function getCardAbilities(card: { artTheme?: string }): [CardAbility, CardAbility, CardAbility] {
  const names: [string, string, string] =
    (card.artTheme ? ABILITY_THEMES[card.artTheme] : undefined) ?? ['Strike', 'Power Blow', 'Devastate'];
  return [
    { name: names[0], atkDelta: 0, cooldown: 1 },
    { name: names[1], atkDelta: 2, cooldown: 2 },
    { name: names[2], atkDelta: 4, cooldown: 4 },
  ];
}

export interface ShopItemTemplate {
  id: string;
  name: string;
  type: 'item' | 'stat' | 'perk' | 'card' | 'artifact';
  cost: number;
  description: string;
  effectKey?: string;
  cardTemplateId?: string;
  stackable?: boolean;
}

// ── Rarity draw weights ────────────────────────────────────────────────────
// Total = 100. Secret is rare — ~1% per draw. Legendary ~6%.
export const RARITY_WEIGHTS: Record<CardRarity, number> = {
  common: 65,
  rare: 28,
  legendary: 6,
  secret: 1,
};

export const CARD_TEMPLATES: CardTemplate[] = [
  // ── Common Characters ─────────────────────────────────────────────────────
  {
    templateId: 'c1', name: 'Aether Sprite', type: 'character', cost: 1,
    atk: 2, def: 1,
    description: 'A nimble sprite of pure aetheric energy.',
    rarity: 'common', artTheme: 'aether',
    evolvesTo: 'ev_c1', evolveCondition: { turnsOnField: 3 },
  },
  {
    templateId: 'c2', name: 'Stone Golem', type: 'character', cost: 3,
    atk: 3, def: 4,
    description: 'A sturdy stone defender.',
    rarity: 'common', artTheme: 'earth',
    evolvesTo: 'ev_c2', evolveCondition: { turnsOnField: 4 },
  },
  {
    templateId: 'c3', name: 'Flame Imp', type: 'character', cost: 2,
    atk: 2, def: 2,
    description: 'Deals 1 extra damage when attacking. Applies burn on hit.',
    keywords: ['flame_aura', 'poison_on_hit'],
    rarity: 'common', artTheme: 'fire',
  },
  {
    templateId: 'c4', name: 'Tide Caller', type: 'character', cost: 3,
    atk: 2, def: 3,
    description: 'Manipulates the waters. Stuns enemies it strikes.',
    keywords: ['stun_on_hit'],
    rarity: 'common', artTheme: 'water',
  },
  {
    templateId: 'c5', name: 'Void Walker', type: 'character', cost: 4,
    atk: 4, def: 2,
    description: 'Steps between dimensions to strike.',
    rarity: 'common', artTheme: 'void',
  },
  {
    templateId: 'h5', name: 'Ironclad Knight', type: 'character', cost: 3,
    atk: 2, def: 6,
    description: 'Enemies must attack this character first.',
    keywords: ['taunt'],
    rarity: 'common', artTheme: 'iron',
  },
  {
    templateId: 'h7', name: 'Frost Guardian', type: 'character', cost: 2,
    atk: 1, def: 5,
    description: 'Chills on hit — the struck enemy is stunned.',
    keywords: ['stun_on_hit'],
    rarity: 'common', artTheme: 'frost',
  },
  {
    templateId: 'h8', name: 'Plague Rat', type: 'character', cost: 1,
    atk: 2, def: 2,
    description: 'Poisons enemies it attacks (2 stacks).',
    keywords: ['poison_on_hit'],
    rarity: 'common', artTheme: 'poison',
  },
  {
    templateId: 'h10', name: 'Bog Crawler', type: 'character', cost: 2,
    atk: 3, def: 3,
    description: 'A lurking swamp beast. Deals poison on contact.',
    keywords: ['poison_on_hit'],
    rarity: 'common', artTheme: 'poison',
  },
  {
    templateId: 'c12', name: 'Cinder Hound', type: 'character', cost: 2,
    atk: 3, def: 2,
    description: 'A blazing beast. Its attacks leave a burning trail.',
    keywords: ['flame_aura'],
    rarity: 'common', artTheme: 'fire',
  },
  {
    templateId: 'c13', name: 'Swamp Stalker', type: 'character', cost: 2,
    atk: 2, def: 3,
    description: 'Lurks in fetid bogs. Poisons with every strike.',
    keywords: ['poison_on_hit'],
    rarity: 'common', artTheme: 'poison',
  },
  {
    templateId: 'c14', name: 'Granite Sentinel', type: 'character', cost: 3,
    atk: 2, def: 5,
    description: 'A living wall of stone. Enemies must attack it first.',
    keywords: ['taunt'],
    rarity: 'common', artTheme: 'earth',
  },
  {
    templateId: 'c15', name: 'Hollow Knight', type: 'character', cost: 2,
    atk: 3, def: 2,
    description: 'A spectral warrior that strikes from the shadows.',
    keywords: ['stealth'],
    rarity: 'common', artTheme: 'shadow',
  },
  {
    templateId: 'c16', name: 'Crystal Wisp', type: 'character', cost: 1,
    atk: 1, def: 3,
    description: 'A delicate aetheric wisp. Grows stronger over time.',
    rarity: 'common', artTheme: 'aether',
    evolvesTo: 'ev_c1', evolveCondition: { turnsOnField: 4 },
  },
  // New common characters (pool dilution)
  {
    templateId: 'c17', name: 'Ember Scout', type: 'character', cost: 1,
    atk: 2, def: 1,
    description: 'A quick fire scout. Applies burn on every hit.',
    keywords: ['flame_aura'],
    rarity: 'common', artTheme: 'fire',
  },
  {
    templateId: 'c18', name: 'Shield Bearer', type: 'character', cost: 2,
    atk: 1, def: 5,
    description: 'Stalwart defender. Forces enemies to strike it first.',
    keywords: ['taunt'],
    rarity: 'common', artTheme: 'iron',
  },
  {
    templateId: 'c19', name: 'Frost Archer', type: 'character', cost: 2,
    atk: 3, def: 1,
    description: 'Fires frost bolts that slow and stun enemies.',
    keywords: ['stun_on_hit'],
    rarity: 'common', artTheme: 'frost',
  },
  {
    templateId: 'c20', name: 'Mud Troll', type: 'character', cost: 3,
    atk: 4, def: 3,
    description: 'A filthy troll that poisons everything it touches.',
    keywords: ['poison_on_hit'],
    rarity: 'common', artTheme: 'poison',
  },
  {
    templateId: 'c21', name: 'Dust Wraith', type: 'character', cost: 2,
    atk: 2, def: 2,
    description: 'A phantom of the wastes. Attacks from the shadows.',
    keywords: ['stealth'],
    rarity: 'common', artTheme: 'shadow',
  },
  {
    templateId: 'c22', name: 'Iron Drake Whelp', type: 'character', cost: 3,
    atk: 3, def: 3,
    description: 'A young iron drake — tough hide deflects blows.',
    rarity: 'common', artTheme: 'dragon',
  },
  {
    templateId: 'c23', name: 'Torch Bearer', type: 'character', cost: 1,
    atk: 1, def: 2,
    description: 'Carries a blazing torch. Enemies beware.',
    keywords: ['flame_aura'],
    rarity: 'common', artTheme: 'fire',
  },

  // ── Common Spells ─────────────────────────────────────────────────────────
  {
    templateId: 's1', name: 'Bolt of Ruin', type: 'spell', cost: 2,
    description: 'Deal 3 damage to any target.',
    effect: 'dmg_3_target', rarity: 'common',
  },
  {
    templateId: 's2', name: 'Arcane Surge', type: 'spell', cost: 3,
    description: 'Draw 2 cards from the pool.',
    effect: 'draw_2', rarity: 'common',
  },
  {
    templateId: 's5', name: 'Healing Rain', type: 'spell', cost: 2,
    description: 'Restore 4 life.',
    effect: 'heal_4_hero', rarity: 'common',
  },
  {
    templateId: 's9', name: 'Poison Cloud', type: 'spell', cost: 2,
    description: 'Apply 3 poison stacks to all enemy characters.',
    effect: 'poison_all_enemies', rarity: 'common',
  },
  {
    templateId: 's10', name: 'Thunder Clap', type: 'spell', cost: 3,
    description: 'Stun a target character for 1 turn.',
    effect: 'stun_target', rarity: 'common',
  },
  {
    templateId: 's13', name: 'Cinder Blast', type: 'spell', cost: 3,
    description: 'Deal 4 damage to any target.',
    effect: 'dmg_4_target', rarity: 'common',
  },
  {
    templateId: 's14', name: 'Mend', type: 'spell', cost: 2,
    description: 'Restore 6 life to your hero.',
    effect: 'heal_6_hero', rarity: 'common',
  },
  // New common spells
  {
    templateId: 's17', name: 'Swift Hex', type: 'spell', cost: 1,
    description: 'Deal 2 damage to any target.',
    effect: 'dmg_2_target', rarity: 'common',
  },
  {
    templateId: 's18', name: 'Stone Skin', type: 'spell', cost: 2,
    description: 'Restore 3 life to your hero.',
    effect: 'heal_3_hero', rarity: 'common',
  },
  {
    templateId: 's20', name: 'Whispering Venom', type: 'spell', cost: 2,
    description: 'Apply 2 poison stacks to a target character.',
    effect: 'poison_target_2', rarity: 'common',
  },

  // ── Common Artifacts ──────────────────────────────────────────────────────
  {
    templateId: 'a1', name: 'Iron Totem', type: 'artifact', cost: 2,
    description: 'All your characters get +1 DEF.',
    effect: 'aura_def_1', rarity: 'common',
  },
  {
    templateId: 'a6', name: 'Runic Barrier', type: 'artifact', cost: 3,
    description: 'All your characters get +2 DEF.',
    effect: 'aura_def_2', rarity: 'common',
  },

  // ── Common Enchantments ───────────────────────────────────────────────────
  {
    templateId: 'e1', name: 'Crystal Heart', type: 'enchantment', cost: 2,
    description: 'Attach to character: +2/+2',
    effect: 'buff_2_2', rarity: 'common',
  },
  {
    templateId: 'e3', name: 'Frost Armor', type: 'enchantment', cost: 2,
    description: 'Attach to character: +0/+4',
    effect: 'buff_0_4', rarity: 'common',
  },
  {
    templateId: 'e4', name: 'Venom Coating', type: 'enchantment', cost: 2,
    description: 'Attach to character: gains Poison on Hit.',
    effect: 'add_poison_keyword', rarity: 'common',
  },

  // ── Rare Characters ───────────────────────────────────────────────────────
  {
    templateId: 'c6', name: 'Ancient Drake', type: 'character', cost: 5,
    atk: 5, def: 4,
    description: 'A majestic dragon from the early ages.',
    rarity: 'rare', artTheme: 'dragon',
    evolvesTo: 'ev_c6', evolveCondition: { damageDealt: 8 },
  },
  {
    templateId: 'c7', name: 'Celestial Guard', type: 'character', cost: 3,
    atk: 1, def: 6,
    description: 'Enemies must attack this character first.',
    keywords: ['taunt'], rarity: 'rare', artTheme: 'celestial',
  },
  {
    templateId: 'c8', name: 'Shadow Rogue', type: 'character', cost: 3,
    atk: 4, def: 1,
    description: 'Can attack the enemy hero directly.',
    keywords: ['stealth'], rarity: 'rare', artTheme: 'shadow',
  },
  {
    templateId: 'c9', name: 'Storm Drake', type: 'character', cost: 4,
    atk: 5, def: 3,
    description: 'Attacks immediately upon deployment.',
    keywords: ['haste'], rarity: 'rare', artTheme: 'storm',
  },
  {
    templateId: 'h1', name: 'Huntress', type: 'character', cost: 3,
    atk: 4, def: 4,
    description: 'Swift hunter. Can strike enemy heroes directly.',
    keywords: ['stealth'], rarity: 'rare', artTheme: 'huntress',
  },
  {
    templateId: 'h2', name: 'Zip', type: 'character', cost: 2,
    atk: 3, def: 2,
    description: 'Electric character. Attacks first. Stuns enemies on hit.',
    keywords: ['haste', 'stun_on_hit', 'electric'],
    rarity: 'rare', artTheme: 'electric',
  },
  {
    templateId: 'h6', name: 'Ember Witch', type: 'character', cost: 3,
    atk: 5, def: 1,
    description: 'Her attacks set enemies ablaze — poisons on hit.',
    keywords: ['poison_on_hit', 'flame_aura'],
    rarity: 'rare', artTheme: 'fire',
  },
  {
    templateId: 'h11', name: 'Void Phantom', type: 'character', cost: 3,
    atk: 5, def: 2,
    description: 'A shadow that strikes from nowhere. Stealth.',
    keywords: ['stealth'], rarity: 'rare', artTheme: 'void',
  },
  {
    templateId: 'h12', name: 'Radiant Paladin', type: 'character', cost: 4,
    atk: 3, def: 5,
    description: 'Heals your hero for 2 each time it kills an enemy.',
    keywords: ['heal_on_kill', 'taunt'],
    rarity: 'rare', artTheme: 'celestial',
  },
  {
    templateId: 'h13', name: 'Emberwing', type: 'character', cost: 4,
    atk: 5, def: 3,
    description: 'A blazing phoenix-hawk. Strikes immediately. Leaves fire in its wake.',
    keywords: ['haste', 'flame_aura'],
    rarity: 'rare', artTheme: 'fire',
  },
  {
    templateId: 'h14', name: 'Galeclaw', type: 'character', cost: 3,
    atk: 4, def: 2,
    description: 'Wind-born predator. Acts first and strikes before guards.',
    keywords: ['haste', 'stealth'],
    rarity: 'rare', artTheme: 'aether',
  },
  {
    templateId: 'h15', name: 'Thornback', type: 'character', cost: 4,
    atk: 3, def: 5,
    description: 'A thorned tank. Forces enemies to attack it and poisons them when struck.',
    keywords: ['taunt', 'poison_on_hit'],
    rarity: 'rare', artTheme: 'poison',
  },
  {
    templateId: 'h16', name: 'Frostbound Drake', type: 'character', cost: 5,
    atk: 4, def: 4,
    description: 'A cold-blooded drake. Freezes any enemy it attacks.',
    keywords: ['stun_on_hit'],
    rarity: 'rare', artTheme: 'frost',
  },
  {
    templateId: 'h17', name: 'The Warden', type: 'character', cost: 4,
    atk: 3, def: 7,
    description: 'An iron-clad guardian. Taunt. Heavy armor reduces incoming damage.',
    keywords: ['taunt', 'heavy_armor'],
    rarity: 'rare', artTheme: 'iron',
  },
  {
    templateId: 'h20', name: 'Ash Phantom', type: 'character', cost: 4,
    atk: 5, def: 3,
    description: 'A specter born from ruin. Bypasses defenders entirely.',
    keywords: ['stealth'],
    rarity: 'rare', artTheme: 'void',
  },
  // New rare characters
  {
    templateId: 'r1', name: 'Storm Hawk', type: 'character', cost: 3,
    atk: 4, def: 3,
    description: 'A lightning-swift raptor. Strikes first; shocks enemies.',
    keywords: ['haste', 'electric'],
    rarity: 'rare', artTheme: 'storm',
  },
  {
    templateId: 'r2', name: 'Plague Wraith', type: 'character', cost: 4,
    atk: 3, def: 3,
    description: 'A diseased specter. Poisons anything it touches and ignores guards.',
    keywords: ['poison_on_hit', 'stealth'],
    rarity: 'rare', artTheme: 'poison',
  },
  {
    templateId: 'r3', name: 'Bastion Knight', type: 'character', cost: 4,
    atk: 2, def: 8,
    description: 'An immovable fortress. Taunt. Heavily armored against all blows.',
    keywords: ['taunt', 'heavy_armor'],
    rarity: 'rare', artTheme: 'iron',
  },
  {
    templateId: 'r4', name: 'Verdant Treant', type: 'character', cost: 5,
    atk: 4, def: 6,
    description: 'Ancient forest guardian. Taunt. Heals your hero on every kill.',
    keywords: ['taunt', 'heal_on_kill'],
    rarity: 'rare', artTheme: 'earth',
  },

  // ── Rare Spells ───────────────────────────────────────────────────────────
  {
    templateId: 's3', name: 'Soul Drain', type: 'spell', cost: 4,
    description: 'Destroy a character with DEF 3 or less, gain its ATK as gold.',
    effect: 'destroy_small_gain_gold', rarity: 'rare',
  },
  {
    templateId: 's4', name: 'Nova Blast', type: 'spell', cost: 5,
    description: 'Deal 2 damage to all enemy characters.',
    effect: 'dmg_2_all_enemies', rarity: 'rare',
  },
  {
    templateId: 's11', name: 'Venomstrike', type: 'spell', cost: 3,
    description: 'Deal 2 damage and apply 4 poison stacks to a target.',
    effect: 'dmg_2_and_poison_4', rarity: 'rare',
  },
  {
    templateId: 's12', name: 'Chain Lightning', type: 'spell', cost: 4,
    description: 'Stun all enemy characters for 1 turn.',
    effect: 'stun_all_enemies', rarity: 'rare',
  },
  {
    templateId: 's15', name: 'Inferno Wave', type: 'spell', cost: 4,
    description: 'Deal 3 damage to all enemies and apply 2 poison stacks.',
    effect: 'dmg_3_all_and_poison', rarity: 'rare',
  },
  {
    templateId: 's16', name: 'Arcane Volley', type: 'spell', cost: 4,
    description: 'Draw 3 cards from the pool.',
    effect: 'draw_3', rarity: 'rare',
  },
  // Mind Shatter — stuns the enemy hero for 1 turn
  {
    templateId: 'sH1', name: 'Mind Shatter', type: 'spell', cost: 4,
    description: 'Shatter the enemy hero\'s focus — they lose all Aether next turn and cannot play cards.',
    effect: 'stun_hero', rarity: 'rare',
  },
  // Soul Cage — imprisons the enemy player for a full turn
  {
    templateId: 'sH2', name: 'Soul Cage', type: 'spell', cost: 5,
    description: 'Imprison the enemy player — their entire next turn is lost. They cannot play cards or attack.',
    effect: 'stun_player', rarity: 'legendary',
  },
  {
    templateId: 's19', name: 'Void Rend', type: 'spell', cost: 3,
    description: 'Deal 5 damage to a single target.',
    effect: 'dmg_5_target', rarity: 'rare',
  },

  // ── Rare Artifacts ────────────────────────────────────────────────────────
  {
    templateId: 'a2', name: 'Aether Lens', type: 'artifact', cost: 3,
    description: 'Draw a card each turn.',
    effect: 'aura_draw_1', rarity: 'rare',
  },
  {
    templateId: 'a3', name: 'War Banner', type: 'artifact', cost: 4,
    description: 'All your characters get +1 ATK.',
    effect: 'aura_atk_1', rarity: 'rare',
  },
  {
    templateId: 'a5', name: 'Venom Chalice', type: 'artifact', cost: 3,
    description: 'Your characters apply 1 poison on every attack.',
    effect: 'aura_poison_1', rarity: 'rare',
  },
  {
    templateId: 'a7', name: 'War Idol', type: 'artifact', cost: 4,
    description: 'All your characters get +2 ATK.',
    effect: 'aura_atk_2', rarity: 'rare',
  },
  {
    templateId: 'a8', name: 'Gold Shrine', type: 'artifact', cost: 3,
    description: 'Gain 50 extra gold each turn.',
    effect: 'aura_gold_50', rarity: 'rare',
  },
  {
    templateId: 'a9', name: 'Crimson Heart', type: 'artifact', cost: 4,
    description: 'Heal 1 HP each turn.',
    effect: 'aura_heal_1', rarity: 'rare',
  },

  // ── Rare Enchantments ─────────────────────────────────────────────────────
  {
    templateId: 'e2', name: 'Blood Pact', type: 'enchantment', cost: 3,
    description: 'Attach to character: +3 ATK, -1 DEF',
    effect: 'buff_3_m1', rarity: 'rare',
  },
  {
    templateId: 'e5', name: 'Stormweave', type: 'enchantment', cost: 3,
    description: 'Attach to character: Gains Stun on Hit.',
    effect: 'add_stun_keyword', rarity: 'rare',
  },

  // ── Legendary Characters ──────────────────────────────────────────────────
  {
    templateId: 'c10', name: 'Void Colossus', type: 'character', cost: 8,
    atk: 8, def: 8,
    description: 'An unstoppable force of destruction.',
    rarity: 'legendary', artTheme: 'void',
  },
  {
    templateId: 'c11', name: 'Celestial Titan', type: 'character', cost: 6,
    atk: 6, def: 8,
    description: 'A divine protector of the realm.',
    keywords: ['taunt'], rarity: 'legendary', artTheme: 'celestial',
  },
  {
    templateId: 'h3', name: 'JoBoorn', type: 'character', cost: 5,
    atk: 7, def: 2,
    description: 'Legendary warrior. High Attack and Heavy Armor (blocks 3 dmg), but very low Vitality. Fearless and unstoppable in the right hands.',
    keywords: ['heavy_armor'],
    rarity: 'legendary', artTheme: 'iron',
  },
  {
    templateId: 'h9', name: 'Thunder Titan', type: 'character', cost: 7,
    atk: 6, def: 6,
    description: 'Electric colossus. All your characters deal +1 damage.',
    keywords: ['electric', 'electric_aura'],
    rarity: 'legendary', artTheme: 'electric',
  },
  {
    templateId: 'h18', name: 'Dawnbringer', type: 'character', cost: 6,
    atk: 5, def: 6,
    description: 'A divine warrior of light. Heals your hero for 2 on kill. Forces enemies to attack it first.',
    keywords: ['heal_on_kill', 'taunt'],
    rarity: 'legendary', artTheme: 'celestial',
  },
  {
    templateId: 'h19', name: 'Blazing Titan', type: 'character', cost: 7,
    atk: 7, def: 5,
    description: 'A colossal inferno given form. Strikes first. Burns all it touches.',
    keywords: ['haste', 'flame_aura', 'taunt'],
    rarity: 'legendary', artTheme: 'fire',
  },
  // New legendary characters
  {
    templateId: 'l1', name: 'Arcane Colossus', type: 'character', cost: 7,
    atk: 6, def: 7,
    description: 'A living construct of pure aether. Strikes immediately. Taunt.',
    keywords: ['haste', 'taunt'],
    rarity: 'legendary', artTheme: 'aether',
  },
  {
    templateId: 'l2', name: 'Death Knight', type: 'character', cost: 6,
    atk: 7, def: 4,
    description: 'A wraith of death. Stealth. Poisons on hit. Heals your hero on every kill.',
    keywords: ['stealth', 'poison_on_hit', 'heal_on_kill'],
    rarity: 'legendary', artTheme: 'shadow',
  },

  // ── Legendary Spells ──────────────────────────────────────────────────────
  {
    templateId: 's6', name: 'Void Rift', type: 'spell', cost: 6,
    description: 'Deal 6 damage to enemy hero.',
    effect: 'dmg_6_enemy_hero', rarity: 'legendary',
  },
  {
    templateId: 's7', name: 'Arcane Nova', type: 'spell', cost: 5,
    description: 'Deal 5 damage to all enemies.',
    effect: 'dmg_5_all', rarity: 'legendary',
  },
  {
    templateId: 's8', name: 'Soul Reaper', type: 'spell', cost: 7,
    description: 'Destroy any character.',
    effect: 'destroy_target', rarity: 'legendary',
  },

  // ── Legendary Artifacts ───────────────────────────────────────────────────
  {
    templateId: 'a4', name: 'Eternity Bloom', type: 'artifact', cost: 6,
    description: 'Heal 2 life each turn.',
    effect: 'aura_heal_2', rarity: 'legendary',
  },
  {
    templateId: 'a10', name: 'Void Throne', type: 'artifact', cost: 7,
    description: 'All your characters get +2 ATK and +2 DEF.',
    effect: 'aura_atk_2_def_2', rarity: 'legendary',
  },

  // ── Secret Characters ─────────────────────────────────────────────────────
  {
    templateId: 'h4', name: '???', type: 'character', cost: 9,
    atk: 10, def: 10,
    description: 'The Unknown. A mystery of untold power. No one knows who — or what — it is.',
    keywords: ['taunt', 'stealth', 'heavy_armor'],
    rarity: 'secret', artTheme: 'unknown',
  },
  {
    templateId: 'sec2', name: 'The Watcher', type: 'character', cost: 8,
    atk: 7, def: 9,
    description: 'It has always been watching. Taunt. Stuns any enemy that dares strike it.',
    keywords: ['taunt', 'stun_on_hit'],
    rarity: 'secret', artTheme: 'void',
  },
  {
    templateId: 'sec3', name: 'The Ancient', type: 'character', cost: 10,
    atk: 9, def: 12,
    description: 'From before time itself. Taunt. Heavy Armor. Poison on every hit.',
    keywords: ['taunt', 'heavy_armor', 'poison_on_hit'],
    rarity: 'secret', artTheme: 'earth',
  },

  // ── Evolutions ────────────────────────────────────────────────────────────
  {
    templateId: 'ev_c1', name: 'Aether Titan', type: 'character', cost: 0,
    atk: 5, def: 4,
    description: 'The ascended form of Aether Sprite. Evolved.',
    rarity: 'legendary', artTheme: 'aether',
  },
  {
    templateId: 'ev_c2', name: 'Stone Colossus', type: 'character', cost: 0,
    atk: 6, def: 7,
    description: 'Ancient Golem awakened. Evolved.',
    rarity: 'legendary', artTheme: 'earth',
  },
  {
    templateId: 'ev_c6', name: 'Elder Drake', type: 'character', cost: 0,
    atk: 8, def: 6,
    description: 'The Ancient Drake reaches its final form.',
    keywords: ['haste'], rarity: 'legendary', artTheme: 'dragon',
  },
];

// ─── Pool of drawable cards (excludes evolutions) ──────────────────────────
export const DRAWABLE_POOL = CARD_TEMPLATES.filter(
  c => !c.templateId.startsWith('ev_') && c.cost > 0
);

/** Draw `amount` cards from the pool weighted by rarity. */
export function drawFromPool(amount: number): CardTemplate[] {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  const drawn: CardTemplate[] = [];

  for (let i = 0; i < amount; i++) {
    let roll = Math.random() * totalWeight;
    let targetRarity: CardRarity = 'common';
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      roll -= weight;
      if (roll <= 0) { targetRarity = rarity as CardRarity; break; }
    }
    const pool = DRAWABLE_POOL.filter(c => c.rarity === targetRarity);
    // Fallback to common if nothing in that rarity
    const finalPool = pool.length > 0 ? pool : DRAWABLE_POOL.filter(c => c.rarity === 'common');
    if (finalPool.length > 0) {
      drawn.push(finalPool[Math.floor(Math.random() * finalPool.length)]);
    }
  }
  return drawn;
}

/** Draw 3 unique (by templateId) draft options from the pool. */
export function generateDraftOptions(): CardTemplate[] {
  const seen = new Set<string>();
  const results: CardTemplate[] = [];
  let attempts = 0;
  while (results.length < 3 && attempts < 60) {
    const [card] = drawFromPool(1);
    if (card && !seen.has(card.templateId)) {
      seen.add(card.templateId);
      results.push(card);
    }
    attempts++;
  }
  return results;
}

// ─── Legacy deck generator (used for AI in 8card mode) ─────────────────────
export function generateDeck(): CardTemplate[] {
  return drawFromPool(30).sort(() => Math.random() - 0.5);
}

export const SHOP_ITEMS: ShopItemTemplate[] = [
  // ── Items ─────────────────────────────────────────────────────────────────
  { id: 'hp1',  name: 'Healing Potion',      type: 'item', cost: 200,  description: 'Restore 20 HP to yourself.', effectKey: 'heal_20_hero', stackable: true },
  { id: 'i1',   name: 'Aether Shard',        type: 'item', cost: 400,  description: 'Give any character +2 ATK permanently.', effectKey: 'perm_atk_2' },
  { id: 'i2',   name: 'Crystal Ward',        type: 'item', cost: 500,  description: 'Give any character +4 DEF permanently.', effectKey: 'perm_def_4' },
  { id: 'i3',   name: 'Mana Infusion',       type: 'item', cost: 600,  description: 'Gain 3 extra Aether this turn.', effectKey: 'temp_aether_3' },
  { id: 'i4',   name: 'Elixir of Fortune',   type: 'item', cost: 350,  description: 'Draw 2 extra cards from the pool.', effectKey: 'draw_2' },
  { id: 'i5',   name: 'Battle Serum',        type: 'item', cost: 450,  description: 'Give any character +1 ATK and +1 DEF permanently.', effectKey: 'perm_stats_1_1' },
  { id: 'i6',   name: 'Void Essence',        type: 'item', cost: 750,  description: 'Instantly destroy a target character on the enemy field.', effectKey: 'destroy_target_creature' },
  { id: 'i7',   name: 'Phoenix Feather',     type: 'item', cost: 550,  description: 'Restore 8 HP to yourself.', effectKey: 'heal_8_hero' },
  { id: 'i8',   name: 'Antidote',            type: 'item', cost: 300,  description: 'Remove all poison from a character.', effectKey: 'cure_poison', stackable: true },
  { id: 'i9',   name: 'Venom Vial',          type: 'item', cost: 400,  description: 'Apply 5 poison stacks to any target character.', effectKey: 'apply_poison_5' },
  { id: 'i10',  name: 'Thunder Orb',         type: 'item', cost: 500,  description: 'Stun an enemy character for 2 turns.', effectKey: 'stun_2_turns' },
  { id: 'i11',  name: 'War Horn',            type: 'item', cost: 650,  description: 'All your characters get +2 ATK this turn.', effectKey: 'temp_atk_all_2' },
  { id: 'i12',  name: 'Shield Rune',         type: 'item', cost: 600,  description: 'Give any character Heavy Armor for 2 turns (-3 dmg received).', effectKey: 'temp_armor' },
  { id: 'st1',  name: 'Ironheart Crystal',   type: 'item', cost: 900,  description: 'Permanently increase max HP by 20 and restore that much HP.', effectKey: 'ironheart' },
  { id: 'i13',  name: 'Wound Salve',         type: 'item', cost: 350,  description: 'Restore 3 DEF to a friendly character.', effectKey: 'heal_char_3', stackable: true },
  { id: 'i14',  name: 'Arcane Concentrate',  type: 'item', cost: 500,  description: 'Draw 3 cards from the pool.', effectKey: 'draw_3', stackable: true },
  { id: 'i15',  name: 'Greater Shard',       type: 'item', cost: 550,  description: 'Give any character +3 ATK permanently.', effectKey: 'perm_atk_3' },
  { id: 'i16',  name: 'Smoke Pellet',        type: 'item', cost: 350,  description: 'Stun an enemy character for 1 turn.', effectKey: 'stun_1_turn', stackable: true },
  { id: 'i17',  name: 'Cure-All Tonic',      type: 'item', cost: 400,  description: 'Remove all stun from a friendly character.', effectKey: 'cure_stun', stackable: true },
  { id: 'i18',  name: 'Grand Elixir',        type: 'item', cost: 800,  description: 'Restore 35 HP to yourself.', effectKey: 'heal_35_hero', stackable: true },
  { id: 'i19',  name: 'Restoration Wave',   type: 'item', cost: 550,  description: 'Restore 3 DEF to ALL friendly characters on your field.', effectKey: 'heal_all_chars_3', stackable: true },
  { id: 'i20',  name: 'Soulbound Draught',  type: 'item', cost: 450,  description: 'Restore 15 HP to yourself.', effectKey: 'heal_15_self', stackable: true },

  // ── Stat items ────────────────────────────────────────────────────────────
  { id: 'st2',  name: 'Tempest Sigil',       type: 'stat', cost: 700,  description: 'Your characters deal +1 bonus damage on first attack each turn.', effectKey: 'stormrazor' },
  { id: 'st3',  name: 'Solar Pyre Totem',    type: 'stat', cost: 800,  description: 'Start of your turns: deal 1 damage to all enemy characters.', effectKey: 'sunfire' },
  { id: 'st4',  name: "Titan's Shard",       type: 'stat', cost: 1000, description: 'All your characters gain +2 ATK/+2 DEF on deploy.', effectKey: 'jaksho' },
  { id: 'st5',  name: "Archmage's Diadem",   type: 'stat', cost: 1100, description: 'Spell damage is permanently increased by 2.', effectKey: 'rabadon' },
  { id: 'st6',  name: 'Thornweave Plate',    type: 'stat', cost: 850,  description: 'When a character takes damage, the attacker takes 1 damage.', effectKey: 'thornmail' },
  { id: 'st7',  name: 'Plague Standard',     type: 'stat', cost: 950,  description: 'Your characters apply 1 poison on every hit.', effectKey: 'plague_standard' },
  { id: 'st8',  name: 'Frost Mantle',        type: 'stat', cost: 900,  description: 'All your characters deal Stun on Hit.', effectKey: 'frost_mantle' },
  { id: 'st9',  name: 'Bloodrite Banner',    type: 'stat', cost: 1050, description: 'Each kill restores 1 HP to your hero.', effectKey: 'bloodrite' },

  // ── Perks ─────────────────────────────────────────────────────────────────
  { id: 'p1', name: 'Soul Anchor',       type: 'perk', cost: 1000, description: 'Your max life is increased by 10.', effectKey: 'perk_hp_10' },
  { id: 'p2', name: 'Aether Mastery',    type: 'perk', cost: 1250, description: 'Gain 2 extra Aether per turn permanently.', effectKey: 'perk_aether_2' },
  { id: 'p3', name: 'Golden Touch',      type: 'perk', cost: 1500, description: 'Earn 50 extra gold per turn permanently.', effectKey: 'perk_gold_2' },
  { id: 'p4', name: 'Arcane Dominion',   type: 'perk', cost: 1750, description: 'Start each turn with 1 free card draw.', effectKey: 'perk_draw_1' },
  { id: 'p5', name: 'Void Resistance',   type: 'perk', cost: 1400, description: 'Reduce all damage taken by 1.', effectKey: 'perk_resist_1' },
  { id: 'p6', name: 'Venomblood',        type: 'perk', cost: 1200, description: 'Your hero is immune to poison.', effectKey: 'perk_poison_immune' },
  { id: 'p7', name: 'Iron Will',         type: 'perk', cost: 1300, description: 'Characters you deploy cannot be stunned.', effectKey: 'perk_stun_immune' },
  { id: 'p8', name: 'Battle Hardened',   type: 'perk', cost: 1400, description: 'All your characters start with +1 ATK and +1 DEF.', effectKey: 'perk_deploy_bonus' },
  { id: 'p9', name: 'Undying Resolve',   type: 'perk', cost: 1600, description: 'Once per game, survive a lethal blow with 1 HP.', effectKey: 'perk_undying' },

  // ── Artifacts (cards that go to hand then equip to artifact slot) ─────────
  { id: 'a1_shop',   name: 'Iron Totem',      type: 'artifact', cost: 400,  description: 'Artifact: All characters +1 DEF.', cardTemplateId: 'a1', stackable: true },
  { id: 'a6_shop',   name: 'Runic Barrier',   type: 'artifact', cost: 600,  description: 'Artifact: All characters +2 DEF.', cardTemplateId: 'a6', stackable: true },
  { id: 'a2_shop',   name: 'Aether Lens',     type: 'artifact', cost: 700,  description: 'Artifact: Draw a card each turn.', cardTemplateId: 'a2', stackable: true },
  { id: 'a3_shop',   name: 'War Banner',      type: 'artifact', cost: 800,  description: 'Artifact: All characters +1 ATK.', cardTemplateId: 'a3', stackable: true },
  { id: 'a5_shop',   name: 'Venom Chalice',   type: 'artifact', cost: 700,  description: 'Artifact: Characters apply 1 poison per attack.', cardTemplateId: 'a5', stackable: true },
  { id: 'a7_shop',   name: 'War Idol',        type: 'artifact', cost: 900,  description: 'Artifact: All characters +2 ATK.', cardTemplateId: 'a7', stackable: true },
  { id: 'a8_shop',   name: 'Gold Shrine',     type: 'artifact', cost: 650,  description: 'Artifact: Gain 50 extra gold each turn.', cardTemplateId: 'a8', stackable: true },
  { id: 'a9_shop',   name: 'Crimson Heart',   type: 'artifact', cost: 750,  description: 'Artifact: Heal 1 HP each turn.', cardTemplateId: 'a9', stackable: true },
  { id: 'a4_shop',   name: 'Eternity Bloom',  type: 'artifact', cost: 1100, description: 'Artifact: Heal 2 life each turn.', cardTemplateId: 'a4', stackable: true },
  { id: 'a10_shop',  name: 'Void Throne',     type: 'artifact', cost: 1400, description: 'Artifact: All characters +2 ATK and +2 DEF.', cardTemplateId: 'a10', stackable: true },

  // ── Cards ─────────────────────────────────────────────────────────────────
  { id: 'c10_shop',  name: 'Void Colossus',   type: 'card', cost: 900,  description: '8/8 Character, costs 8 Aether.', cardTemplateId: 'c10', stackable: true },
  { id: 's7_shop',   name: 'Arcane Nova',      type: 'card', cost: 700,  description: 'Spell: Deal 5 damage to all enemies.', cardTemplateId: 's7', stackable: true },
  { id: 'c9_shop',   name: 'Storm Drake',      type: 'card', cost: 600,  description: '5/3 Character, costs 4 Aether, Haste.', cardTemplateId: 'c9', stackable: true },
  { id: 'c11_shop',  name: 'Celestial Titan',  type: 'card', cost: 1000, description: '6/8 Character, Taunt.', cardTemplateId: 'c11', stackable: true },
  { id: 's8_shop',   name: 'Soul Reaper',      type: 'card', cost: 800,  description: 'Spell: Destroy any character.', cardTemplateId: 's8', stackable: true },
  { id: 'h3_shop',   name: 'JoBoorn',          type: 'card', cost: 1100, description: '7/2 Legendary — Heavy Armor blocks 3 damage.', cardTemplateId: 'h3', stackable: true },
  { id: 'h1_shop',   name: 'Huntress',         type: 'card', cost: 700,  description: '4/4 Rare — Stealth, attacks heroes directly.', cardTemplateId: 'h1', stackable: true },
  { id: 'h2_shop',   name: 'Zip',              type: 'card', cost: 600,  description: '3/2 Rare — Electric, Haste, Stun on Hit.', cardTemplateId: 'h2', stackable: true },
  { id: 'h9_shop',   name: 'Thunder Titan',    type: 'card', cost: 950,  description: '6/6 Legendary — Electric Aura: +1 ATK all.', cardTemplateId: 'h9', stackable: true },
  { id: 'h18_shop',  name: 'Dawnbringer',      type: 'card', cost: 1100, description: '5/6 Legendary — Taunt, Heal on Kill.', cardTemplateId: 'h18', stackable: true },
  { id: 'h19_shop',  name: 'Blazing Titan',    type: 'card', cost: 1050, description: '7/5 Legendary — Haste, Flame Aura, Taunt.', cardTemplateId: 'h19', stackable: true },
  { id: 'h17_shop',  name: 'The Warden',       type: 'card', cost: 750,  description: '3/7 Rare — Taunt, Heavy Armor.', cardTemplateId: 'h17', stackable: true },
  { id: 'sH1_shop',  name: 'Mind Shatter',     type: 'card', cost: 650,  description: 'Spell: Stun enemy hero — they lose all Aether next turn.', cardTemplateId: 'sH1', stackable: true },
  { id: 'sH2_shop',  name: 'Soul Cage',        type: 'card', cost: 1000, description: 'Spell: Imprison the enemy player — their entire next turn is skipped.', cardTemplateId: 'sH2', stackable: true },
  { id: 'l1_shop',   name: 'Arcane Colossus',  type: 'card', cost: 1100, description: '6/7 Legendary — Haste, Taunt.', cardTemplateId: 'l1', stackable: true },
  { id: 'l2_shop',   name: 'Death Knight',     type: 'card', cost: 1000, description: '7/4 Legendary — Stealth, Poison, Heal on Kill.', cardTemplateId: 'l2', stackable: true },
];

export function getCardTemplate(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find(c => c.templateId === id);
}

/** Pick a random subset of shop items for one rotation. */
export function generateShopRotation(): string[] {
  const pick = (ids: string[], n: number) => {
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  };
  const itemIds     = SHOP_ITEMS.filter(i => i.type === 'item').map(i => i.id);
  const statIds     = SHOP_ITEMS.filter(i => i.type === 'stat').map(i => i.id);
  const perkIds     = SHOP_ITEMS.filter(i => i.type === 'perk').map(i => i.id);
  const cardIds     = SHOP_ITEMS.filter(i => i.type === 'card').map(i => i.id);
  const artifactIds = SHOP_ITEMS.filter(i => i.type === 'artifact').map(i => i.id);
  return [
    ...pick(itemIds, 5),
    ...pick(statIds, 4),
    ...pick(perkIds, 3),
    ...pick(cardIds, 4),
    ...pick(artifactIds, 4),
  ];
}

export const AI_NAMES = [
  'Arcane Apprentice', 'Shadow Weaver', 'Storm Sage',
  'Iron Golem', 'Void Entity', 'Blood Hexer', 'Ash Prophet', 'Dusk Herald',
  'Bone Caster', 'The Unseen', 'Plague Doctor', 'Null Warden',
];
