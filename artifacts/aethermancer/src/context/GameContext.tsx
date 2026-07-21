import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { GameState, GameAction, gameReducer, initialGameState, Player, StagedSpell, generateId } from '../store/gameStore';
import { getSettings } from '../store/settings';
import { sounds } from '../lib/sounds';
import { SHOP_ITEMS, getCardTemplate, generateShopRotation, generateDraftOptions, drawFromPool, CardTemplate } from '../lib/cards';
import { loadAchievements, saveAchievements, Achievement } from '../store/achievements';

const SHOP_ROTATION_SECONDS = 180;
const BUY_PHASE_SECONDS = 30;

interface GameContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  playCard: (cardInstanceId: string, targetId?: string) => void;
  stageSpell: (cardInstanceId: string, targetId?: string) => void;
  sellArtifact: () => void;
  sellCreature: (instanceId: string) => void;
  attackWith: (attackerInstanceId: string, targetPlayerId: number, targetInstanceId?: string) => void;
  buyItem: (shopItemId: string) => void;
  useInventoryItem: (inventoryInstanceId: string, targetId?: string) => void;
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

    // Per-type sound
    const soundKey = `cardPlay_${card.type}` as any;
    sounds.play(soundKey in sounds ? soundKey : 'cardPlay');

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
    const src = gameState.players.find(p => p.id === sourcePlayerId);
    const isImmuneToPoison = (p: Player) => p.perks.includes('perk_poison_immune');
    const isImmuneToStun = (p: Player) => p.perks.includes('perk_stun_immune');

    if (effect === 'dmg_3_target' && targetId) {
      let targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 3 + spellBonus } });
        setCombatAnim({ targetId, damage: 3 + spellBonus });
        setTimeout(() => setCombatAnim(null), 600);
      } else {
        targetOwner = gameState.players.find(p => p.id.toString() === targetId);
        if (targetOwner) {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, amount: 3 + spellBonus } });
          setCombatAnim({ targetId: targetOwner.id.toString(), damage: 3 + spellBonus });
          setTimeout(() => setCombatAnim(null), 600);
        }
      }
      sounds.play('damage');
    } else if (effect === 'draw_2') {
      const cards = drawFromPool(2).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
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
    } else if (effect === 'dmg_2_and_poison_4' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 2 + spellBonus } });
        if (!isImmuneToPoison(targetOwner)) {
          dispatch({ type: 'APPLY_POISON', payload: { playerId: targetOwner.id, instanceId: targetId, stacks: 4 } });
        }
        sounds.play('poison');
      }
    }
  };

  const applyStatusOnHit = (
    attackerPlayer: Player,
    attacker: { keywords?: string[] },
    targetPlayer: Player,
    targetInstanceId: string,
  ) => {
    if (attacker.keywords?.includes('poison_on_hit') || attackerPlayer.statBuffs.includes('plague_standard')) {
      if (!targetPlayer.perks.includes('perk_poison_immune')) {
        dispatchRef.current({ type: 'APPLY_POISON', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, stacks: 2 } });
        sounds.play('poison');
      }
    }
    if (attacker.keywords?.includes('stun_on_hit')) {
      if (!targetPlayer.perks.includes('perk_stun_immune')) {
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
    } else if (effect === 'add_poison_keyword') {
      // The keyword is applied via the card being played — no immediate action needed
    }
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

    dispatch({ type: 'ATTACK', payload: { attackerPlayerId: player.id, attackerInstanceId, targetPlayerId, targetInstanceId, damageOverride: dmg } });
    setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg });
    setTimeout(() => setCombatAnim(null), 600);

    if (targetOwner && targetInstanceId) {
      const targetCreature = targetOwner.field.find(c => c.instanceId === targetInstanceId);
      if (targetCreature) {
        // Apply status effects on hit
        applyStatusOnHit(player, attacker, targetOwner, targetInstanceId);
        // Kill bonus
        const armor = attacker.keywords?.includes('heavy_armor') ? 3 : 0;
        const effectiveDmg = Math.max(1, dmg - armor);
        const resist = targetOwner.perks.includes('perk_resist_1') ? 1 : 0;
        if (targetCreature.currentDef <= (dmg - resist)) {
          dispatch({ type: 'ADD_GOLD', payload: { playerId: player.id, amount: 50 } });
          dispatch({ type: 'RECORD_KILL', payload: { playerId: player.id } });
          sounds.play('gold');
          if (player.isHuman) triggerAchievement('kill_5_creatures', 1);
          // Heal on kill perk
          if (attacker.keywords?.includes('heal_on_kill')) {
            dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 2 } });
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

    if (item.type === 'card' && item.cardTemplateId) {
      const tpl = getCardTemplate(item.cardTemplateId);
      if (tpl) {
        dispatch({ type: 'BUY_SHOP_ITEM', payload: { playerId: player.id, itemTemplateId: item.id, cost: item.cost, itemType: item.type, name: tpl.name, description: tpl.description, cardTemplate: tpl } });
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

    const needsTarget = ['perm_atk_2', 'perm_def_4', 'perm_stats_1_1', 'destroy_target_creature', 'cure_poison', 'temp_armor', 'apply_poison_5', 'stun_2_turns'].includes(item.effectKey || '');
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
    } else if (item.effectKey === 'draw_2') {
      const cards = drawFromPool(2).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
      dispatch({ type: 'GIVE_CARDS', payload: { playerId: player.id, cards } });
      sounds.play('draw');
    } else if (item.effectKey === 'temp_atk_all_2') {
      // Handled by buff — apply to all field cards
      player.field.forEach(c => {
        dispatch({ type: 'APPLY_POISON', payload: { playerId: player.id, instanceId: c.instanceId, stacks: 0 } });
      });
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

  // ── Game loop ─────────────────────────────────────────────────────────────
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  useEffect(() => {
    if (gameState.phase === 'gameover') {
      const winner = gameState.players.find(p => p.id === gameState.winner);
      if (winner?.isHuman) {
        sounds.play('victory');
        triggerAchievement('first_win');
        triggerAchievement('win_3_games', 1);
        if (!winner.damageTakenThisGame) triggerAchievement('win_no_damage');
      } else {
        sounds.play('defeat');
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

        // Process status effects on this player's field
        dispatchRef.current({ type: 'PROCESS_STATUS_EFFECTS', payload: { playerId: cp.id } });

        const goldGain = 100 + cp.goldPerTurn;
        dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: goldGain } });

        if (cp.artifactSlot?.effect === 'aura_heal_2') {
          dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
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

        // Draft mode: show options to human, auto-pick for AI
        if (state.gameMode === 'draft') {
          const options = generateDraftOptions();
          if (cp.isHuman) {
            sounds.play('draft');
            dispatchRef.current({ type: 'SET_DRAFT_OPTIONS', payload: options });
            // Don't advance — wait for player to pick
          } else {
            // AI: pick highest cost card
            const best = options.sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
            if (best) {
              const cardInst = { ...best, instanceId: `card_${generateId()}` };
              dispatchRef.current({ type: 'GIVE_CARDS', payload: { playerId: cp.id, cards: [cardInst] } });
            } else {
              dispatchRef.current({ type: 'ADVANCE_PHASE' });
            }
          }
        } else {
          // 8-card mode: draw 1 card per turn (after initial hand)
          const drawCount = 1 + (cp.perks.includes('perk_draw_1') ? 1 : 0) +
            (cp.artifactSlot?.effect === 'aura_draw_1' ? 1 : 0);
          const drawn = drawFromPool(drawCount).map(t => ({ ...t, instanceId: `card_${generateId()}` }));
          // GIVE_CARDS already sets phase to 'buy'; AI auto-advances in their buy handler
          dispatchRef.current({ type: 'GIVE_CARDS', payload: { playerId: cp.id, cards: drawn } });
          sounds.play('draw');
        }
      }, 600);
      return;
    }

    // ── Draft phase: human interacts, AI handled above ────────────────────
    if (gameState.phase === 'draft') {
      // Human picks via pickDraftCard(); don't auto-advance.
      // AI was handled in the draw setTimeout above.
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
      const spells = [...currentPlayer.pendingSpells];
      if (spells.length > 0) {
        gameLoopRef.current = setTimeout(() => {
          const spellBonus = currentPlayer.statBuffs.includes('rabadon') ? 2 : 0;
          spells.forEach(spell => {
            if (spell.effect) handleSpellEffect(currentPlayer.id, spell.effect, spell.targetId, spellBonus);
            dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${currentPlayer.name}'s ${spell.name} fires!`, type: 'card' } });
          });
          sounds.play('cardPlay_spell');
          dispatchRef.current({ type: 'CLEAR_PENDING_SPELLS', payload: { playerId: currentPlayer.id } });
        }, 400);
        return;
      }

      if (!currentPlayer.isHuman) {
        gameLoopRef.current = setTimeout(() => {
          const state = stateRef.current;
          const cp = state.players[state.currentPlayerIndex];
          if (!cp) return;
          const untapped = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);
          if (untapped.length > 0) {
            const targetHuman = state.players.find(p => p.isHuman && p.hp > 0);
            if (targetHuman) {
              const attacker = untapped[0];
              const dmg = attacker.currentAtk + attacker.tempAtkBonus;
              dispatchRef.current({
                type: 'ATTACK',
                payload: { attackerPlayerId: cp.id, attackerInstanceId: attacker.instanceId, targetPlayerId: targetHuman.id, damageOverride: dmg },
              });
              // Apply status on hit for AI
              if (attacker.keywords?.includes('poison_on_hit') || cp.statBuffs.includes('plague_standard')) {
                // No field target — hero hit, no character to poison
              }
              dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} attacks for ${dmg} damage!`, type: 'damage' } });
              sounds.play('attack');
            } else {
              dispatchRef.current({ type: 'ADVANCE_PHASE' });
            }
          } else {
            dispatchRef.current({ type: 'ADVANCE_PHASE' });
          }
        }, 900);
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
        gameLoopRef.current = setTimeout(() => {
          const state = stateRef.current;
          const cp = state.players[state.currentPlayerIndex];
          if (!cp) return;
          const affordable = cp.hand
            .filter(c => c.cost <= cp.aether && !cp.cardsPlayedByType[c.type])
            .sort((a, b) => b.cost - a.cost);

          if (affordable.length > 0) {
            const card = affordable[0];
            if (card.type === 'spell') {
              let targetId: string | undefined;
              if (card.effect?.includes('target')) targetId = state.players.find(p => p.isHuman)?.id.toString();
              dispatchRef.current({ type: 'STAGE_SPELL', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId } });
            } else if (card.type === 'enchantment') {
              const targetId = cp.field[0]?.instanceId;
              if (targetId) {
                dispatchRef.current({ type: 'PLAY_CARD', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId } });
              } else {
                dispatchRef.current({ type: 'ADVANCE_PHASE' });
              }
            } else {
              dispatchRef.current({ type: 'PLAY_CARD', payload: { playerId: cp.id, cardInstanceId: card.instanceId } });
            }
          } else {
            dispatchRef.current({ type: 'ADVANCE_PHASE' });
          }
        }, 1000);
      }
    }

    return () => { if (gameLoopRef.current) clearTimeout(gameLoopRef.current); };
  }, [gameState.phase, gameState.currentPlayerIndex]);

  return (
    <GameContext.Provider value={{
      gameState, dispatch, playCard, stageSpell, sellArtifact, sellCreature, attackWith,
      buyItem, useInventoryItem, endPhase, pickDraftCard,
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
