import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { GameState, GameAction, gameReducer, initialGameState, Player, StagedSpell, generateId, AiDifficulty } from '../store/gameStore';
import { getSettings } from '../store/settings';
import { sounds, SoundName, ELEMENT_SOUNDS } from '../lib/sounds';
import { SHOP_ITEMS, getCardTemplate, generateShopRotation, generateDraftOptions, drawFromPool, CardTemplate } from '../lib/cards';
import { loadAchievements, saveAchievements, Achievement } from '../store/achievements';
import { DIFFICULTY_CFG } from './LobbyContext';
import { loadAccount, applyEloChange } from '../store/account';

const SHOP_ROTATION_SECONDS = 180;
const BUY_PHASE_SECONDS = 30;

interface GameContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  playCard: (cardInstanceId: string, targetId?: string) => void;
  stageSpell: (cardInstanceId: string, targetId?: string) => void;
  sellArtifact: () => void;
  sellCreature: (instanceId: string) => void;
  sellHandCard: (instanceId: string) => void;
  attackWith: (attackerInstanceId: string, targetPlayerId: number, targetInstanceId?: string) => void;
  buyItem: (shopItemId: string) => void;
  useInventoryItem: (inventoryInstanceId: string, targetId?: string) => void;
  equipInventoryItem: (instanceId: string) => void;
  endPhase: () => void;
  pickDraftCard: (template: CardTemplate) => void;
  achievements: Achievement[];
  achievementToast: string | null;
  combatAnim: { targetId: string; damage: number } | null;
  announcement: string | null;
  shopRotationIds: string[];
  shopRotationTimeLeft: number;
  buyPhaseTimeLeft: number | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [combatAnim, setCombatAnim] = useState<{ targetId: string; damage: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [shopRotationIds, setShopRotationIds] = useState<string[]>(() => generateShopRotation());
  const [shopRotationTimeLeft, setShopRotationTimeLeft] = useState(SHOP_ROTATION_SECONDS);
  const [buyPhaseTimeLeft, setBuyPhaseTimeLeft] = useState<number | null>(null);

  useEffect(() => { setAchievements(loadAchievements()); }, []);

  useEffect(() => {
    if (gameState.phase === 'gameover' || gameState.phase === 'countdown') return;
    const tick = setInterval(() => {
      setShopRotationTimeLeft(t => {
        if (t <= 1) { setShopRotationIds(generateShopRotation()); return SHOP_ROTATION_SECONDS; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [gameState.phase]);

  useEffect(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (gameState.phase === 'buy' && currentPlayer?.isHuman) {
      setBuyPhaseTimeLeft(BUY_PHASE_SECONDS);
    } else {
      setBuyPhaseTimeLeft(null);
    }
  }, [gameState.phase, gameState.currentPlayerIndex]);

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  useEffect(() => {
    if (buyPhaseTimeLeft === null) return;
    if (buyPhaseTimeLeft <= 0) {
      dispatchRef.current({ type: 'ADVANCE_PHASE' });
      dispatchRef.current({ type: 'TOGGLE_SHOP', payload: false });
      setBuyPhaseTimeLeft(null);
      return;
    }
    const timer = setTimeout(() => setBuyPhaseTimeLeft(t => (t ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [buyPhaseTimeLeft]);

  const triggerAchievement = (id: string, progressInc = 0) => {
    setAchievements(prev => {
      let changed = false;
      const next = prev.map(a => {
        if (a.id === id && !a.unlocked) {
          if (a.target && progressInc > 0) {
            const newProg = (a.progress || 0) + progressInc;
            changed = true;
            if (newProg >= a.target) { showToast(a.name); return { ...a, progress: newProg, unlocked: true }; }
            return { ...a, progress: newProg };
          } else if (!a.target) {
            changed = true; showToast(a.name); return { ...a, unlocked: true };
          }
        }
        return a;
      });
      if (changed) saveAchievements(next);
      return next;
    });
  };

  const showToast = (name: string) => {
    setAchievementToast(`Achievement Unlocked: ${name}`);
    setTimeout(() => setAchievementToast(null), 3500);
  };

  const announce = (msg: string) => {
    setAnnouncement(msg);
    setTimeout(() => setAnnouncement(null), 1800);
  };

  // ── Play card ─────────────────────────────────────────────────────────────
  const playCard = (cardInstanceId: string, targetId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const card = player.hand.find(c => c.instanceId === cardInstanceId);
    if (!card || card.type === 'spell') return;
    if (player.cardsPlayedByType[card.type]) return;

    // Base card-type sound
    const soundKey = `cardPlay_${card.type}` as SoundName;
    sounds.play(soundKey);

    // Element-specific sound for characters, delayed slightly
    if (card.type === 'character' && card.artTheme) {
      const elemSound = ELEMENT_SOUNDS[card.artTheme];
      if (elemSound) setTimeout(() => sounds.play(elemSound), 120);
    }

    dispatch({ type: 'PLAY_CARD', payload: { playerId: player.id, cardInstanceId, targetId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} played ${card.name}.`, type: 'card' } });

    if (player.isHuman) {
      triggerAchievement('play_10_cards', 1);
      if (card.rarity === 'legendary' || card.rarity === 'secret') triggerAchievement('legendary_played');
    }

    if (card.type === 'enchantment' && card.effect && targetId) {
      applyEnchantment(player.id, targetId, card.effect);
    }
  };

  // ── Stage spell ───────────────────────────────────────────────────────────
  const stageSpell = (cardInstanceId: string, targetId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const card = player.hand.find(c => c.instanceId === cardInstanceId);
    if (!card || card.type !== 'spell') return;
    if (player.cardsPlayedByType['spell']) return;
    if (player.aether < card.cost) return;

    sounds.play('cardPlay_spell');
    dispatch({ type: 'STAGE_SPELL', payload: { playerId: player.id, cardInstanceId, targetId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} staged ${card.name} for combat.`, type: 'card' } });

    if (player.isHuman) {
      triggerAchievement('play_10_cards', 1);
      if (card.rarity === 'legendary' || card.rarity === 'secret') triggerAchievement('legendary_played');
    }
  };

  // ── Pick draft card ───────────────────────────────────────────────────────
  const pickDraftCard = (template: CardTemplate) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const cardInstance = { ...template, instanceId: `card_${generateId()}` };
    sounds.play('draft');
    dispatch({ type: 'GIVE_CARDS', payload: { playerId: player.id, cards: [cardInstance] } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} drafted ${template.name}.`, type: 'card' } });
  };

  // ── Spell effects ─────────────────────────────────────────────────────────
  const handleSpellEffect = (sourcePlayerId: number, effect: string, targetId: string | undefined, spellBonus: number) => {
    const isImmuneToPoison = (p: Player) => p.perks.includes('perk_poison_immune');
    const isImmuneToStun = (p: Player) => p.perks.includes('perk_stun_immune');

    const dmgTarget = (tId: string, amount: number) => {
      let targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === tId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: tId, amount } });
        setCombatAnim({ targetId: tId, damage: amount });
        setTimeout(() => setCombatAnim(null), 600);
      } else {
        targetOwner = gameState.players.find(p => p.id.toString() === tId);
        if (targetOwner) {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, amount } });
          setCombatAnim({ targetId: tId, damage: amount });
          setTimeout(() => setCombatAnim(null), 600);
        }
      }
    };

    if (effect === 'dmg_3_target' && targetId) {
      dmgTarget(targetId, 3 + spellBonus);
      sounds.play('damage');
    } else if (effect === 'dmg_4_target' && targetId) {
      dmgTarget(targetId, 4 + spellBonus);
      sounds.play('damage');
    } else if (effect === 'draw_2') {
      const cards = drawFromPool(2).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
      dispatch({ type: 'GIVE_CARDS', payload: { playerId: sourcePlayerId, cards } });
      sounds.play('draw');
    } else if (effect === 'draw_3') {
      const cards = drawFromPool(3).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
      dispatch({ type: 'GIVE_CARDS', payload: { playerId: sourcePlayerId, cards } });
      sounds.play('draw');
    } else if (effect === 'destroy_small_gain_gold' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        const creature = targetOwner.field.find(c => c.instanceId === targetId);
        if (creature && creature.currentDef <= 3) {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, bypassResist: true, bypassArmor: true } });
          dispatch({ type: 'ADD_GOLD', payload: { playerId: sourcePlayerId, amount: creature.currentAtk * 50 } });
          sounds.play('gold');
        }
      }
    } else if (effect === 'dmg_2_all_enemies') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 2 + spellBonus } }));
        }
      });
      sounds.play('damage');
    } else if (effect === 'heal_4_hero') {
      dispatch({ type: 'HEAL', payload: { targetPlayerId: sourcePlayerId, amount: 4 } });
    } else if (effect === 'heal_6_hero') {
      dispatch({ type: 'HEAL', payload: { targetPlayerId: sourcePlayerId, amount: 6 } });
    } else if (effect === 'dmg_6_enemy_hero') {
      const enemy = gameState.players.find(p => p.id !== sourcePlayerId);
      if (enemy) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: enemy.id, amount: 6 + spellBonus } });
        setCombatAnim({ targetId: enemy.id.toString(), damage: 6 + spellBonus });
        setTimeout(() => setCombatAnim(null), 600);
        sounds.play('damage');
      }
    } else if (effect === 'dmg_5_all') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 5 + spellBonus } }));
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, amount: 5 + spellBonus } });
        }
      });
      sounds.play('damage');
    } else if (effect === 'destroy_target' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, bypassResist: true, bypassArmor: true } });
        announce('CHARACTER DESTROYED');
        sounds.play('damage');
      }
    } else if (effect === 'poison_all_enemies') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId && !isImmuneToPoison(p)) {
          p.field.forEach(c => {
            dispatch({ type: 'APPLY_POISON', payload: { playerId: p.id, instanceId: c.instanceId, stacks: 3 } });
          });
        }
      });
      sounds.play('poison');
    } else if (effect === 'stun_target' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner && !isImmuneToStun(targetOwner)) {
        dispatch({ type: 'APPLY_STUN', payload: { playerId: targetOwner.id, instanceId: targetId, turns: 1 } });
        announce('STUNNED!');
        sounds.play('stun');
      }
    } else if (effect === 'stun_all_enemies') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId && !isImmuneToStun(p)) {
          p.field.forEach(c => {
            dispatch({ type: 'APPLY_STUN', payload: { playerId: p.id, instanceId: c.instanceId, turns: 1 } });
          });
        }
      });
      announce('CHAIN LIGHTNING!');
      sounds.play('electric');
    } else if (effect === 'stun_hero') {
      const enemy = gameState.players.find(p => p.id !== sourcePlayerId);
      if (enemy) {
        dispatch({ type: 'STUN_HERO', payload: { playerId: enemy.id } });
        dispatch({ type: 'ADD_LOG', payload: { msg: `${enemy.name}'s mind is shattered — they lose all Aether next turn!`, type: 'other' } });
        announce('MIND SHATTERED!');
        sounds.play('stun');
      }
    } else if (effect === 'dmg_5_target' && targetId) {
      dmgTarget(targetId, 5 + spellBonus);
      sounds.play('damage');
    } else if (effect === 'dmg_2_target' && targetId) {
      dmgTarget(targetId, 2 + spellBonus);
      sounds.play('damage');
    } else if (effect === 'heal_3_hero') {
      dispatch({ type: 'HEAL', payload: { targetPlayerId: sourcePlayerId, amount: 3 } });
    } else if (effect === 'poison_target_2' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner && !isImmuneToPoison(targetOwner)) {
        dispatch({ type: 'APPLY_POISON', payload: { playerId: targetOwner.id, instanceId: targetId, stacks: 2 } });
        sounds.play('poison');
      }
    } else if (effect === 'dmg_2_and_poison_4' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 2 + spellBonus } });
        if (!isImmuneToPoison(targetOwner)) {
          dispatch({ type: 'APPLY_POISON', payload: { playerId: targetOwner.id, instanceId: targetId, stacks: 4 } });
        }
        sounds.play('poison');
      }
    } else if (effect === 'dmg_3_all_and_poison') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => {
            dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 3 + spellBonus } });
            if (!isImmuneToPoison(p)) {
              dispatch({ type: 'APPLY_POISON', payload: { playerId: p.id, instanceId: c.instanceId, stacks: 2 } });
            }
          });
        }
      });
      sounds.play('poison');
    }
  };

  const applyStatusOnHit = (
    attackerPlayer: Player,
    attacker: { keywords?: string[]; artTheme?: string },
    targetPlayer: Player,
    targetInstanceId: string,
  ) => {
    const isImmuneToPoison = targetPlayer.perks.includes('perk_poison_immune');
    const isImmuneToStun = targetPlayer.perks.includes('perk_stun_immune');

    if (attacker.keywords?.includes('poison_on_hit') || attackerPlayer.statBuffs.includes('plague_standard')) {
      if (!isImmuneToPoison) {
        dispatchRef.current({ type: 'APPLY_POISON', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, stacks: 2 } });
        sounds.play('poison');
      }
    }
    if (attacker.keywords?.includes('stun_on_hit') || attackerPlayer.statBuffs.includes('frost_mantle')) {
      if (!isImmuneToStun) {
        dispatchRef.current({ type: 'APPLY_STUN', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, turns: 1 } });
        sounds.play('stun');
      }
    }
    if (attacker.keywords?.includes('electric')) {
      sounds.play('electric');
    }
  };

  const applyEnchantment = (_playerId: number, targetId: string, effect: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (effect === 'buff_2_2') {
      const target = player.field.find(c => c.instanceId === targetId);
      if (target) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: player.id, targetInstanceId: targetId, amount: -2 } });
      }
    }
  };

  // ── Equip inventory item to relic slot ───────────────────────────────────
  const equipInventoryItem = (instanceId: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const item = player.inventory.find(i => i.instanceId === instanceId);
    if (!item) return;
    if (player.artifactSlot && player.artifactSlotTurns < 2) return;
    dispatch({ type: 'EQUIP_INVENTORY_ITEM', payload: { playerId: player.id, instanceId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} equipped ${item.name} as an artifact.`, type: 'other' } });
    sounds.play('uiClick');
  };

  // ── Sell ──────────────────────────────────────────────────────────────────
  const sellArtifact = () => {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player.artifactSlot) return;
    const sellPrice = player.artifactSlot.cost * 75;
    dispatch({ type: 'SELL_ARTIFACT', payload: { playerId: player.id } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} sold ${player.artifactSlot.name} for ${sellPrice}g.`, type: 'gold' } });
    sounds.play('gold');
  };

  const sellCreature = (instanceId: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const creature = player.field.find(c => c.instanceId === instanceId);
    if (!creature) return;
    const rarityMult = creature.rarity === 'legendary' || creature.rarity === 'secret' ? 100 : creature.rarity === 'rare' ? 75 : 50;
    const sellPrice = creature.cost * rarityMult;
    dispatch({ type: 'SELL_CREATURE', payload: { playerId: player.id, instanceId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} sold ${creature.name} for ${sellPrice}g.`, type: 'gold' } });
    sounds.play('gold');
  };

  const sellHandCard = (instanceId: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const card = player.hand.find(c => c.instanceId === instanceId);
    if (!card) return;
    const rarityMult = card.rarity === 'legendary' || card.rarity === 'secret' ? 50 : card.rarity === 'rare' ? 35 : 20;
    const sellPrice = Math.max(10, card.cost * rarityMult);
    dispatch({ type: 'SELL_HAND_CARD', payload: { playerId: player.id, instanceId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} discarded ${card.name} for ${sellPrice}g.`, type: 'gold' } });
    sounds.play('gold');
  };

  // ── Attack ────────────────────────────────────────────────────────────────
  const attackWith = (attackerInstanceId: string, targetPlayerId: number, targetInstanceId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const attacker = player.field.find(c => c.instanceId === attackerInstanceId);
    if (!attacker || attacker.stunned) return;

    let dmg = attacker.currentAtk + attacker.tempAtkBonus;
    if (player.statBuffs.includes('stormrazor') && !attacker.hasAttackedThisTurn) dmg += 1;

    const targetOwner = gameState.players.find(p => p.id === targetPlayerId);
    if (targetOwner?.statBuffs.includes('thornmail') && targetInstanceId) {
      dispatch({ type: 'DAMAGE', payload: { targetPlayerId: player.id, targetInstanceId: attackerInstanceId, amount: 1 } });
    }

    // Kill-steal: take 40% of a player's gold if this attack would kill them
    if (targetOwner && !targetInstanceId) {
      const resist = targetOwner.perks.includes('perk_resist_1') ? 1 : 0;
      const effectiveDmg = Math.max(0, dmg - resist);
      const wouldKill = targetOwner.hp - effectiveDmg <= 0 &&
        !(targetOwner.perks.includes('perk_undying') && !targetOwner.undyingUsed);
      if (wouldKill && targetOwner.gold > 0) {
        const stolen = Math.floor(targetOwner.gold * 0.4);
        if (stolen > 0) {
          dispatch({ type: 'STEAL_GOLD', payload: { fromPlayerId: targetOwner.id, toPlayerId: player.id, amount: stolen } });
          dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} plundered ${stolen}g from ${targetOwner.name}!`, type: 'gold' } });
          sounds.play('gold');
        }
      }
    }

    dispatch({ type: 'ATTACK', payload: { attackerPlayerId: player.id, attackerInstanceId, targetPlayerId, targetInstanceId, damageOverride: dmg } });
    setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg });
    setTimeout(() => setCombatAnim(null), 600);

    if (targetOwner && targetInstanceId) {
      const targetCreature = targetOwner.field.find(c => c.instanceId === targetInstanceId);
      if (targetCreature) {
        applyStatusOnHit(player, attacker, targetOwner, targetInstanceId);
        const resist = targetOwner.perks.includes('perk_resist_1') ? 1 : 0;
        if (targetCreature.currentDef <= (dmg - resist)) {
          dispatch({ type: 'ADD_GOLD', payload: { playerId: player.id, amount: 50 } });
          dispatch({ type: 'RECORD_KILL', payload: { playerId: player.id } });
          sounds.play('gold');
          if (player.isHuman) triggerAchievement('kill_5_creatures', 1);
          if (attacker.keywords?.includes('heal_on_kill')) {
            dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 2 } });
          }
          // Bloodrite stat buff: kill heals hero
          if (player.statBuffs.includes('bloodrite')) {
            dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 1 } });
          }
        }
      }
    }

    sounds.play('attack');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} attacks for ${dmg} damage!`, type: 'damage' } });
  };

  // ── Buy ───────────────────────────────────────────────────────────────────
  const buyItem = (shopItemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === shopItemId);
    if (!item) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    if (player.gold < item.cost) return;

    if (!item.stackable && item.type !== 'card') {
      const alreadyInInventory = player.inventory.some(i => i.itemId === item.id);
      const alreadyAsPerk = item.effectKey ? player.perks.includes(item.effectKey) : false;
      const alreadyAsStat = item.effectKey ? player.statBuffs.includes(item.effectKey) : false;
      if (alreadyInInventory || alreadyAsPerk || alreadyAsStat) {
        dispatch({ type: 'ADD_LOG', payload: { msg: `You already own ${item.name}.`, type: 'other' } });
        return;
      }
    }

    if ((item.type === 'card' || item.type === 'artifact') && item.cardTemplateId) {
      const tpl = getCardTemplate(item.cardTemplateId);
      if (tpl) {
        dispatch({ type: 'BUY_SHOP_ITEM', payload: { playerId: player.id, itemTemplateId: item.id, cost: item.cost, itemType: 'card', name: tpl.name, description: tpl.description, cardTemplate: tpl } });
      }
    } else {
      dispatch({ type: 'BUY_SHOP_ITEM', payload: { playerId: player.id, itemTemplateId: item.id, cost: item.cost, itemType: item.type, name: item.name, description: item.description, effectKey: item.effectKey } });
    }

    sounds.play('gold');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} bought ${item.name}.`, type: 'gold' } });
    if (player.isHuman) triggerAchievement('buy_5_shop', 1);
  };

  // ── Use inventory ─────────────────────────────────────────────────────────
  const useInventoryItem = (inventoryInstanceId: string, targetId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const item = player.inventory.find(i => i.instanceId === inventoryInstanceId);
    if (!item) return;
    if (item.effectKey === 'ironheart') return;

    const needsTarget = [
      'perm_atk_2', 'perm_atk_3', 'perm_def_4', 'perm_stats_1_1',
      'destroy_target_creature', 'cure_poison', 'cure_stun', 'temp_armor',
      'apply_poison_5', 'stun_2_turns', 'stun_1_turn', 'heal_char_3',
    ].includes(item.effectKey || '');
    if (!targetId && needsTarget) {
      dispatch({ type: 'SET_TARGETING', payload: { mode: 'item', sourceId: inventoryInstanceId, pendingAction: null } });
      return;
    }

    if (item.effectKey === 'destroy_target_creature' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, bypassResist: true, bypassArmor: true } });
        announce('CHARACTER DESTROYED');
      }
    } else if (item.effectKey === 'apply_poison_5' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner && !targetOwner.perks.includes('perk_poison_immune')) {
        dispatch({ type: 'APPLY_POISON', payload: { playerId: targetOwner.id, instanceId: targetId, stacks: 5 } });
        sounds.play('poison');
      }
    } else if (item.effectKey === 'stun_2_turns' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner && !targetOwner.perks.includes('perk_stun_immune')) {
        dispatch({ type: 'APPLY_STUN', payload: { playerId: targetOwner.id, instanceId: targetId, turns: 2 } });
        sounds.play('stun');
      }
    } else if (item.effectKey === 'stun_1_turn' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner && !targetOwner.perks.includes('perk_stun_immune')) {
        dispatch({ type: 'APPLY_STUN', payload: { playerId: targetOwner.id, instanceId: targetId, turns: 1 } });
        sounds.play('stun');
      }
    } else if (item.effectKey === 'draw_2') {
      const cards = drawFromPool(2).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
      dispatch({ type: 'GIVE_CARDS', payload: { playerId: player.id, cards } });
      sounds.play('draw');
      return; // GIVE_CARDS transitions phase, so skip USE_INVENTORY
    } else if (item.effectKey === 'draw_3') {
      const cards = drawFromPool(3).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
      dispatch({ type: 'GIVE_CARDS', payload: { playerId: player.id, cards } });
      sounds.play('draw');
      return;
    } else if (item.effectKey === 'temp_atk_all_2') {
      // Handled via game store buff
    }

    dispatch({ type: 'USE_INVENTORY', payload: { playerId: player.id, instanceId: inventoryInstanceId, targetId } });
    sounds.play('uiClick');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} used ${item.name}.`, type: 'other' } });
  };

  const endPhase = () => {
    dispatch({ type: 'ADVANCE_PHASE' });
    sounds.play('uiClick');
  };

  const checkEvolutions = () => {
    const player = gameState.players[gameState.currentPlayerIndex];
    player.field.forEach(c => {
      if (!c.evolved && c.evolvesTo) {
        const evTpl = getCardTemplate(c.evolvesTo);
        if (evTpl && c.evolveCondition) {
          const cond = c.evolveCondition;
          if (
            (cond.turnsOnField !== undefined && c.turnsOnField >= cond.turnsOnField) ||
            (cond.damageDealt !== undefined && c.damageDealt >= cond.damageDealt)
          ) {
            dispatch({ type: 'EVOLVE_CREATURE', payload: { playerId: player.id, instanceId: c.instanceId, newTemplate: evTpl } });
            announce(`EVOLUTION! ${c.name} → ${evTpl.name}!`);
            if (player.isHuman) triggerAchievement('evolve_creature');
          }
        }
      }
    });
  };

  // ── AI helpers ────────────────────────────────────────────────────────────
  /**
   * Choose an attack target based on difficulty.
   * Returns { targetPlayerId, targetInstanceId? }
   */
  function chooseAiAttackTarget(
    cp: typeof gameState.players[0],
    difficulty: AiDifficulty,
    players: typeof gameState.players,
  ) {
    const targetHuman = players.find(p => p.isHuman && p.hp > 0);
    if (!targetHuman) return null;

    switch (difficulty) {
      case 'Novice':
      case 'Easy':
        // Always attack hero directly (simple)
        return { targetPlayerId: targetHuman.id, targetInstanceId: undefined };

      case 'Normal':
        // Respect taunt; otherwise hero
        const tauntNormal = targetHuman.field.find(c => c.keywords?.includes('taunt') && !c.stunned);
        if (tauntNormal) return { targetPlayerId: targetHuman.id, targetInstanceId: tauntNormal.instanceId };
        return { targetPlayerId: targetHuman.id, targetInstanceId: undefined };

      case 'Hard': {
        // Respect taunt; if no taunt, attack weakest character if killable this turn
        const tauntHard = targetHuman.field.find(c => c.keywords?.includes('taunt') && !c.stunned);
        if (tauntHard) return { targetPlayerId: targetHuman.id, targetInstanceId: tauntHard.instanceId };
        const untapped = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);
        const totalAtk = untapped.reduce((s, c) => s + c.currentAtk + c.tempAtkBonus, 0);
        const killable = targetHuman.field.filter(c => c.currentDef <= totalAtk).sort((a, b) => b.currentAtk - a.currentAtk)[0];
        if (killable) return { targetPlayerId: targetHuman.id, targetInstanceId: killable.instanceId };
        return { targetPlayerId: targetHuman.id, targetInstanceId: undefined };
      }

      case 'Expert':
      case 'Nightmare': {
        // Respect taunt
        const tauntEx = targetHuman.field.find(c => c.keywords?.includes('taunt') && !c.stunned);
        if (tauntEx) return { targetPlayerId: targetHuman.id, targetInstanceId: tauntEx.instanceId };
        // Kill highest-threat character if possible
        const untappedEx = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);
        const singleAtk = untappedEx[0] ? untappedEx[0].currentAtk + untappedEx[0].tempAtkBonus : 0;
        const killableEx = targetHuman.field.filter(c => c.currentDef <= singleAtk).sort((a, b) => b.currentAtk - a.currentAtk)[0];
        if (killableEx) return { targetPlayerId: targetHuman.id, targetInstanceId: killableEx.instanceId };
        // Remove any character that threatens (highest atk)
        const biggestThreat = [...targetHuman.field].sort((a, b) => b.currentAtk - a.currentAtk)[0];
        if (biggestThreat && singleAtk > 0) return { targetPlayerId: targetHuman.id, targetInstanceId: biggestThreat.instanceId };
        return { targetPlayerId: targetHuman.id, targetInstanceId: undefined };
      }
    }
  }

  /** Choose which card the AI plays based on difficulty */
  function chooseAiCard(
    cp: typeof gameState.players[0],
    difficulty: AiDifficulty,
    players: typeof gameState.players,
  ) {
    const affordable = cp.hand
      .filter(c =>
        c.cost <= cp.aether &&
        !cp.cardsPlayedByType[c.type] &&
        !(c.type === 'character' && cp.field.length >= 4) &&
        !(c.type === 'artifact' && cp.artifactSlot !== null)
      );

    if (affordable.length === 0) return null;

    switch (difficulty) {
      case 'Novice':
        // 40% chance to play nothing
        if (Math.random() < 0.4) return null;
        return affordable[Math.floor(Math.random() * affordable.length)];

      case 'Easy':
        // Random card
        return affordable[Math.floor(Math.random() * affordable.length)];

      case 'Normal':
      case 'Hard':
      case 'Expert':
      case 'Nightmare':
        // Highest cost card
        return [...affordable].sort((a, b) => b.cost - a.cost)[0];
    }
  }

  /** Choose spell target based on difficulty */
  function chooseAiSpellTarget(
    effect: string,
    difficulty: AiDifficulty,
    players: typeof gameState.players,
    cpId: number,
  ): string | undefined {
    const human = players.find(p => p.isHuman);
    if (!human) return undefined;

    if (effect.includes('target')) {
      if (difficulty === 'Hard' || difficulty === 'Expert' || difficulty === 'Nightmare') {
        // Target highest-ATK human field card, else hero
        const best = [...human.field].sort((a, b) => b.currentAtk - a.currentAtk)[0];
        return best ? best.instanceId : human.id.toString();
      }
      return human.id.toString();
    }
    return undefined;
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const eloAppliedRef = useRef(false);

  useEffect(() => {
    // Reset ELO guard when a new game starts
    const phase = gameState.phase as string;
    if (phase === 'countdown') {
      eloAppliedRef.current = false;
      return;
    }
    if (phase === 'gameover') {
      const winner = gameState.players.find(p => p.id === gameState.winner);
      if (winner?.isHuman) {
        sounds.play('victory');
        triggerAchievement('first_win');
        triggerAchievement('win_3_games', 1);
        if (!winner.damageTakenThisGame) triggerAchievement('win_no_damage');
      } else {
        sounds.play('defeat');
      }
      // Apply ELO for ranked multiplayer
      if (gameState.ranked && gameState.matchType === 'multiplayer' && !eloAppliedRef.current) {
        eloAppliedRef.current = true;
        const acc = loadAccount();
        if (acc) {
          const humanPlayer = gameState.players.find(p => p.isHuman);
          const humanWon = gameState.winner === humanPlayer?.id;
          const enemies = gameState.players.filter(p => !p.isHuman);
          const avgElo = enemies.reduce((s, e) => s + (e.elo || 1000), 0) / Math.max(1, enemies.length);
          applyEloChange(acc, humanWon, avgElo);
        }
      }
      return;
    }
    if (gameState.phase === 'countdown' || gameState.players.length === 0) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    // ── Draw phase ────────────────────────────────────────────────────────
    if (gameState.phase === 'draw') {
      gameLoopRef.current = setTimeout(() => {
        const state = stateRef.current;
        const cp = state.players[state.currentPlayerIndex];
        if (!cp) return;

        dispatchRef.current({ type: 'REPLENISH_AETHER', payload: { playerId: cp.id } });
        dispatchRef.current({ type: 'PROCESS_STATUS_EFFECTS', payload: { playerId: cp.id } });

        const goldGain = 100 + cp.goldPerTurn;
        dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: goldGain } });

        // Bonus gold from damage dealt last turn
        if ((cp.bonusGoldPending || 0) > 0) {
          dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: cp.bonusGoldPending! } });
          dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} earned ${cp.bonusGoldPending}g from battle damage!`, type: 'gold' } });
          dispatchRef.current({ type: 'RESET_BONUS_GOLD', payload: { playerId: cp.id } });
        }

        if (cp.artifactSlot?.effect === 'aura_heal_2') {
          dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
        }
        if (cp.artifactSlot?.effect === 'aura_heal_1') {
          dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 1 } });
        }
        if (cp.artifactSlot?.effect === 'aura_gold_50') {
          dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: 50 } });
        }

        if (cp.statBuffs.includes('sunfire')) {
          state.players.forEach(p => {
            if (p.id !== cp.id) {
              p.field.forEach(c => {
                dispatchRef.current({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 1 } });
              });
            }
          });
        }

        if (cp.isHuman) {
          sounds.play('gold');
          triggerAchievement('earn_50_gold', goldGain);
        }

        // Both modes: draw 2 cards per turn from pool
        const drawCount = 2 + (cp.perks.includes('perk_draw_1') ? 1 : 0) +
          (cp.artifactSlot?.effect === 'aura_draw_1' ? 1 : 0);
        const drawn = drawFromPool(drawCount).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
        dispatchRef.current({ type: 'GIVE_CARDS', payload: { playerId: cp.id, cards: drawn } });
        sounds.play('draw');
      }, 600);
      return;
    }

    // ── Draft phase: human interacts, AI handled above ────────────────────
    if (gameState.phase === 'draft') {
      return;
    }

    // ── End phase ──────────────────────────────────────────────────────────
    if (gameState.phase === 'end') {
      gameLoopRef.current = setTimeout(() => {
        checkEvolutions();
        if (currentPlayer.isHuman) triggerAchievement('survive_10_turns', 1);
        dispatchRef.current({ type: 'END_TURN' });
      }, 500);
      return;
    }

    // ── Combat phase ───────────────────────────────────────────────────────
    if (gameState.phase === 'combat') {
      // Novice: sometimes skip combat entirely (decide once upfront)
      const skipCombat = !currentPlayer.isHuman && gameState.difficulty === 'Novice' && Math.random() < 0.3;

      // Define AI combat loop here so it can be referenced from both
      // the spell-resolution callback and the normal (no-spell) path.
      const runAiCombatLoop = () => {
        const state = stateRef.current;
        const cp = state.players[state.currentPlayerIndex];
        if (!cp || cp.isHuman || state.phase !== 'combat') return;

        if (skipCombat) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const diff = state.difficulty;
        const untapped = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);

        if (untapped.length === 0) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const targetHuman = state.players.find(p => p.isHuman && p.hp > 0);
        if (!targetHuman) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const attacker = untapped[0];
        const target = chooseAiAttackTarget(cp, diff, state.players);
        if (!target) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const dmg = attacker.currentAtk + attacker.tempAtkBonus;

        // Kill-steal: if this attack would kill the human hero, take 40% of their gold first
        if (!target.targetInstanceId) {
          const resist = targetHuman.perks.includes('perk_resist_1') ? 1 : 0;
          const effectiveDmg = Math.max(0, dmg - resist);
          const wouldKill = targetHuman.hp - effectiveDmg <= 0 &&
            !(targetHuman.perks.includes('perk_undying') && !targetHuman.undyingUsed);
          if (wouldKill && targetHuman.gold > 0) {
            const stolen = Math.floor(targetHuman.gold * 0.4);
            if (stolen > 0) {
              dispatchRef.current({ type: 'STEAL_GOLD', payload: { fromPlayerId: targetHuman.id, toPlayerId: cp.id, amount: stolen } });
              dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} plundered ${stolen}g from ${targetHuman.name}!`, type: 'gold' } });
            }
          }
        }

        dispatchRef.current({
          type: 'ATTACK',
          payload: {
            attackerPlayerId: cp.id,
            attackerInstanceId: attacker.instanceId,
            targetPlayerId: target.targetPlayerId,
            targetInstanceId: target.targetInstanceId,
            damageOverride: dmg,
          },
        });

        // AI status on hit
        if (target.targetInstanceId) {
          if (attacker.keywords?.includes('poison_on_hit') || cp.statBuffs.includes('plague_standard')) {
            if (!targetHuman.perks.includes('perk_poison_immune')) {
              dispatchRef.current({ type: 'APPLY_POISON', payload: { playerId: targetHuman.id, instanceId: target.targetInstanceId, stacks: 2 } });
            }
          }
          if (attacker.keywords?.includes('stun_on_hit') || cp.statBuffs.includes('frost_mantle')) {
            if (!targetHuman.perks.includes('perk_stun_immune')) {
              dispatchRef.current({ type: 'APPLY_STUN', payload: { playerId: targetHuman.id, instanceId: target.targetInstanceId, turns: 1 } });
            }
          }
          // AI kill bonus
          const tgtCreature = targetHuman.field.find(c => c.instanceId === target.targetInstanceId);
          if (tgtCreature && tgtCreature.currentDef <= dmg) {
            dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: 50 } });
            dispatchRef.current({ type: 'RECORD_KILL', payload: { playerId: cp.id } });
            if (attacker.keywords?.includes('heal_on_kill')) {
              dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
            }
          }
        }

        dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} attacks for ${dmg} damage!`, type: 'damage' } });
        sounds.play('attack');

        // Schedule the next attacker
        gameLoopRef.current = setTimeout(runAiCombatLoop, 700);
      };

      // Fire any pending spells first, then (for AI) continue to creature attacks.
      // IMPORTANT: after CLEAR_PENDING_SPELLS the effect deps (phase / currentPlayerIndex)
      // do NOT change, so the effect would NOT re-run. We must kick off the AI attack loop
      // from inside the callback instead of relying on the effect re-running.
      const spells = [...currentPlayer.pendingSpells];
      if (spells.length > 0) {
        gameLoopRef.current = setTimeout(() => {
          const state = stateRef.current;
          const cp = state.players[state.currentPlayerIndex];
          const spellBonus = cp?.statBuffs.includes('rabadon') ? 2 : 0;
          spells.forEach(spell => {
            if (spell.effect) handleSpellEffect(currentPlayer.id, spell.effect, spell.targetId, spellBonus);
            dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${currentPlayer.name}'s ${spell.name} fires!`, type: 'card' } });
          });
          sounds.play('cardPlay_spell');
          dispatchRef.current({ type: 'CLEAR_PENDING_SPELLS', payload: { playerId: currentPlayer.id } });

          // After spells resolve, continue with AI creature attacks.
          // The effect will NOT re-run because phase/currentPlayerIndex haven't changed.
          if (!currentPlayer.isHuman) {
            gameLoopRef.current = setTimeout(runAiCombatLoop, 400);
          }
        }, 400);
        return;
      }

      if (!currentPlayer.isHuman) {
        gameLoopRef.current = setTimeout(runAiCombatLoop, 900);
      }
      return;
    }

    // ── AI main / buy phases ───────────────────────────────────────────────
    if (!currentPlayer.isHuman) {
      if (gameState.phase === 'buy') {
        gameLoopRef.current = setTimeout(() => {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
        }, 800);
      } else if (gameState.phase === 'main') {
        // Recursive self-scheduling loop — keeps running until no card can be played
        const runAiMainLoop = () => {
          const state = stateRef.current;
          const cp = state.players[state.currentPlayerIndex];
          if (!cp || cp.isHuman || state.phase !== 'main') return;
          const diff = state.difficulty;

          const card = chooseAiCard(cp, diff, state.players);
          if (!card) {
            dispatchRef.current({ type: 'ADVANCE_PHASE' });
            return;
          }

          if (card.type === 'spell') {
            const targetId = chooseAiSpellTarget(card.effect || '', diff, state.players, cp.id);
            dispatchRef.current({ type: 'STAGE_SPELL', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId } });
          } else if (card.type === 'enchantment') {
            const targetId = cp.field[0]?.instanceId;
            if (targetId) {
              dispatchRef.current({ type: 'PLAY_CARD', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId } });
            } else {
              dispatchRef.current({ type: 'ADVANCE_PHASE' });
              return;
            }
          } else {
            dispatchRef.current({ type: 'PLAY_CARD', payload: { playerId: cp.id, cardInstanceId: card.instanceId } });
          }

          // Schedule next iteration to play additional cards
          gameLoopRef.current = setTimeout(runAiMainLoop, 800);
        };
        gameLoopRef.current = setTimeout(runAiMainLoop, 1000);
      }
    }

    return () => { if (gameLoopRef.current) clearTimeout(gameLoopRef.current); };
  }, [gameState.phase, gameState.currentPlayerIndex]);

  return (
    <GameContext.Provider value={{
      gameState, dispatch, playCard, stageSpell, sellArtifact, sellCreature, sellHandCard, attackWith,
      buyItem, useInventoryItem, equipInventoryItem, endPhase, pickDraftCard,
      achievements, achievementToast, combatAnim, announcement,
      shopRotationIds, shopRotationTimeLeft, buyPhaseTimeLeft,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
