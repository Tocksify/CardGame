import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { GameState, GameAction, gameReducer, initialGameState, Player, StagedSpell } from '../store/gameStore';
import { getSettings } from '../store/settings';
import { sounds } from '../lib/sounds';
import { SHOP_ITEMS, getCardTemplate, generateShopRotation } from '../lib/cards';
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
  achievements: Achievement[];
  achievementToast: string | null;
  combatAnim: { targetId: string, damage: number } | null;
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
  const [combatAnim, setCombatAnim] = useState<{ targetId: string, damage: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const [shopRotationIds, setShopRotationIds] = useState<string[]>(() => generateShopRotation());
  const [shopRotationTimeLeft, setShopRotationTimeLeft] = useState(SHOP_ROTATION_SECONDS);
  const [buyPhaseTimeLeft, setBuyPhaseTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    setAchievements(loadAchievements());
  }, []);

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
    setTimeout(() => setAnnouncement(null), 1500);
  };

  // ── Play card (creatures, artifacts, enchantments) ────────────────────────
  const playCard = (cardInstanceId: string, targetId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const card = player.hand.find(c => c.instanceId === cardInstanceId);
    if (!card) return;
    // Spells are staged via stageSpell, not played directly
    if (card.type === 'spell') return;
    // One-per-type check
    if (player.cardsPlayedByType[card.type]) return;

    sounds.play('cardPlay');
    dispatch({ type: 'PLAY_CARD', payload: { playerId: player.id, cardInstanceId, targetId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} played ${card.name}.`, type: 'card' } });

    if (player.isHuman) {
      triggerAchievement('play_10_cards', 1);
      if (card.rarity === 'legendary') triggerAchievement('legendary_played');
    }

    if (card.type === 'enchantment' && card.effect && targetId) {
      applyEnchantment(player.id, targetId, card.effect);
    }
  };

  // ── Stage a spell (queues it for combat phase) ────────────────────────────
  const stageSpell = (cardInstanceId: string, targetId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const card = player.hand.find(c => c.instanceId === cardInstanceId);
    if (!card || card.type !== 'spell') return;
    if (player.cardsPlayedByType['spell']) return; // one spell per turn
    if (player.aether < card.cost) return;

    sounds.play('cardPlay');
    dispatch({ type: 'STAGE_SPELL', payload: { playerId: player.id, cardInstanceId, targetId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} staged ${card.name} for combat.`, type: 'card' } });

    if (player.isHuman) {
      triggerAchievement('play_10_cards', 1);
      if (card.rarity === 'legendary') triggerAchievement('legendary_played');
    }
  };

  // ── Execute all pending spells (called at combat phase start) ─────────────
  const executePendingSpellsFor = (player: Player) => {
    if (player.pendingSpells.length === 0) return;
    const spellBonus = player.statBuffs.includes('rabadon') ? 2 : 0;
    player.pendingSpells.forEach((spell: StagedSpell) => {
      if (spell.effect) {
        handleSpellEffect(player.id, spell.effect, spell.targetId, spellBonus);
      }
      dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name}'s ${spell.name} fires!`, type: 'card' } });
    });
    sounds.play('cardPlay');
    dispatch({ type: 'CLEAR_PENDING_SPELLS', payload: { playerId: player.id } });
  };

  // ── Sell artifact ─────────────────────────────────────────────────────────
  const sellArtifact = () => {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (!player.artifactSlot) return;
    const sellPrice = player.artifactSlot.cost * 75;
    dispatch({ type: 'SELL_ARTIFACT', payload: { playerId: player.id } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} sold ${player.artifactSlot.name} for ${sellPrice}g.`, type: 'gold' } });
    sounds.play('gold');
  };

  // ── Sell creature from field ───────────────────────────────────────────────
  const sellCreature = (instanceId: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const creature = player.field.find(c => c.instanceId === instanceId);
    if (!creature) return;
    const rarityMult = creature.rarity === 'legendary' ? 100 : creature.rarity === 'rare' ? 75 : 50;
    const sellPrice = creature.cost * rarityMult;
    dispatch({ type: 'SELL_CREATURE', payload: { playerId: player.id, instanceId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} sold ${creature.name} for ${sellPrice}g.`, type: 'gold' } });
    sounds.play('gold');
  };

  const handleSpellEffect = (sourcePlayerId: number, effect: string, targetId: string | undefined, spellBonus: number) => {
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
      dispatch({ type: 'DRAW_CARD', payload: { playerId: sourcePlayerId, amount: 2 } });
      sounds.play('draw');
    } else if (effect === 'destroy_small_gain_gold' && targetId) {
      let targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        const creature = targetOwner.field.find(c => c.instanceId === targetId);
        if (creature && creature.currentDef <= 3) {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, bypassResist: true } });
          dispatch({ type: 'ADD_GOLD', payload: { playerId: sourcePlayerId, amount: creature.currentAtk * 50 } });
          sounds.play('gold');
        }
      }
    } else if (effect === 'dmg_2_all_enemies') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => {
            dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 2 + spellBonus } });
          });
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
          p.field.forEach(c => {
            dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 5 + spellBonus } });
          });
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, amount: 5 + spellBonus } });
        }
      });
      sounds.play('damage');
    } else if (effect === 'destroy_target' && targetId) {
      let targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, bypassResist: true } });
        announce("CREATURE DESTROYED");
        sounds.play('damage');
      }
    }
  };

  const applyEnchantment = (_playerId: number, _targetId: string, _effect: string) => {
    // Simplified enchantment handling
  };

  const attackWith = (attackerInstanceId: string, targetPlayerId: number, targetInstanceId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const attacker = player.field.find(c => c.instanceId === attackerInstanceId);
    if (!attacker) return;

    let dmg = attacker.currentAtk + attacker.tempAtkBonus;

    if (player.statBuffs.includes('stormrazor') && !attacker.hasAttackedThisTurn) {
      dmg += 1;
    }

    const targetOwner = gameState.players.find(p => p.id === targetPlayerId);
    if (targetOwner && targetOwner.statBuffs.includes('thornmail') && targetInstanceId) {
      dispatch({ type: 'DAMAGE', payload: { targetPlayerId: player.id, targetInstanceId: attackerInstanceId, amount: 1 } });
    }

    dispatch({ type: 'ATTACK', payload: { attackerPlayerId: player.id, attackerInstanceId, targetPlayerId, targetInstanceId, damageOverride: dmg } });

    setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg });
    setTimeout(() => setCombatAnim(null), 600);

    if (targetOwner && targetInstanceId) {
      const targetCreature = targetOwner.field.find(c => c.instanceId === targetInstanceId);
      let resist = targetOwner.perks.includes('perk_resist_1') ? 1 : 0;
      if (targetCreature && targetCreature.currentDef <= (dmg - resist)) {
        dispatch({ type: 'ADD_GOLD', payload: { playerId: player.id, amount: 50 } });
        dispatch({ type: 'RECORD_KILL', payload: { playerId: player.id } });
        sounds.play('gold');
        if (player.isHuman) triggerAchievement('kill_5_creatures', 1);
      }
    }

    sounds.play('attack');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} attacks for ${dmg} damage!`, type: 'damage' } });
  };

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
        dispatch({
          type: 'BUY_SHOP_ITEM',
          payload: { playerId: player.id, itemTemplateId: item.id, cost: item.cost, itemType: item.type, name: tpl.name, description: tpl.description, cardTemplate: tpl }
        });
      }
    } else {
      dispatch({
        type: 'BUY_SHOP_ITEM',
        payload: { playerId: player.id, itemTemplateId: item.id, cost: item.cost, itemType: item.type, name: item.name, description: item.description, effectKey: item.effectKey }
      });
    }
    sounds.play('gold');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} bought ${item.name}.`, type: 'gold' } });
    if (player.isHuman) triggerAchievement('buy_5_shop', 1);
  };

  const useInventoryItem = (inventoryInstanceId: string, targetId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const item = player.inventory.find(i => i.instanceId === inventoryInstanceId);
    if (!item) return;

    if (item.effectKey === 'ironheart') return;

    if (!targetId && (item.effectKey === 'perm_atk_2' || item.effectKey === 'perm_def_4' || item.effectKey === 'perm_stats_1_1' || item.effectKey === 'destroy_target_creature')) {
      dispatch({ type: 'SET_TARGETING', payload: { mode: 'item', sourceId: inventoryInstanceId, pendingAction: null } });
      return;
    }

    if (item.effectKey === 'destroy_target_creature' && targetId) {
      let targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, bypassResist: true } });
        announce("CREATURE DESTROYED");
      }
    } else if (item.effectKey === 'draw_2') {
      dispatch({ type: 'DRAW_CARD', payload: { playerId: player.id, amount: 2 } });
      sounds.play('draw');
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

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameState.phase === 'gameover') {
      if (gameState.winner) {
        const p = gameState.players.find(p => p.id === gameState.winner);
        if (p?.isHuman) {
          sounds.play('victory');
          triggerAchievement('first_win');
          triggerAchievement('win_3_games', 1);
          if (!p.damageTakenThisGame) triggerAchievement('win_no_damage');
        } else {
          sounds.play('defeat');
        }
      }
      return;
    }

    if (gameState.phase === 'countdown') return;
    if (gameState.players.length === 0) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    if (gameState.phase === 'draw') {
      gameLoopRef.current = setTimeout(() => {
        // Replenish aether at start of each turn (fixes turn-1 having too little)
        dispatchRef.current({ type: 'REPLENISH_AETHER', payload: { playerId: currentPlayer.id } });

        const draws = 1 + (currentPlayer.perks.includes('perk_draw_1') ? 1 : 0) +
          (currentPlayer.artifactSlot?.effect === 'aura_draw_1' ? 1 : 0);
        dispatchRef.current({ type: 'DRAW_CARD', payload: { playerId: currentPlayer.id, amount: draws } });
        sounds.play('draw');

        // Artifact aura: heal each turn
        if (currentPlayer.artifactSlot?.effect === 'aura_heal_2') {
          dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: currentPlayer.id, amount: 2 } });
        }

        const goldGain = 100 + currentPlayer.goldPerTurn;
        dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: currentPlayer.id, amount: goldGain } });
        if (currentPlayer.isHuman) {
          sounds.play('gold');
          triggerAchievement('earn_50_gold', goldGain);
        }

        if (currentPlayer.statBuffs.includes('sunfire')) {
          gameState.players.forEach(p => {
            if (p.id !== currentPlayer.id) {
              p.field.forEach(c => {
                dispatchRef.current({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 1 } });
              });
            }
          });
        }

        dispatchRef.current({ type: 'ADVANCE_PHASE' });
      }, 800);
      return;
    }

    if (gameState.phase === 'end') {
      gameLoopRef.current = setTimeout(() => {
        checkEvolutions();
        if (currentPlayer.isHuman) triggerAchievement('survive_10_turns', 1);
        dispatchRef.current({ type: 'END_TURN' });
      }, 500);
      return;
    }

    // ── Combat phase: fire pending spells first (both human and AI) ─────────
    if (gameState.phase === 'combat') {
      const spells = [...currentPlayer.pendingSpells];
      if (spells.length > 0) {
        gameLoopRef.current = setTimeout(() => {
          const spellBonus = currentPlayer.statBuffs.includes('rabadon') ? 2 : 0;
          spells.forEach((spell) => {
            if (spell.effect) {
              handleSpellEffect(currentPlayer.id, spell.effect, spell.targetId, spellBonus);
            }
            dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${currentPlayer.name}'s ${spell.name} fires!`, type: 'card' } });
          });
          sounds.play('cardPlay');
          dispatchRef.current({ type: 'CLEAR_PENDING_SPELLS', payload: { playerId: currentPlayer.id } });
        }, 400);
        return;
      }

      // AI combat after spells resolved
      if (!currentPlayer.isHuman) {
        gameLoopRef.current = setTimeout(() => {
          const untapped = currentPlayer.field.filter(c => !c.tapped && !c.hasAttackedThisTurn);
          if (untapped.length > 0) {
            const targetHuman = gameState.players.find(p => p.isHuman);
            if (targetHuman) {
              // Dispatch attack directly to avoid stale-closure issues with attackWith()
              const attacker = untapped[0];
              const dmg = attacker.currentAtk + attacker.tempAtkBonus;
              dispatchRef.current({
                type: 'ATTACK',
                payload: {
                  attackerPlayerId: currentPlayer.id,
                  attackerInstanceId: attacker.instanceId,
                  targetPlayerId: targetHuman.id,
                  damageOverride: dmg,
                },
              });
              dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${currentPlayer.name} attacks for ${dmg} damage!`, type: 'damage' } });
              sounds.play('attack');
            } else {
              dispatchRef.current({ type: 'ADVANCE_PHASE' });
            }
          } else {
            dispatchRef.current({ type: 'ADVANCE_PHASE' });
          }
        }, 800);
      }
      return;
    }

    // AI main phase
    if (!currentPlayer.isHuman) {
      if (gameState.phase === 'buy') {
        gameLoopRef.current = setTimeout(() => {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
        }, 800);
      } else if (gameState.phase === 'main') {
        gameLoopRef.current = setTimeout(() => {
          const affordableCards = currentPlayer.hand
            .filter(c => c.cost <= currentPlayer.aether && !currentPlayer.cardsPlayedByType[c.type])
            .sort((a, b) => b.cost - a.cost);

          if (affordableCards.length > 0) {
            const card = affordableCards[0];
            if (card.type === 'spell') {
              // AI stages spells
              let targetId: string | undefined = undefined;
              if (card.effect?.includes('target')) {
                targetId = gameState.players.find(p => p.isHuman)?.id.toString();
              }
              dispatchRef.current({ type: 'STAGE_SPELL', payload: { playerId: currentPlayer.id, cardInstanceId: card.instanceId, targetId } });
            } else {
              let targetId: string | undefined = undefined;
              if (card.type === 'enchantment') {
                targetId = currentPlayer.field[0]?.instanceId;
              }
              if (card.type !== 'enchantment' || targetId) {
                playCard(card.instanceId, targetId);
              } else {
                dispatchRef.current({ type: 'ADVANCE_PHASE' });
              }
            }
          } else {
            dispatchRef.current({ type: 'ADVANCE_PHASE' });
          }
        }, 1000);
      }
    }

    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [gameState.phase, gameState.currentPlayerIndex, gameState.players]);

  return (
    <GameContext.Provider value={{
      gameState, dispatch, playCard, stageSpell, sellArtifact, sellCreature, attackWith,
      buyItem, useInventoryItem, endPhase,
      achievements, achievementToast, combatAnim, announcement,
      shopRotationIds, shopRotationTimeLeft, buyPhaseTimeLeft
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
