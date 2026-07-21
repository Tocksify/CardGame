import { CardTemplate, CardType, CardRarity } from '../lib/cards';

export type GamePhase = 'countdown' | 'draw' | 'buy' | 'main' | 'combat' | 'end' | 'gameover';

export interface CardInstance extends CardTemplate {
  instanceId: string;
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
}

export interface InventoryItem {
  instanceId: string;
  itemId: string;
  name: string;
  description: string;
  effectKey?: string;
  type?: 'item' | 'stat' | 'perk' | 'card';
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
  artifacts: CardInstance[];
  discardPile: CardInstance[];
  gold: number;
  inventory: InventoryItem[];
  goldPerTurn: number;
  aetherBonus: number;
  perks: string[];
  statBuffs: string[];
  
  // Stats tracking for achievements
  damageTakenThisGame?: boolean;
  cardsPlayedThisGame?: number;
  goldEarnedThisGame?: number;
  creaturesKilledThisGame?: number;
  shopItemsBoughtThisGame?: number;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  currentPlayerIndex: number;
  players: Player[];
  log: { id: string, msg: string, type: 'damage' | 'card' | 'gold' | 'other' }[];
  winner: number | null;
  shopOpen: boolean;
  inventoryOpen: boolean;
  targetingMode: 'none' | 'spell' | 'attack' | 'item' | 'enchantment';
  sourceId: string | null; 
  pendingAction: any | null; 
}

export type GameAction =
  | { type: 'START_GAME'; payload: { players: Player[] } }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'END_TURN' }
  | { type: 'DRAW_CARD'; payload: { playerId: number; amount: number } }
  | { type: 'PLAY_CARD'; payload: { playerId: number; cardInstanceId: string; targetId?: string } }
  | { type: 'BUY_SHOP_ITEM'; payload: { playerId: number; itemTemplateId: string; cost: number; itemType: string; effectKey?: string; cardTemplate?: CardTemplate; name: string; description: string } }
  | { type: 'USE_INVENTORY'; payload: { playerId: number; instanceId: string; targetId?: string } }
  | { type: 'ATTACK'; payload: { attackerPlayerId: number; attackerInstanceId: string; targetPlayerId: number; targetInstanceId?: string, damageOverride?: number } }
  | { type: 'DAMAGE'; payload: { targetPlayerId: number; targetInstanceId?: string; amount: number; sourcePlayerId?: number; sourceInstanceId?: string; bypassResist?: boolean } }
  | { type: 'HEAL'; payload: { targetPlayerId: number; amount: number } }
  | { type: 'ADD_GOLD'; payload: { playerId: number; amount: number } }
  | { type: 'ADD_LOG'; payload: { msg: string, type?: 'damage' | 'card' | 'gold' | 'other' } }
  | { type: 'TOGGLE_SHOP'; payload: boolean }
  | { type: 'TOGGLE_INVENTORY'; payload: boolean }
  | { type: 'SET_TARGETING'; payload: { mode: GameState['targetingMode'], sourceId: string | null, pendingAction: any | null } }
  | { type: 'CLEAR_TARGETING' }
  | { type: 'EVOLVE_CREATURE'; payload: { playerId: number; instanceId: string; newTemplate: CardTemplate } }
  | { type: 'RECORD_KILL'; payload: { playerId: number } };

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
};

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialGameState,
        players: action.payload.players,
        log: [{ id: generateId(), msg: 'Game started. Match begins!', type: 'other' }],
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
        log: [...state.log, { id: generateId(), msg: action.payload.msg, type: action.payload.type || 'other' }].slice(-20) 
      };

    case 'SET_TARGETING':
      return {
        ...state,
        targetingMode: action.payload.mode,
        sourceId: action.payload.sourceId,
        pendingAction: action.payload.pendingAction,
      };

    case 'CLEAR_TARGETING':
      return { ...state, targetingMode: 'none', sourceId: null, pendingAction: null };

    case 'ADVANCE_PHASE': {
      const phases: GamePhase[] = ['draw', 'buy', 'main', 'combat', 'end'];
      const currentIndex = phases.indexOf(state.phase);
      if (currentIndex === -1 || currentIndex === phases.length - 1) {
        return state; 
      }
      return { ...state, phase: phases[currentIndex + 1] };
    }

    case 'END_TURN': {
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const isNewTurn = nextIndex === 0;
      
      const newPlayers = state.players.map((p, i) => {
        let newP = { ...p };
        // Increment turns on field for the player whose turn just ended
        if (i === state.currentPlayerIndex) {
          newP.field = newP.field.map(c => ({ ...c, turnsOnField: c.turnsOnField + 1 }));
        }

        if (i === nextIndex) {
          // Untap creatures for the next player
          newP.field = newP.field.map(c => ({ 
            ...c, tapped: false, tempAtkBonus: 0, tempDefBonus: 0, hasAttackedThisTurn: false 
          }));
          const newMaxAether = Math.min(10, p.maxAether + 1);
          newP.maxAether = newMaxAether;
          newP.aether = newMaxAether + p.aetherBonus;
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
          const drawn = p.deck.slice(0, toDraw);
          return {
            ...p,
            deck: p.deck.slice(toDraw),
            hand: [...p.hand, ...drawn],
          };
        }),
      };
    }

    case 'BUY_SHOP_ITEM': {
      const { playerId, cost, itemType, name, description, effectKey, cardTemplate } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id !== playerId) return p;
          if (p.gold < cost) return p;
          
          let newP = { 
            ...p, 
            gold: p.gold - cost,
            shopItemsBoughtThisGame: (p.shopItemsBoughtThisGame || 0) + 1
          };
          
          if (itemType === 'card' && cardTemplate) {
            const newCard: CardInstance = {
              instanceId: generateId(),
              templateId: cardTemplate.templateId,
              name: cardTemplate.name,
              type: cardTemplate.type,
              cost: cardTemplate.cost,
              atk: cardTemplate.atk,
              def: cardTemplate.def,
              description: cardTemplate.description,
              effect: cardTemplate.effect,
              keywords: cardTemplate.keywords,
              rarity: cardTemplate.rarity,
              evolvesTo: cardTemplate.evolvesTo,
              evolveCondition: cardTemplate.evolveCondition
            };
            newP.hand = [...newP.hand, newCard]; 
          } else if (itemType === 'item') {
            if (newP.inventory.length < 8) {
              newP.inventory = [...newP.inventory, {
                instanceId: generateId(),
                itemId: action.payload.itemTemplateId,
                type: 'item',
                name,
                description,
                effectKey
              }];
            }
          } else if (itemType === 'stat') {
             if (newP.inventory.length < 8) {
              newP.inventory = [...newP.inventory, {
                instanceId: generateId(),
                itemId: action.payload.itemTemplateId,
                type: 'stat',
                name,
                description,
                effectKey
              }];
              // Immediately apply permanent perks from stats
              if (effectKey) newP.statBuffs = [...newP.statBuffs, effectKey];
              if (effectKey === 'warmogs') {
                 newP.maxHp += 8;
                 newP.hp += 8;
              }
             }
          } else if (itemType === 'perk') {
            newP.perks = [...newP.perks, effectKey || ''];
            if (effectKey === 'perk_hp_10') {
              newP.maxHp += 10;
              newP.hp += 10;
            } else if (effectKey === 'perk_aether_2') {
              newP.aetherBonus += 2;
            } else if (effectKey === 'perk_gold_2') {
              newP.goldPerTurn += 2;
            }
          }
          return newP;
        })
      };
    }

    case 'PLAY_CARD': {
      const { playerId, cardInstanceId, targetId } = action.payload;
      let cardToPlay: CardInstance | undefined;
      
      const newPlayers = state.players.map(p => {
        if (p.id === playerId) {
          cardToPlay = p.hand.find(c => c.instanceId === cardInstanceId);
          if (cardToPlay && p.aether >= cardToPlay.cost) {
            const newHand = p.hand.filter(c => c.instanceId !== cardInstanceId);
            const newAether = p.aether - cardToPlay.cost;
            let newField = p.field;
            let newArtifacts = p.artifacts;
            
            if (cardToPlay.type === 'creature') {
              let bonusAtk = 0;
              let bonusDef = 0;
              if (p.statBuffs.includes('jaksho')) {
                bonusAtk += 2;
                bonusDef += 2;
              }
              newField = [...p.field, { 
                ...cardToPlay, 
                currentAtk: (cardToPlay.atk || 0) + bonusAtk, 
                currentDef: (cardToPlay.def || 1) + bonusDef, 
                tapped: cardToPlay.keywords?.includes('haste') ? false : true, 
                attachments: [], 
                tempAtkBonus: 0, tempDefBonus: 0,
                turnsOnField: 0, damageDealt: 0, evolved: false
              }];
            } else if (cardToPlay.type === 'artifact') {
              newArtifacts = [...p.artifacts, cardToPlay];
            }
            
            return { 
              ...p, 
              hand: newHand, 
              aether: newAether, 
              field: newField, 
              artifacts: newArtifacts,
              cardsPlayedThisGame: (p.cardsPlayedThisGame || 0) + 1
            };
          }
        }
        return p;
      });
      return { ...state, players: newPlayers };
    }

    case 'ATTACK': {
       const { attackerPlayerId, attackerInstanceId, targetPlayerId, targetInstanceId, damageOverride } = action.payload;
       let attackerAtk = damageOverride || 0;
       
       let newPlayers = state.players.map(p => {
         if (p.id === attackerPlayerId) {
           return {
             ...p,
             field: p.field.map(c => {
               if (c.instanceId === attackerInstanceId) {
                 if (damageOverride === undefined) {
                   attackerAtk = c.currentAtk + c.tempAtkBonus;
                 }
                 return { ...c, tapped: true, hasAttackedThisTurn: true, damageDealt: c.damageDealt + attackerAtk };
               }
               return c;
             })
           }
         }
         return p;
       });

       newPlayers = newPlayers.map(p => {
         if (p.id === targetPlayerId) {
           if (targetInstanceId) {
             return {
               ...p,
               field: p.field.map(c => {
                 if (c.instanceId === targetInstanceId) {
                   return { ...c, currentDef: c.currentDef - attackerAtk };
                 }
                 return c;
               }).filter(c => c.currentDef > 0) 
             }
           } else {
             return { ...p, hp: Math.max(0, p.hp - attackerAtk), damageTakenThisGame: true };
           }
         }
         return p;
       });

       const alivePlayers = newPlayers.filter(p => p.hp > 0);
       let winner = state.winner;
       let phase = state.phase;
       if (alivePlayers.length === 1) {
         winner = alivePlayers[0].id;
         phase = 'gameover';
       }

       return { ...state, players: newPlayers, winner, phase };
    }

    case 'ADD_GOLD': {
      return {
        ...state,
        players: state.players.map(p => 
          p.id === action.payload.playerId ? { 
             ...p, 
             gold: p.gold + action.payload.amount,
             goldEarnedThisGame: (p.goldEarnedThisGame || 0) + action.payload.amount 
          } : p
        )
      };
    }
    
    case 'DAMAGE': {
      const { targetPlayerId, targetInstanceId, amount, bypassResist } = action.payload;
      
      let actualAmount = amount;
      
      let newPlayers = state.players.map(p => {
         if (p.id === targetPlayerId) {
           if (p.perks.includes('perk_resist_1') && !bypassResist) {
             actualAmount = Math.max(1, actualAmount - 1);
           }
           
           if (targetInstanceId) {
             return {
               ...p,
               field: p.field.map(c => {
                 if (c.instanceId === targetInstanceId) {
                   return { ...c, currentDef: c.currentDef - actualAmount };
                 }
                 return c;
               }).filter(c => c.currentDef > 0)
             }
           } else {
             return { ...p, hp: Math.max(0, p.hp - actualAmount), damageTakenThisGame: true };
           }
         }
         return p;
       });
       
       const alivePlayers = newPlayers.filter(p => p.hp > 0);
       let winner = state.winner;
       let phase = state.phase;
       if (alivePlayers.length === 1) {
         winner = alivePlayers[0].id;
         phase = 'gameover';
       }

       return { ...state, players: newPlayers, winner, phase };
    }

    case 'HEAL': {
      const { targetPlayerId, amount } = action.payload;
      return {
        ...state,
        players: state.players.map(p => 
          p.id === targetPlayerId ? { ...p, hp: Math.min(p.maxHp, p.hp + amount) } : p
        )
      };
    }
    
    case 'USE_INVENTORY': {
      const { playerId, instanceId, targetId } = action.payload;
      
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id === playerId) {
            const item = p.inventory.find(i => i.instanceId === instanceId);
            if (!item) return p;
            
            let newField = p.field;
            let newHp = p.hp;
            
            if (item.effectKey === 'perm_atk_2' && targetId) {
               newField = newField.map(c => c.instanceId === targetId ? { ...c, currentAtk: c.currentAtk + 2 } : c);
            } else if (item.effectKey === 'perm_def_4' && targetId) {
               newField = newField.map(c => c.instanceId === targetId ? { ...c, currentDef: c.currentDef + 4 } : c);
            } else if (item.effectKey === 'perm_stats_1_1' && targetId) {
               newField = newField.map(c => c.instanceId === targetId ? { ...c, currentAtk: c.currentAtk + 1, currentDef: c.currentDef + 1 } : c);
            } else if (item.effectKey === 'heal_8_hero') {
               newHp = Math.min(p.maxHp, p.hp + 8);
            }
            
            return { 
              ...p, 
              field: newField,
              hp: newHp,
              inventory: p.inventory.filter(i => i.instanceId !== instanceId) 
            };
          }
          return p;
        })
      };
    }

    case 'EVOLVE_CREATURE': {
      const { playerId, instanceId, newTemplate } = action.payload;
      return {
        ...state,
        players: state.players.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              field: p.field.map(c => {
                if (c.instanceId === instanceId) {
                  return {
                    ...c,
                    templateId: newTemplate.templateId,
                    name: newTemplate.name,
                    description: newTemplate.description,
                    currentAtk: newTemplate.atk || 0,
                    currentDef: newTemplate.def || 1,
                    rarity: newTemplate.rarity,
                    evolved: true,
                    keywords: newTemplate.keywords
                  };
                }
                return c;
              })
            };
          }
          return p;
        })
      };
    }
    
    case 'RECORD_KILL': {
       return {
         ...state,
         players: state.players.map(p => 
           p.id === action.payload.playerId ? { ...p, creaturesKilledThisGame: (p.creaturesKilledThisGame || 0) + 1 } : p
         )
       };
    }

    default:
      return state;
  }
}
