export type CardType = 'creature' | 'spell' | 'artifact' | 'enchantment';
export type CardRarity = 'common' | 'rare' | 'legendary';

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
}

export interface ShopItemTemplate {
  id: string;
  name: string;
  type: 'item' | 'stat' | 'perk' | 'card';
  cost: number;
  description: string;
  effectKey?: string;
  cardTemplateId?: string; // If it's a card
}

export const CARD_TEMPLATES: CardTemplate[] = [
  // Commons
  { templateId: 'c1', name: 'Aether Sprite', type: 'creature', cost: 1, atk: 2, def: 1, description: 'A nimble sprite of pure energy.', rarity: 'common', evolvesTo: 'ev_c1', evolveCondition: { turnsOnField: 3 } },
  { templateId: 'c2', name: 'Stone Golem', type: 'creature', cost: 3, atk: 3, def: 4, description: 'A sturdy defender.', rarity: 'common', evolvesTo: 'ev_c2', evolveCondition: { turnsOnField: 4 } },
  { templateId: 'c3', name: 'Flame Imp', type: 'creature', cost: 2, atk: 2, def: 2, description: 'Deals 1 extra damage when attacking.', keywords: ['flame_aura'], rarity: 'common' },
  { templateId: 'c4', name: 'Tide Caller', type: 'creature', cost: 3, atk: 2, def: 3, description: 'Manipulates the waters of the arena.', rarity: 'common' },
  { templateId: 'c5', name: 'Void Walker', type: 'creature', cost: 4, atk: 4, def: 2, description: 'Steps between dimensions to strike.', rarity: 'common' },
  { templateId: 's1', name: 'Bolt of Ruin', type: 'spell', cost: 2, description: 'Deal 3 damage to any target.', effect: 'dmg_3_target', rarity: 'common' },
  { templateId: 's2', name: 'Arcane Surge', type: 'spell', cost: 3, description: 'Draw 2 cards.', effect: 'draw_2', rarity: 'common' },
  { templateId: 's5', name: 'Healing Rain', type: 'spell', cost: 2, description: 'Restore 4 life.', effect: 'heal_4_hero', rarity: 'common' },
  { templateId: 'a1', name: 'Iron Totem', type: 'artifact', cost: 2, description: 'All your creatures get +1 DEF.', effect: 'aura_def_1', rarity: 'common' },
  { templateId: 'e1', name: 'Crystal Heart', type: 'enchantment', cost: 2, description: 'Attach to creature: +2/+2', effect: 'buff_2_2', rarity: 'common' },
  { templateId: 'e3', name: 'Frost Armor', type: 'enchantment', cost: 2, description: 'Attach to creature: +0/+4', effect: 'buff_0_4', rarity: 'common' },
  
  // Rares
  { templateId: 'c6', name: 'Ancient Drake', type: 'creature', cost: 5, atk: 5, def: 4, description: 'A majestic dragon from the early ages.', rarity: 'rare', evolvesTo: 'ev_c6', evolveCondition: { damageDealt: 8 } },
  { templateId: 'c7', name: 'Celestial Guard', type: 'creature', cost: 3, atk: 1, def: 6, description: 'Enemies must attack this first.', keywords: ['taunt'], rarity: 'rare' },
  { templateId: 'c8', name: 'Shadow Rogue', type: 'creature', cost: 3, atk: 4, def: 1, description: 'Can attack the enemy hero directly.', keywords: ['stealth'], rarity: 'rare' },
  { templateId: 'c9', name: 'Storm Drake', type: 'creature', cost: 4, atk: 5, def: 3, description: 'Attacks immediately upon deployment.', keywords: ['haste'], rarity: 'rare' },
  { templateId: 's3', name: 'Soul Drain', type: 'spell', cost: 4, description: 'Destroy a creature with DEF 3 or less, gain its ATK as gold.', effect: 'destroy_small_gain_gold', rarity: 'rare' },
  { templateId: 's4', name: 'Nova Blast', type: 'spell', cost: 5, description: 'Deal 2 damage to all enemy creatures.', effect: 'dmg_2_all_enemies', rarity: 'rare' },
  { templateId: 'a2', name: 'Aether Lens', type: 'artifact', cost: 3, description: 'Draw a card each turn.', effect: 'aura_draw_1', rarity: 'rare' },
  { templateId: 'a3', name: 'War Banner', type: 'artifact', cost: 4, description: 'All your creatures get +1 ATK.', effect: 'aura_atk_1', rarity: 'rare' },
  { templateId: 'e2', name: 'Blood Pact', type: 'enchantment', cost: 3, description: 'Attach to creature: +3 ATK, -1 DEF', effect: 'buff_3_m1', rarity: 'rare' },
  
  // Legendaries
  { templateId: 'c10', name: 'Void Colossus', type: 'creature', cost: 8, atk: 8, def: 8, description: 'An unstoppable force of destruction.', rarity: 'legendary' },
  { templateId: 's6', name: 'Void Rift', type: 'spell', cost: 6, description: 'Deal 6 damage to enemy hero.', effect: 'dmg_6_enemy_hero', rarity: 'legendary' },
  { templateId: 's7', name: 'Arcane Nova', type: 'spell', cost: 5, description: 'Deal 5 damage to all enemies.', effect: 'dmg_5_all', rarity: 'legendary' },
  { templateId: 'a4', name: 'Eternity Bloom', type: 'artifact', cost: 6, description: 'Heal 2 life each turn.', effect: 'aura_heal_2', rarity: 'legendary' },
  { templateId: 'c11', name: 'Celestial Titan', type: 'creature', cost: 6, atk: 6, def: 8, description: 'A divine protector of the realm.', keywords: ['taunt'], rarity: 'legendary' },
  { templateId: 's8', name: 'Soul Reaper', type: 'spell', cost: 7, description: 'Destroy any creature.', effect: 'destroy_target', rarity: 'legendary' },

  // Evolutions
  { templateId: 'ev_c1', name: 'Aether Titan', type: 'creature', cost: 0, atk: 5, def: 4, description: 'The ascended form of Aether Sprite. Evolved.', rarity: 'legendary' },
  { templateId: 'ev_c2', name: 'Stone Colossus', type: 'creature', cost: 0, atk: 6, def: 7, description: 'Ancient Golem awakened. Evolved.', rarity: 'legendary' },
  { templateId: 'ev_c6', name: 'Elder Drake', type: 'creature', cost: 0, atk: 8, def: 6, description: 'The Ancient Drake reaches its final form.', keywords: ['haste'], rarity: 'legendary' },
];

export const SHOP_ITEMS: ShopItemTemplate[] = [
  // Items
  { id: 'i1', name: 'Aether Shard', type: 'item', cost: 8, description: 'Give any creature +2 ATK for the rest of this game.', effectKey: 'perm_atk_2' },
  { id: 'i2', name: 'Crystal Ward', type: 'item', cost: 10, description: 'Give any creature +4 DEF permanently.', effectKey: 'perm_def_4' },
  { id: 'i3', name: 'Mana Infusion', type: 'item', cost: 12, description: 'Gain 3 extra Aether this turn.', effectKey: 'temp_aether_3' },
  { id: 'i4', name: 'Elixir of Fortune', type: 'item', cost: 7, description: 'Draw 2 extra cards this turn.', effectKey: 'draw_2' },
  { id: 'i5', name: 'Battle Serum', type: 'item', cost: 9, description: 'Give any creature +1 ATK and +1 DEF permanently.', effectKey: 'perm_stats_1_1' },
  { id: 'i6', name: 'Void Essence', type: 'item', cost: 15, description: 'Destroy target creature on the enemy field instantly.', effectKey: 'destroy_target_creature' },
  { id: 'i7', name: 'Phoenix Feather', type: 'item', cost: 11, description: 'Restore 8 HP to your hero.', effectKey: 'heal_8_hero' },

  // Stat Items
  { id: 'st1', name: 'Warmog\'s Crystal', type: 'stat', cost: 18, description: 'Permanently increase max HP by 8, regen 2 HP/turn.', effectKey: 'warmogs' },
  { id: 'st2', name: 'Stormrazor Gem', type: 'stat', cost: 14, description: 'Creatures deal +1 bonus damage on first attack each turn.', effectKey: 'stormrazor' },
  { id: 'st3', name: 'Sunfire Totem', type: 'stat', cost: 16, description: 'Start of your turns: deal 1 dmg to all enemy creatures.', effectKey: 'sunfire' },
  { id: 'st4', name: 'Jak\'Sho Shard', type: 'stat', cost: 20, description: 'All your creatures gain +2 ATK/+2 DEF on deploy.', effectKey: 'jaksho' },
  { id: 'st5', name: 'Rabadon\'s Crown', type: 'stat', cost: 22, description: 'Spell damage is permanently increased by 2.', effectKey: 'rabadon' },
  { id: 'st6', name: 'Thornmail Plate', type: 'stat', cost: 17, description: 'When a creature takes damage, attacker takes 1 damage.', effectKey: 'thornmail' },

  // Perks
  { id: 'p1', name: 'Soul Anchor', type: 'perk', cost: 20, description: 'Your max life is increased by 10.', effectKey: 'perk_hp_10' },
  { id: 'p2', name: 'Aether Mastery', type: 'perk', cost: 25, description: 'Gain 2 extra Aether per turn permanently.', effectKey: 'perk_aether_2' },
  { id: 'p3', name: 'Golden Touch', type: 'perk', cost: 30, description: 'Earn 2 extra gold per turn permanently.', effectKey: 'perk_gold_2' },
  { id: 'p4', name: 'Arcane Dominion', type: 'perk', cost: 35, description: 'Start each turn with 1 free card draw.', effectKey: 'perk_draw_1' },
  { id: 'p5', name: 'Void Resistance', type: 'perk', cost: 28, description: 'Reduce all damage taken by 1.', effectKey: 'perk_resist_1' },
  
  // Cards
  { id: 'c10_shop', name: 'Void Colossus', type: 'card', cost: 18, description: '8/8 Creature, costs 8 Aether.', cardTemplateId: 'c10' },
  { id: 's7_shop', name: 'Arcane Nova', type: 'card', cost: 14, description: 'Spell: Deal 5 damage to all enemies.', cardTemplateId: 's7' },
  { id: 'a4_shop', name: 'Eternity Bloom', type: 'card', cost: 15, description: 'Artifact: Heal 2 life each turn.', cardTemplateId: 'a4' },
  { id: 'c9_shop', name: 'Storm Drake', type: 'card', cost: 12, description: '5/3 Creature, costs 4 Aether, Haste.', cardTemplateId: 'c9' },
  { id: 'c11_shop', name: 'Celestial Titan', type: 'card', cost: 20, description: '6/8 Creature, Taunt.', cardTemplateId: 'c11' },
  { id: 's8_shop', name: 'Soul Reaper', type: 'card', cost: 16, description: 'Spell: Destroy any creature.', cardTemplateId: 's8' },
];

export function getCardTemplate(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find(c => c.templateId === id);
}

export function generateDeck(): CardTemplate[] {
  // Generate a starter deck of 30 cards
  const deck: CardTemplate[] = [];
  const starterIds = [
    'c1', 'c1', 'c1', 'c2', 'c2', 'c3', 'c3', 'c4', 'c4', 'c5', 'c5',
    'c7', 'c7', 'c8', 'c8',
    's1', 's1', 's1', 's2', 's2', 's5', 's5',
    'a1', 'a1', 'a2',
    'e1', 'e1', 'e3', 'e3', 'c6'
  ];
  
  for (const id of starterIds) {
    const tpl = getCardTemplate(id);
    if (tpl) deck.push(tpl);
  }
  
  // Shuffle
  return deck.sort(() => Math.random() - 0.5);
}

export const AI_NAMES = ["Arcane Apprentice", "Shadow Weaver", "Storm Sage", "Iron Golem", "Void Entity"];
