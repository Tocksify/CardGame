import { CardTemplate, CardType, CardRarity } from '../lib/cards';

export type GamePhase = 'countdown' | 'draw' | 'draft' | 'buy' | 'main' | 'combat' | 'end' | 'gameover';
export type GameMode = '8card' | 'draft';
export type MatchType = 'singleplayer' | 'multiplayer';
export type AiDifficulty = 'Novice' | 'Easy' | 'Normal' | 'Hard' | 'Expert' | 'Nightmare';

export interface CardInstance extends CardTemplate {
  instanceId: string;
}

export interface StagedSpell extends CardInstance {
  targetId?: string;
}

export interface FieldCard extends CardInstance {
  tapped: boolean;
  currentAtk: number;
  currentDef: number;
  attachments: CardInstance[];
  tempAtkBonus: number;
  tempDefBonus: number;
  turnsOnField: number;
  damageDealt: number;
  evolved: boolean;
  hasAttackedThisTurn?: boolean;
  poisonStacks: number;
  stunned: boolean;
  stunTurnsLeft: number;
  tempArmorTurns?: number;
}

export interface InventoryItem {
  instanceId: string;
  itemId: string;
  name: string;
  description: string;
  effectKey?: string;
  type?: 'item' | 'stat' | 'perk' | 'card';
}

export interface CardGameStats {
  name: string;
  type: CardType;
  damageDealt: number;
  kills: number;
  goldEarned: number;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  hp: number;
  maxHp: number;
  aether: number;
  maxAether: number;
  deck: CardInstance[];
  hand: CardInstance[];
  field: FieldCard[];
  artifactSlot: CardInstance | null;
  artifactSlotTurns: number;
  pendingSpells: StagedSpell[];
  cardsPlayedByType: Partial<Record<CardType, boolean>>;
  discardPile: CardInstance[];
  gold: number;
  inventory: InventoryItem[];
  goldPerTurn: number;
  aetherBonus: number;
  perks: string[];
  statBuffs: string[];
  elo?: number;

  damageDealtThisTurn?: number;
  bonusGoldPending?: number;

  damageTakenThisGame?: boolean;
  damageDealtThisGame?: number;
  cardsPlayedThisGame?: number;
  goldEarnedThisGame?: number;
  creaturesKilledThisGame?: number;
  cardStats?: Record<string, CardGameStats>;
  shopItemsBoughtThisGame?: number;
  isDead?: boolean;
  undyingUsed?: boolean;
  heroStunTurns?: number;
  playerStunTurns?: number;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  currentPlayerIndex: number;
  players: Player[];
  log: { id: string; msg: string; type: 'damage' | 'card' | 'gold' | 'other' }[];
  winner: number | null;
  shopOpen: boolean;
  inventoryOpen: boolean;
  targetingMode: 'none' | 'spell' | 'attack' | 'item' | 'enchantment';
  sourceId: string | null;
  pendingAction: any | null;
  gameMode: GameMode;
  matchType: MatchType;
  ranked: boolean;
  draftOptions: CardTemplate[];
  difficulty: AiDifficulty;
}

export type GameAction =
  | { type: 'START_GAME'; payload: { players: Player[]; gameMode: GameMode; matchType: MatchType; ranked: boolean; difficulty: AiDifficulty; startingPlayerIndex?: number } }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'END_TURN' }
  | { type: 'DRAW_CARD'; payload: { playerId: number; amount: number } }
  | { type: 'GIVE_CARDS'; payload: { playerId: number; cards: CardInstance[] } }
  | { type: 'SET_DRAFT_OPTIONS'; payload: CardTemplate[] }
  | { type: 'CLEAR_DRAFT_OPTIONS' }
  | { type: 'PLAY_CARD'; payload: { playerId: number; cardInstanceId: string; targetId?: string } }
  | { type: 'STAGE_SPELL'; payload: { playerId: number; cardInstanceId: string; targetId?: string } }
  | { type: 'CLEAR_PENDING_SPELLS'; payload: { playerId: number } }
  | { type: 'SELL_ARTIFACT'; payload: { playerId: number } }
  | { type: 'SELL_CREATURE'; payload: { playerId: number; instanceId: string } }
  | { type: 'REPLENISH_AETHER'; payload: { playerId: number } }
  | { type: 'BUY_SHOP_ITEM'; payload: { playerId: number; itemTemplateId: string; cost: number; itemType: string; effectKey?: string; cardTemplate?: CardTemplate; name: string; description: string } }
  | { type: 'USE_INVENTORY'; payload: { playerId: number; instanceId: string; targetId?: string } }
  | { type: 'ATTACK'; payload: { attackerPlayerId: number; attackerInstanceId: string; targetPlayerId: number; targetInstanceId?: string; damageOverride?: number } }
  | { type: 'DAMAGE'; payload: { targetPlayerId: number; targetInstanceId?: string; amount: number; sourcePlayerId?: number; sourceInstanceId?: string; bypassResist?: boolean; bypassArmor?: boolean } }
  | { type: 'HEAL'; payload: { targetPlayerId: number; amount: number } }
  | { type: 'ADD_GOLD'; payload: { playerId: number; amount: number } }
  | { type: 'ADD_LOG'; payload: { msg: string; type?: 'damage' | 'card' | 'gold' | 'other' } }
  | { type: 'TOGGLE_SHOP'; payload: boolean }
  | { type: 'TOGGLE_INVENTORY'; payload: boolean }
  | { type: 'SET_TARGETING'; payload: { mode: GameState['targetingMode']; sourceId: string | null; pendingAction: any | null } }
  | { type: 'CLEAR_TARGETING' }
  | { type: 'EVOLVE_CREATURE'; payload: { playerId: number; instanceId: string; newTemplate: CardTemplate } }
  | { type: 'RECORD_KILL'; payload: { playerId: number } }
  | { type: 'APPLY_POISON'; payload: { playerId: number; instanceId: string; stacks: number } }
  | { type: 'APPLY_STUN'; payload: { playerId: number; instanceId: string; turns: number } }
  | { type: 'PROCESS_STATUS_EFFECTS'; payload: { playerId: number } }
  | { type: 'REMOVE_POISON'; payload: { playerId: number; instanceId: string } }
  | { type: 'REMOVE_STUN'; payload: { playerId: number; instanceId: string } }
  | { type: 'MARK_DEAD'; payload: { playerId: number } }
  | { type: 'GIVE_STARTING_CARDS'; payload: { playerId: number; cards: CardInstance[] } }
  | { type: 'STEAL_GOLD'; payload: { fromPlayerId: number; toPlayerId: number; amount: number } }
  | { type: 'RESET_BONUS_GOLD'; payload: { playerId: number } }
  | { type: 'RECORD_CARD_STATS'; payload: { playerId: number; cardInstanceId: string; damage?: number; kills?: number; goldEarned?: number } }
  | { type: 'SELL_HAND_CARD'; payload: { playerId: number; instanceId: string } }
  | { type: 'EQUIP_INVENTORY_ITEM'; payload: { playerId: number; instanceId: string } }
  | { type: 'STUN_HERO'; payload: { playerId: number } }
  | { type: 'STUN_PLAYER'; payload: { playerId: number } };

export const initialGameState: GameState = {
  phase: 'countdown',
  turn: 1,
  currentPlayerIndex: 0,
  players: [],
  log: [],
  winner: null,
  shopOpen: false,
  inventoryOpen: false,
  targetingMode: 'none',
  sourceId: null,
  pendingAction: null,
  gameMode: '8card',
  matchType: 'singleplayer',
  ranked: false,
  draftOptions: [],
  difficulty: 'Normal',
};

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function applyAuraToField(field: FieldCard[], effect: string | undefined, sign: 1 | -1): FieldCard[] {
  if (!effect) return field;
  return field.map(c => {
    let atk = c.currentAtk;
    let def = c.currentDef;
    if (effect === 'aura_atk_1') atk += sign;
    if (effect === 'aura_def_1') def += sign;
    if (effect === 'aura_atk_2') atk += sign * 2;
    if (effect === 'aura_def_2') def += sign * 2;
    if (effect === 'aura_atk_2_def_2') { atk += sign * 2; def += sign * 2; }
    return { ...c, currentAtk: atk, currentDef: def };
  });
}

function getArmorReduction(card: FieldCard): number {
  if (card.keywords?.includes('heavy_armor')) return 3;
  if ((card.tempArmorTurns ?? 0) > 0) return 3;
  return 0;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialGameState,
        players: action.payload.players,
        currentPlayerIndex: action.payload.startingPlayerIndex ?? 0,
        gameMode: action.payload.gameMode,
        matchType: action.payload.matchType,
        ranked: action.payload.ranked,
        difficulty: action.payload.difficulty,
        log: [{ id: generateId(), msg: 'Game started. The arcane battle begins!', type: 'other' }],
      };

    case 'SET_PHASE':
      return { ...state, phase: action.payload };

    case 'TOGGLE_SHOP':
      return { ...state, shopOpen: action.payload };

    case 'TOGGLE_INVENTORY':
      return { ...state, inventoryOpen: action.payload };

    case 'ADD_LOG':
      return {
        ...state,
        log: [...state.log, { id: generateId(), msg: action.payload.msg, type: action.payload.type || 'other' }].slice(-25),
      };

    case 'SET_TARGETING':
      return { ...state, targetingMode: action.payload.mode, sourceId: action.payload.sourceId, pendingAction: action.payload.pendingAction };

    case 'CLEAR_TARGETING':
      return { ...state, targetingMode: 'none', sourceId: null, pendingAction: null };

    case 'SET_DRAFT_OPTIONS':
      return { ...state, draftOptions: action.payload, phase: 'draft' };

    case 'CLEAR_DRAFT_OPTIONS':
      return { ...state, draftOptions: [] };

    case 'ADVANCE_PHASE': {
      const phases: GamePhase[] = ['draw', 'buy', 'main', 'combat', 'end'];
      const currentIndex = phases.indexOf(state.phase as any);
      if (currentIndex === -1 || currentIndex === phases.length - 1) return state;
      return { ...state, phase: phases[currentIndex + 1] };
    }

    case 'REPLENISH_AETHER':
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== action.payload.playerId) return p;
          // Full player stun: skip entire turn — decrement and zero aether
          if ((p.playerStunTurns ?? 0) > 0) {
            return { ...p, aether: 0, playerStunTurns: (p.playerStunTurns ?? 1) - 1 };
          }
          // Hero stunned: lose all aether this turn, decrement stun
          if ((p.heroStunTurns ?? 0) > 0) {
            return { ...p, aether: 0, heroStunTurns: (p.heroStunTurns ?? 1) - 1 };
          }
          return { ...p, aether: p.maxAether + p.aetherBonus };
        }),
      };

    case 'STUN_HERO':
      return {
        ...state,
        players: state.players.map(p =>
          p.id !== action.payload.playerId ? p : { ...p, heroStunTurns: 1 }
        ),
      };

    case 'STUN_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id !== action.payload.playerId ? p : { ...p, playerStunTurns: 1 }
        ),
      };

    case 'END_TURN': {
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const isNewTurn = nextIndex === 0;

      const newPlayers = state.players.map((p, i) => {
        let newP = { ...p };
        if (i === state.currentPlayerIndex) {
          newP.field = newP.field.map(c => ({
            ...c,
            turnsOnField: c.turnsOnField + 1,
            tempArmorTurns: Math.max(0, (c.tempArmorTurns ?? 0) - 1),
          }));
          if (newP.artifactSlot) newP.artifactSlotTurns += 1;
          // Save damage-based gold bonus for next draw phase, reset counter
          newP.bonusGoldPending = Math.floor((newP.damageDealtThisTurn || 0) * 20);
          newP.damageDealtThisTurn = 0;
        }
        if (i === nextIndex) {
          newP.field = newP.field.map(c => ({
            ...c, tapped: false, tempAtkBonus: 0, tempDefBonus: 0, hasAttackedThisTurn: false,
          }));
          const newMaxAether = Math.min(10, p.maxAether + 1);
          newP.maxAether = newMaxAether;
          newP.aether = newMaxAether + p.aetherBonus;
          newP.cardsPlayedByType = {};
        }
        return newP;
      });

      return {
        ...state,
        currentPlayerIndex: nextIndex,
        turn: isNewTurn ? state.turn + 1 : state.turn,
        phase: 'draw',
        players: newPlayers,
        shopOpen: false,
        targetingMode: 'none',
      };
    }

    case 'DRAW_CARD': {
      const { playerId, amount } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const toDraw = Math.min(amount, p.deck.length);
          if (toDraw === 0) return p;
          return {
            ...p,
            deck: p.deck.slice(toDraw),
            hand: [...p.hand, ...p.deck.slice(0, toDraw)],
          };
        }),
      };
    }

    case 'GIVE_CARDS': {
      const { playerId, cards } = action.payload;
      return {
        ...state,
        players: state.players.map(p =>
          p.id !== playerId ? p : { ...p, hand: [...p.hand, ...cards] }
        ),
        draftOptions: [],
        phase: 'buy',
      };
    }

    case 'MARK_DEAD': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id !== action.payload.playerId ? p : { ...p, isDead: true }
        ),
      };
    }

    case 'APPLY_POISON': {
      const { playerId, instanceId, stacks } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            field: p.field.map(c =>
              c.instanceId === instanceId
                ? { ...c, poisonStacks: c.poisonStacks + stacks }
                : c
            ),
          };
        }),
      };
    }

    case 'APPLY_STUN': {
      const { playerId, instanceId, turns } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            field: p.field.map(c =>
              c.instanceId === instanceId
                ? { ...c, stunned: true, stunTurnsLeft: Math.max(c.stunTurnsLeft, turns) }
                : c
            ),
          };
        }),
      };
    }

    case 'REMOVE_POISON': {
      const { playerId, instanceId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            field: p.field.map(c =>
              c.instanceId === instanceId ? { ...c, poisonStacks: 0 } : c
            ),
          };
        }),
      };
    }

    case 'REMOVE_STUN': {
      const { playerId, instanceId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            field: p.field.map(c =>
              c.instanceId === instanceId ? { ...c, stunned: false, stunTurnsLeft: 0 } : c
            ),
          };
        }),
      };
    }

    case 'PROCESS_STATUS_EFFECTS': {
      const { playerId } = action.payload;
      let newPlayers = state.players.map(p => {
        if (p.id !== playerId) return p;
        const newField: FieldCard[] = [];
        for (const c of p.field) {
          let card = { ...c };
          // Poison tick
          if (card.poisonStacks > 0) {
            card.currentDef = card.currentDef - card.poisonStacks;
            card.poisonStacks = Math.max(0, card.poisonStacks - 1);
          }
          // Stun tick
          if (card.stunned) {
            card.stunTurnsLeft = Math.max(0, card.stunTurnsLeft - 1);
            if (card.stunTurnsLeft <= 0) card.stunned = false;
          }
          if (card.currentDef > 0) newField.push(card);
        }
        return { ...p, field: newField };
      });

      const alivePlayers = newPlayers.filter(p => p.hp > 0 && !p.isDead);
      let winner = state.winner;
      let phase = state.phase;
      if (alivePlayers.length === 1 && state.players.length > 1) {
        winner = alivePlayers[0].id;
        phase = 'gameover';
      }

      return { ...state, players: newPlayers, winner, phase };
    }

    case 'BUY_SHOP_ITEM': {
      const { playerId, cost, itemType, name, description, effectKey, cardTemplate } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          if (p.gold < cost) return p;
          let newP = { ...p, gold: p.gold - cost, shopItemsBoughtThisGame: (p.shopItemsBoughtThisGame || 0) + 1 };

          if (itemType === 'card' && cardTemplate) {
            const newCard: CardInstance = { instanceId: generateId(), ...cardTemplate };
            newP.hand = [...newP.hand, newCard];
          } else if (itemType === 'item') {
            if (newP.inventory.length < 8) {
              if (effectKey === 'ironheart') {
                newP.maxHp += 20; newP.hp = Math.min(newP.hp + 20, newP.maxHp);
              }
              newP.inventory = [...newP.inventory, { instanceId: generateId(), itemId: action.payload.itemTemplateId, type: 'item', name, description, effectKey }];
            }
          } else if (itemType === 'stat') {
            if (newP.inventory.length < 8) {
              newP.inventory = [...newP.inventory, { instanceId: generateId(), itemId: action.payload.itemTemplateId, type: 'stat', name, description, effectKey }];
              if (effectKey) newP.statBuffs = [...newP.statBuffs, effectKey];
            }
          } else if (itemType === 'perk') {
            newP.perks = [...newP.perks, effectKey || ''];
            if (effectKey === 'perk_hp_10') { newP.maxHp += 10; newP.hp += 10; }
            else if (effectKey === 'perk_aether_2') newP.aetherBonus += 2;
            else if (effectKey === 'perk_gold_2') newP.goldPerTurn += 50;
          }
          return newP;
        }),
      };
    }

    case 'STAGE_SPELL': {
      const { playerId, cardInstanceId, targetId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const card = p.hand.find(c => c.instanceId === cardInstanceId);
          if (!card || card.type !== 'spell') return p;
          if (p.aether < card.cost || p.cardsPlayedByType['spell']) return p;
          const cardStats = { ...(p.cardStats || {}) };
          cardStats[card.instanceId] = cardStats[card.instanceId] || {
            name: card.name, type: card.type, damageDealt: 0, kills: 0, goldEarned: 0,
          };
          return {
            ...p,
            hand: p.hand.filter(c => c.instanceId !== cardInstanceId),
            aether: p.aether - card.cost,
            pendingSpells: [...p.pendingSpells, { ...card, targetId }],
            cardsPlayedByType: { ...p.cardsPlayedByType, spell: true },
            cardsPlayedThisGame: (p.cardsPlayedThisGame || 0) + 1,
            cardStats,
          };
        }),
      };
    }

    case 'CLEAR_PENDING_SPELLS':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId ? { ...p, pendingSpells: [] } : p
        ),
      };

    case 'PLAY_CARD': {
      const { playerId, cardInstanceId, targetId } = action.payload;
      const newPlayers = state.players.map(p => {
        if (p.id !== playerId) return p;
        const cardToPlay = p.hand.find(c => c.instanceId === cardInstanceId);
        if (!cardToPlay) return p;
        if (p.aether < cardToPlay.cost) return p;
        if (cardToPlay.type === 'spell') return p;
        if (p.cardsPlayedByType[cardToPlay.type]) return p;

        const newHand = p.hand.filter(c => c.instanceId !== cardInstanceId);
        const newAether = p.aether - cardToPlay.cost;
        const cardStats = { ...(p.cardStats || {}) };
        cardStats[cardToPlay.instanceId] = cardStats[cardToPlay.instanceId] || {
          name: cardToPlay.name, type: cardToPlay.type, damageDealt: 0, kills: 0, goldEarned: 0,
        };
        let newField = p.field;
        let newArtifactSlot = p.artifactSlot;
        let newArtifactSlotTurns = p.artifactSlotTurns;

        if (cardToPlay.type === 'character') {
          if (p.field.length >= 4) return p;
          let bonusAtk = 0, bonusDef = 0;
          if (p.statBuffs.includes('jaksho')) { bonusAtk += 2; bonusDef += 2; }
          if (p.perks.includes('perk_deploy_bonus')) { bonusAtk += 1; bonusDef += 1; }
          if (p.artifactSlot?.effect === 'aura_atk_1') bonusAtk += 1;
          if (p.artifactSlot?.effect === 'aura_def_1') bonusDef += 1;
          // Electric aura from Thunder Titan
          const hasElectricAura = p.field.some(c => c.keywords?.includes('electric_aura'));
          if (hasElectricAura) bonusAtk += 1;

          const newCard: FieldCard = {
            ...cardToPlay,
            currentAtk: (cardToPlay.atk || 0) + bonusAtk,
            currentDef: (cardToPlay.def || 1) + bonusDef,
            tapped: cardToPlay.keywords?.includes('haste') ? false : true,
            attachments: [], tempAtkBonus: 0, tempDefBonus: 0,
            turnsOnField: 0, damageDealt: 0, evolved: false,
            poisonStacks: 0, stunned: false, stunTurnsLeft: 0,
          };
          newField = [...p.field, newCard];
        } else if (cardToPlay.type === 'artifact') {
          if (p.artifactSlot && p.artifactSlotTurns < 2) return p;
          newField = applyAuraToField(p.field, cardToPlay.effect, 1);
          if (p.artifactSlot) newField = applyAuraToField(newField, p.artifactSlot.effect, -1);
          newArtifactSlot = cardToPlay;
          newArtifactSlotTurns = 0;
        }

        return {
          ...p, hand: newHand, aether: newAether, field: newField,
          artifactSlot: newArtifactSlot, artifactSlotTurns: newArtifactSlotTurns,
          cardsPlayedByType: { ...p.cardsPlayedByType, [cardToPlay.type]: true },
          cardsPlayedThisGame: (p.cardsPlayedThisGame || 0) + 1,
          cardStats,
        };
      });
      return { ...state, players: newPlayers };
    }

    case 'SELL_ARTIFACT':
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== action.payload.playerId || !p.artifactSlot) return p;
          const sellPrice = p.artifactSlot.cost * 75;
          // Also remove statBuff if this artifact came from a stat item
          const removedEffect = p.artifactSlot.effect;
          const newStatBuffs = removedEffect
            ? p.statBuffs.filter((b, idx) => {
                // Remove at most one occurrence
                const firstIdx = p.statBuffs.indexOf(removedEffect);
                return idx !== firstIdx;
              })
            : p.statBuffs;
          return {
            ...p,
            field: applyAuraToField(p.field, p.artifactSlot.effect, -1),
            artifactSlot: null, artifactSlotTurns: 0,
            gold: p.gold + sellPrice,
            goldEarnedThisGame: (p.goldEarnedThisGame || 0) + sellPrice,
            statBuffs: newStatBuffs,
          };
        }),
      };

    case 'EQUIP_INVENTORY_ITEM': {
      const { playerId, instanceId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const item = p.inventory.find(i => i.instanceId === instanceId);
          if (!item) return p;
          // Blocked if current artifact slot is locked
          if (p.artifactSlot && p.artifactSlotTurns < 2) return p;
          // Undo old artifact aura
          const newField = applyAuraToField(p.field, p.artifactSlot?.effect, -1);
          // Remove old artifact statBuff if applicable
          let newStatBuffs = p.statBuffs;
          if (p.artifactSlot?.effect) {
            const firstIdx = p.statBuffs.indexOf(p.artifactSlot.effect);
            if (firstIdx !== -1) {
              newStatBuffs = newStatBuffs.filter((_, i) => i !== firstIdx);
            }
          }
          // If this is a stat item, its effectKey was applied to statBuffs on purchase —
          // we keep it there; the CardInstance.effect field drives aura logic.
          // If it's a consumable item type, we just display it in the slot without re-firing.
          const newCard: CardInstance = {
            instanceId: item.instanceId,
            templateId: item.itemId,
            name: item.name,
            description: item.description,
            type: 'artifact',
            cost: 0,
            effect: item.effectKey,
            keywords: [],
            rarity: 'common',
          };
          return {
            ...p,
            inventory: p.inventory.filter(i => i.instanceId !== instanceId),
            artifactSlot: newCard,
            artifactSlotTurns: 0,
            field: newField,
            statBuffs: newStatBuffs,
          };
        }),
      };
    }

    case 'SELL_CREATURE': {
      const { playerId, instanceId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const creature = p.field.find(c => c.instanceId === instanceId);
          if (!creature) return p;
          const rarityMult = creature.rarity === 'legendary' || creature.rarity === 'secret' ? 100 : creature.rarity === 'rare' ? 75 : 50;
          const sellPrice = creature.cost * rarityMult;
          return {
            ...p,
            field: p.field.filter(c => c.instanceId !== instanceId),
            gold: p.gold + sellPrice,
            goldEarnedThisGame: (p.goldEarnedThisGame || 0) + sellPrice,
          };
        }),
      };
    }

    case 'ATTACK': {
      const { attackerPlayerId, attackerInstanceId, targetPlayerId, targetInstanceId, damageOverride } = action.payload;
      let attackerAtk = damageOverride || 0;
      let actualDamage = 0;
      let attackKilled = false;

      let newPlayers = state.players.map(p => {
        if (p.id === attackerPlayerId) {
          return {
            ...p,
            field: p.field.map(c => {
              if (c.instanceId === attackerInstanceId) {
                if (damageOverride === undefined) attackerAtk = c.currentAtk + c.tempAtkBonus;
                return { ...c, tapped: true, hasAttackedThisTurn: true, damageDealt: c.damageDealt + attackerAtk };
              }
              return c;
            }),
          };
        }
        return p;
      });

      newPlayers = newPlayers.map(p => {
        if (p.id === targetPlayerId) {
          if (targetInstanceId) {
            const targetCard = p.field.find(c => c.instanceId === targetInstanceId);
            if (targetCard) {
              actualDamage = Math.max(1, attackerAtk - getArmorReduction(targetCard));
              attackKilled = targetCard.currentDef - actualDamage <= 0;
            }
            return {
              ...p,
              field: p.field.map(c => {
                if (c.instanceId === targetInstanceId) {
                  const armor = getArmorReduction(c);
                  const dmg = Math.max(1, attackerAtk - armor);
                  return { ...c, currentDef: c.currentDef - dmg };
                }
                return c;
              }).filter(c => c.currentDef > 0),
            };
          } else {
            const resist = p.perks.includes('perk_resist_1') ? 1 : 0;
            let finalDmg = Math.max(0, attackerAtk - resist);
            // Undying perk: survive lethal with 1 HP
            if (finalDmg >= p.hp && p.perks.includes('perk_undying') && !p.undyingUsed) {
              finalDmg = p.hp - 1;
            }
            actualDamage = finalDmg;
            return { ...p, hp: Math.max(0, p.hp - finalDmg), damageTakenThisGame: true };
          }
        }
        return p;
      });

      // Track damage dealt by attacker for bonus-gold system
      newPlayers = newPlayers.map(p => {
        if (p.id === attackerPlayerId) {
          const cardStats = { ...(p.cardStats || {}) };
          const attackerCard = p.field.find(c => c.instanceId === attackerInstanceId);
          const previous = cardStats[attackerInstanceId] || {
            name: attackerCard?.name || 'Unknown card',
            type: attackerCard?.type || 'character',
            damageDealt: 0, kills: 0, goldEarned: 0,
          };
          cardStats[attackerInstanceId] = {
            ...previous,
            damageDealt: previous.damageDealt + actualDamage,
            kills: previous.kills + (attackKilled ? 1 : 0),
            goldEarned: previous.goldEarned + (attackKilled ? 50 : 0),
          };
          return {
            ...p,
            damageDealtThisTurn: (p.damageDealtThisTurn || 0) + actualDamage,
            damageDealtThisGame: (p.damageDealtThisGame || 0) + actualDamage,
            cardStats,
          };
        }
        return p;
      });

      const alivePlayers = newPlayers.filter(p => p.hp > 0 && !p.isDead);
      let winner = state.winner;
      let phase = state.phase;
      if (alivePlayers.length === 1 && state.players.length > 1) { winner = alivePlayers[0].id; phase = 'gameover'; }

      return { ...state, players: newPlayers, winner, phase };
    }

    case 'ADD_GOLD':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, gold: p.gold + action.payload.amount, goldEarnedThisGame: (p.goldEarnedThisGame || 0) + action.payload.amount }
            : p
        ),
      };

    case 'DAMAGE': {
      const { targetPlayerId, targetInstanceId, amount, sourcePlayerId, sourceInstanceId, bypassResist, bypassArmor } = action.payload;
      let dealtAmount = 0;
      let sourceKilled = false;

      let newPlayers = state.players.map(p => {
        if (p.id !== targetPlayerId) return p;
        let actualAmount = amount;
        if (p.perks.includes('perk_resist_1') && !bypassResist) actualAmount = Math.max(1, actualAmount - 1);

        if (targetInstanceId) {
          return {
            ...p,
            field: p.field.map(c => {
              if (c.instanceId !== targetInstanceId) return c;
              const armor = bypassArmor ? 0 : getArmorReduction(c);
              const dmg = Math.max(1, actualAmount - armor);
              dealtAmount = dmg;
              sourceKilled = c.currentDef - dmg <= 0;
              return { ...c, currentDef: c.currentDef - dmg };
            }).filter(c => c.currentDef > 0),
          };
        } else {
          let finalDmg = Math.max(0, actualAmount);
          // Undying perk
          if (finalDmg >= p.hp && p.perks.includes('perk_undying') && !p.undyingUsed) {
            finalDmg = p.hp - 1;
          }
          dealtAmount = finalDmg;
          return { ...p, hp: Math.max(0, p.hp - finalDmg), damageTakenThisGame: true };
        }
      });

      if (sourcePlayerId !== undefined && sourceInstanceId) {
        newPlayers = newPlayers.map(p => {
          if (p.id !== sourcePlayerId) return p;
          const sourceCard = p.field.find(c => c.instanceId === sourceInstanceId)
            || p.hand.find(c => c.instanceId === sourceInstanceId)
            || p.pendingSpells.find(c => c.instanceId === sourceInstanceId);
          const existing = p.cardStats?.[sourceInstanceId] || {
            name: sourceCard?.name || 'Unknown card',
            type: sourceCard?.type || 'spell',
            damageDealt: 0,
            kills: 0,
            goldEarned: 0,
          };
          return {
            ...p,
            damageDealtThisGame: (p.damageDealtThisGame || 0) + dealtAmount,
            cardStats: {
              ...(p.cardStats || {}),
              [sourceInstanceId]: {
                ...existing,
                damageDealt: existing.damageDealt + dealtAmount,
                kills: existing.kills + (sourceKilled ? 1 : 0),
              },
            },
          };
        });
      }

      const alivePlayers = newPlayers.filter(p => p.hp > 0 && !p.isDead);
      let winner = state.winner;
      let phase = state.phase;
      if (alivePlayers.length === 1 && state.players.length > 1) { winner = alivePlayers[0].id; phase = 'gameover'; }

      return { ...state, players: newPlayers, winner, phase };
    }

    case 'HEAL':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.targetPlayerId
            ? { ...p, hp: Math.min(p.maxHp, p.hp + action.payload.amount) }
            : p
        ),
      };

    case 'USE_INVENTORY': {
      const { playerId, instanceId, targetId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const item = p.inventory.find(i => i.instanceId === instanceId);
          if (!item) return p;
          let newField = p.field;
          let newHp = p.hp;
          let newMaxHp = p.maxHp;
          if (item.effectKey === 'perm_atk_2' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, currentAtk: c.currentAtk + 2 } : c);
          else if (item.effectKey === 'perm_atk_3' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, currentAtk: c.currentAtk + 3 } : c);
          else if (item.effectKey === 'perm_def_4' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, currentDef: c.currentDef + 4 } : c);
          else if (item.effectKey === 'perm_stats_1_1' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, currentAtk: c.currentAtk + 1, currentDef: c.currentDef + 1 } : c);
          else if (item.effectKey === 'heal_char_3' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, currentDef: c.currentDef + 3 } : c);
          else if (item.effectKey === 'heal_8_hero') newHp = Math.min(p.maxHp, p.hp + 8);
          else if (item.effectKey === 'heal_20_hero') newHp = Math.min(p.maxHp, p.hp + 20);
          else if (item.effectKey === 'heal_35_hero') newHp = Math.min(p.maxHp, p.hp + 35);
          else if (item.effectKey === 'heal_15_self') newHp = Math.min(p.maxHp, p.hp + 15);
          else if (item.effectKey === 'heal_all_chars_3')
            newField = newField.map(c => ({ ...c, currentDef: c.currentDef + 3 }));
          else if (item.effectKey === 'cure_poison' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, poisonStacks: 0 } : c);
          else if (item.effectKey === 'cure_stun' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, stunned: false, stunTurnsLeft: 0 } : c);
          else if (item.effectKey === 'temp_armor' && targetId)
            newField = newField.map(c => c.instanceId === targetId ? { ...c, tempArmorTurns: 2 } : c);
          return {
            ...p, field: newField, hp: newHp, maxHp: newMaxHp,
            inventory: item.effectKey === 'ironheart'
              ? p.inventory
              : p.inventory.filter(i => i.instanceId !== instanceId),
          };
        }),
      };
    }

    case 'EVOLVE_CREATURE': {
      const { playerId, instanceId, newTemplate } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            field: p.field.map(c => {
              if (c.instanceId !== instanceId) return c;
              return {
                ...c,
                templateId: newTemplate.templateId, name: newTemplate.name,
                description: newTemplate.description,
                currentAtk: newTemplate.atk || 0, currentDef: newTemplate.def || 1,
                rarity: newTemplate.rarity, evolved: true, keywords: newTemplate.keywords,
              };
            }),
          };
        }),
      };
    }

    case 'RECORD_KILL':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, creaturesKilledThisGame: (p.creaturesKilledThisGame || 0) + 1 }
            : p
        ),
      };

    case 'GIVE_STARTING_CARDS': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id !== action.payload.playerId ? p : { ...p, hand: [...p.hand, ...action.payload.cards] }
        ),
      };
    }

    case 'STEAL_GOLD': {
      const { fromPlayerId, toPlayerId, amount } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id === fromPlayerId) return { ...p, gold: Math.max(0, p.gold - amount) };
          if (p.id === toPlayerId) return { ...p, gold: p.gold + amount, goldEarnedThisGame: (p.goldEarnedThisGame || 0) + amount };
          return p;
        }),
      };
    }

    case 'RESET_BONUS_GOLD':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId ? { ...p, bonusGoldPending: 0 } : p
        ),
      };

    case 'RECORD_CARD_STATS': {
      const { playerId, cardInstanceId, damage = 0, kills = 0, goldEarned = 0 } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const existing = p.cardStats?.[cardInstanceId];
          const fallbackCard = p.field.find(c => c.instanceId === cardInstanceId)
            || p.hand.find(c => c.instanceId === cardInstanceId)
            || p.pendingSpells.find(c => c.instanceId === cardInstanceId);
          const stat = existing || {
            name: fallbackCard?.name || 'Unknown card',
            type: fallbackCard?.type || 'spell',
            damageDealt: 0,
            kills: 0,
            goldEarned: 0,
          };
          return {
            ...p,
            cardStats: {
              ...(p.cardStats || {}),
              [cardInstanceId]: {
                ...stat,
                damageDealt: stat.damageDealt + damage,
                kills: stat.kills + kills,
                goldEarned: stat.goldEarned + goldEarned,
              },
            },
          };
        }),
      };
    }

    case 'SELL_HAND_CARD': {
      const { playerId, instanceId } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          const card = p.hand.find(c => c.instanceId === instanceId);
          if (!card) return p;
          const rarityMult = card.rarity === 'legendary' || card.rarity === 'secret' ? 50
            : card.rarity === 'rare' ? 35 : 20;
          const sellPrice = Math.max(10, card.cost * rarityMult);
          return {
            ...p,
            hand: p.hand.filter(c => c.instanceId !== instanceId),
            gold: p.gold + sellPrice,
            goldEarnedThisGame: (p.goldEarnedThisGame || 0) + sellPrice,
          };
        }),
      };
    }

    default:
      return state;
  }
}
