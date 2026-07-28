import React, { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { GameState, GameAction, gameReducer, initialGameState, Player, StagedSpell, CardInstance, FieldCard, generateId, AiDifficulty } from '../store/gameStore';
import { getSettings } from '../store/settings';
import { sounds, SoundName, ELEMENT_SOUNDS } from '../lib/sounds';
import { SHOP_ITEMS, getCardTemplate, generateShopRotation, generateDraftOptions, drawFromPool, CardTemplate, getCardAbilities } from '../lib/cards';
import { loadAchievements, saveAchievements, Achievement } from '../store/achievements';
import { DIFFICULTY_CFG, useLobby } from './LobbyContext';
import { loadAccount, applyEloChange } from '../store/account';
import { useChallenger } from './ChallengerContext';
import { SHARDS_PER_WIN } from '../store/challengers';
import { useAccount } from './AccountContext';
import { useCodex } from './CodexContext';
import { useMultiplayer } from './MultiplayerContext';

const SHOP_ROTATION_SECONDS = 180;
const BUY_PHASE_SECONDS = 30;
const MAIN_PHASE_SECONDS = 60;

// ── Cross-element combo definitions ──────────────────────────────────────────
const CROSS_COMBOS: [string, string, number, number, string][] = [
  // [themeA, themeB, atk, def, displayName]
  ['fire',      'shadow',    2, 0, '🔥🌑 DARK FLAME'],
  ['frost',     'water',     0, 2, '❄️💧 GLACIAL SURGE'],
  ['electric',  'storm',     2, 0, '⚡⛈️ TEMPEST FORCE'],
  ['poison',    'nature',    1, 1, '☠️🌿 TOXIC BLOOM'],
  ['void',      'shadow',    2, 0, '🌌🌑 ABYSS PACT'],
  ['earth',     'iron',      0, 3, '🪨⚙️ FORTRESS WARD'],
  ['celestial', 'aether',    1, 1, '⭐✨ DIVINE AETHER'],
  ['fire',      'dragon',    2, 0, '🔥🐉 ANCIENT FLAME'],
  ['wind',      'storm',     2, 0, '💨⛈️ GALE FORCE'],
  ['blood',     'fire',      2, 0, '🩸🔥 SANGUINE BLAZE'],
  ['frost',     'shadow',    1, 1, '❄️🌑 FROZEN DARKNESS'],
  ['crystal',   'aether',    0, 2, '💎✨ CRYSTAL RESONANCE'],
  ['bone',      'shadow',    1, 1, '💀🌑 SOUL HARVEST'],
  ['nature',    'earth',     0, 2, '🌿🪨 VERDANT STONE'],
  ['arcane',    'aether',    1, 1, '🔮✨ ARCANE RESONANCE'],
  ['electric',  'water',     1, 1, '⚡💧 STORM SURGE'],
  ['poison',    'blood',     2, 0, '☠️🩸 VIRULENT STRIKE'],
  ['iron',      'bone',      0, 2, '⚙️💀 IRON CRYPT'],
  ['wind',      'frost',     1, 1, '💨❄️ ARCTIC GALE'],
  ['void',      'arcane',    1, 1, '🌌🔮 VOID ARCANA'],
];

interface GameContextType {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  playCard: (cardInstanceId: string, targetId?: string) => void;
  stageSpell: (cardInstanceId: string, targetId?: string) => void;
  sellArtifact: () => void;
  sellCreature: (instanceId: string) => void;
  sellHandCard: (instanceId: string) => void;
  attackWith: (attackerInstanceId: string, targetPlayerId: number, targetInstanceId?: string) => void;
  useAbility: (attackerInstanceId: string, abilityIndex: number, targetPlayerId: number, targetInstanceId?: string) => void;
  buyItem: (shopItemId: string) => void;
  useInventoryItem: (inventoryInstanceId: string, targetId?: string) => void;
  equipInventoryItem: (instanceId: string) => void;
  endPhase: () => void;
  pickDraftCard: (template: CardTemplate) => void;
  recallFieldCard: (instanceId: string) => void;
  achievements: Achievement[];
  achievementToast: string | null;
  combatAnim: { targetId: string; damage: number; attackerId?: string } | null;
  playedCardAnim: { card: CardInstance; key: number } | null;
  announcement: string | null;
  shopRotationIds: string[];
  shopRotationTimeLeft: number;
  buyPhaseTimeLeft: number | null;
  mainPhaseTimeLeft: number | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [combatAnim, setCombatAnim] = useState<{ targetId: string; damage: number; attackerId?: string } | null>(null);
  const [playedCardAnim, setPlayedCardAnim] = useState<{ card: CardInstance; key: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [shopRotationIds, setShopRotationIds] = useState<string[]>(() => generateShopRotation());
  const [shopRotationTimeLeft, setShopRotationTimeLeft] = useState(SHOP_ROTATION_SECONDS);
  const [buyPhaseTimeLeft, setBuyPhaseTimeLeft] = useState<number | null>(null);
  const [mainPhaseTimeLeft, setMainPhaseTimeLeft] = useState<number | null>(null);

  // Multiplayer relay
  const { sendCombatAnim, setOnCombatAnim, sendTurnEndSignal, setOnOpponentTurnEnded } = useMultiplayer();
  const sendTurnEndSignalRef = useRef(sendTurnEndSignal);
  sendTurnEndSignalRef.current = sendTurnEndSignal;

  // Receive remote combat anims and mirror them locally
  useEffect(() => {
    setOnCombatAnim((payload) => {
      setCombatAnim({ targetId: payload.targetId, damage: payload.damage, attackerId: payload.attackerInstanceId });
      setTimeout(() => setCombatAnim(null), 700);
    });
    return () => setOnCombatAnim(null);
  }, [setOnCombatAnim]);

  // When an opponent signals their turn ended, advance our local game state
  const dispatchRef2 = useRef(dispatch);
  dispatchRef2.current = dispatch;
  useEffect(() => {
    setOnOpponentTurnEnded(() => {
      if (dispatchRef2.current) dispatchRef2.current({ type: 'END_TURN' });
    });
    return () => setOnOpponentTurnEnded(null);
  }, [setOnOpponentTurnEnded]);

  // Lobby settings
  const { autoCombat } = useLobby();
  const autoCombatRef = useRef(autoCombat);
  autoCombatRef.current = autoCombat;

  // Challenger system
  const { equippedChallenger, addShards } = useChallenger();
  const { account, unlockAchievement, saveAchievementProgress } = useAccount();
  const saveAchievementProgressRef = useRef(saveAchievementProgress);
  saveAchievementProgressRef.current = saveAchievementProgress;
  const equippedEffectsRef = useRef<string[]>([]);
  equippedEffectsRef.current = equippedChallenger?.effectKeys ?? [];
  const challengerReviveUsedRef = useRef(false);

  // Codex discovery: mark cards as discovered when they enter the human player's hand or field
  const { discoverCards } = useCodex();
  const discoverCardsRef = useRef(discoverCards);
  discoverCardsRef.current = discoverCards;
  useEffect(() => {
    const human = gameState.players.find(p => p.isHuman);
    if (!human) return;
    const ids = [
      ...human.hand.map(c => c.templateId),
      ...human.field.map(c => c.templateId),
    ].filter(Boolean);
    if (ids.length > 0) discoverCardsRef.current(ids);
  }, [gameState.players]);

  useEffect(() => {
    const local = loadAchievements();
    if (!account) {
      setAchievements(local);
      return;
    }
    const ids = new Set(account.unlockedAchievementIds);
    setAchievements(local.map(a => ({ ...a, unlocked: ids.has(a.id) })));
  }, [account?.id, account?.unlockedAchievementIds.join('|')]);

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

  // Buy phase timer — resets per phase/player change as normal
  useEffect(() => {
    if (gameState.phase === 'buy') {
      setBuyPhaseTimeLeft(BUY_PHASE_SECONDS);
    } else {
      setBuyPhaseTimeLeft(null);
    }
  }, [gameState.phase, gameState.currentPlayerIndex]);

  // Turn timer — starts when main phase begins and keeps running through combat/end.
  // Only resets when a new player's turn starts (draw/buy) or the game ends.
  useEffect(() => {
    if (gameState.phase === 'main') {
      setMainPhaseTimeLeft(MAIN_PHASE_SECONDS);
    } else if (
      gameState.phase === 'draw' ||
      gameState.phase === 'buy' ||
      gameState.phase === 'gameover' ||
      gameState.phase === 'countdown'
    ) {
      setMainPhaseTimeLeft(null);
    }
    // combat / end: leave the timer running — it spans the whole post-buy turn
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

  useEffect(() => {
    if (mainPhaseTimeLeft === null) return;
    if (mainPhaseTimeLeft <= 0) {
      // Only act if we're still in an active post-buy phase; ignore stale fires
      const phase = stateRef.current?.phase;
      if (phase === 'main' || phase === 'combat') {
        dispatchRef.current({ type: 'SET_PHASE', payload: 'end' });
      }
      setMainPhaseTimeLeft(null);
      return;
    }
    const timer = setTimeout(() => setMainPhaseTimeLeft(t => (t ?? 0) - 1), 1000);
    return () => clearTimeout(timer);
  }, [mainPhaseTimeLeft]);

  const triggerAchievement = (id: string, progressInc = 0) => {
    setAchievements(prev => {
      let changed = false;
      let newlyUnlockedId: string | null = null;
      const next = prev.map(a => {
        if (a.id === id && !a.unlocked) {
          if (a.target && progressInc > 0) {
            const newProg = (a.progress || 0) + progressInc;
            changed = true;
            if (newProg >= a.target) {
              showToast(a.name);
              newlyUnlockedId = a.id;
              return { ...a, progress: newProg, unlocked: true };
            }
            return { ...a, progress: newProg };
          } else if (!a.target) {
            changed = true;
            showToast(a.name);
            newlyUnlockedId = a.id;
            return { ...a, unlocked: true };
          }
        }
        return a;
      });
      if (changed) {
        saveAchievements(next);
        if (newlyUnlockedId) unlockAchievement(newlyUnlockedId);
        // Persist in-progress values to the server so progress survives a localStorage clear
        const progressMap: Record<string, number> = {};
        next.forEach(a => {
          if (!a.unlocked && a.target && (a.progress || 0) > 0) {
            progressMap[a.id] = a.progress!;
          }
        });
        saveAchievementProgressRef.current(progressMap);
      }
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
    setPlayedCardAnim({ card: { ...card }, key: Date.now() });
    setTimeout(() => setPlayedCardAnim(null), 750);
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} played ${card.name}.`, type: 'card' } });

    // Elemental combo detection — triggers when 2nd card of same theme joins field
    if (card.type === 'character' && card.artTheme) {
      const existingSameTheme = player.field.filter(c => c.artTheme === card.artTheme).length;
      if (existingSameTheme === 1) {
        dispatch({ type: 'APPLY_ELEMENTAL_COMBO', payload: { playerId: player.id, artTheme: card.artTheme } });
        const COMBO_NAMES: Record<string, string> = {
          fire: '🔥 FLAME PACT', water: '💧 TIDE BOND', earth: '🪨 EARTH WARD',
          electric: '⚡ STORM LINK', frost: '❄️ FROST BIND', poison: '☠️ VENOM PACT',
          shadow: '🌑 SHADOW LINK', void: '🌌 VOID PACT', iron: '⚙️ IRON BOND',
          dragon: '🐉 DRAGON PACT', aether: '✨ AETHER BOND', celestial: '⭐ CELESTIAL PACT',
          storm: '⛈️ TEMPEST SURGE', huntress: '🏹 HUNTER BOND',
          nature: '🌿 NATURE PACT', blood: '🩸 BLOOD BOND', crystal: '💎 CRYSTAL LINK',
          wind: '💨 WIND PACT', arcane: '🔮 ARCANE BOND', bone: '💀 BONE PACT',
        };
        announce(COMBO_NAMES[card.artTheme] || `${card.artTheme.toUpperCase()} SYNERGY!`);
      }

      // Cross-element combo detection — triggers when this is the FIRST card of its theme
      // but a matching partner theme is already present
      const existingCurrentTheme = player.field.filter(c => c.artTheme === card.artTheme).length;
      if (existingCurrentTheme === 0) {
        for (const [themeA, themeB, atk, def, comboName] of CROSS_COMBOS) {
          const isMatch = card.artTheme === themeA || card.artTheme === themeB;
          if (!isMatch) continue;
          const partnerTheme = card.artTheme === themeA ? themeB : themeA;
          const hasPartner = player.field.some(c => c.artTheme === partnerTheme);
          if (hasPartner) {
            dispatch({ type: 'APPLY_CROSS_COMBO', payload: { playerId: player.id, themeA, themeB, atk, def } });
            announce(comboName);
            if (player.isHuman) triggerAchievement('trigger_cross_combo');
            break; // only one cross-combo per card play
          }
        }
      }
    }

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
    setPlayedCardAnim({ card: { ...card }, key: Date.now() });
    setTimeout(() => setPlayedCardAnim(null), 750);
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
  const handleSpellEffect = (sourcePlayerId: number, sourceInstanceId: string, effect: string, targetId: string | undefined, spellBonus: number) => {
    const isImmuneToPoison = (p: Player) => p.perks.includes('perk_poison_immune');
    const isImmuneToStun = (p: Player) => p.perks.includes('perk_stun_immune');

    const dmgTarget = (tId: string, amount: number) => {
      let targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === tId));
      if (targetOwner) {
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: tId, amount, sourcePlayerId, sourceInstanceId } });
           setCombatAnim({ targetId: tId, damage: amount });
        setTimeout(() => setCombatAnim(null), 600);
      } else {
        targetOwner = gameState.players.find(p => p.id.toString() === tId);
        if (targetOwner) {
          // Defender rule: cannot deal direct damage to a player who still has field cards
          if (targetOwner.field.length > 0) {
            dispatch({ type: 'ADD_LOG', payload: { msg: `${targetOwner.name} is shielded by their defenders — the spell fizzles!`, type: 'other' } });
            return;
          }
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, amount, sourcePlayerId, sourceInstanceId } });
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
        if (creature && creature.currentDef <= 8) {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, sourcePlayerId, sourceInstanceId, bypassResist: true, bypassArmor: true } });
          dispatch({ type: 'ADD_GOLD', payload: { playerId: sourcePlayerId, amount: creature.currentAtk * 50 } });
          sounds.play('gold');
        }
      }
    } else if (effect === 'dmg_2_all_enemies') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 2 + spellBonus, sourcePlayerId, sourceInstanceId } }));
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
        // Defender rule: only hits hero if enemy has no field cards
        if (enemy.field.length > 0) {
          dispatch({ type: 'ADD_LOG', payload: { msg: `${enemy.name}'s defenders absorb the spell — the hero is unharmed!`, type: 'other' } });
        } else {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: enemy.id, amount: 6 + spellBonus, sourcePlayerId, sourceInstanceId } });
          setCombatAnim({ targetId: enemy.id.toString(), damage: 6 + spellBonus });
          setTimeout(() => setCombatAnim(null), 600);
          sounds.play('damage');
        }
      }
    } else if (effect === 'dmg_5_all') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 5 + spellBonus, sourcePlayerId, sourceInstanceId } }));
          // Defender rule: only hits hero if they have no field cards
          if (p.field.length === 0) {
            dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, amount: 5 + spellBonus, sourcePlayerId, sourceInstanceId } });
          }
        }
      });
      sounds.play('damage');
    } else if (effect === 'destroy_target' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
          dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 999, sourcePlayerId, sourceInstanceId, bypassResist: true, bypassArmor: true } });
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
    } else if (effect === 'stun_player') {
      const enemy = gameState.players.find(p => p.id !== sourcePlayerId);
      if (enemy) {
        dispatch({ type: 'STUN_PLAYER', payload: { playerId: enemy.id } });
        dispatch({ type: 'ADD_LOG', payload: { msg: `${enemy.name} is imprisoned in a Soul Cage — their next turn is completely lost!`, type: 'other' } });
        announce('SOUL CAGED!');
        sounds.play('stun');
      }
    } else if (effect === 'silence_target' && targetId) {
      const targetOwner = gameState.players.find(p => p.field.some(c => c.instanceId === targetId));
      if (targetOwner) {
        dispatch({ type: 'APPLY_SILENCE', payload: { playerId: targetOwner.id, instanceId: targetId, turns: 2 } });
        announce('SILENCED!');
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
        dispatch({ type: 'DAMAGE', payload: { targetPlayerId: targetOwner.id, targetInstanceId: targetId, amount: 2 + spellBonus, sourcePlayerId, sourceInstanceId } });
        if (!isImmuneToPoison(targetOwner)) {
          dispatch({ type: 'APPLY_POISON', payload: { playerId: targetOwner.id, instanceId: targetId, stacks: 4 } });
        }
        sounds.play('poison');
      }
    } else if (effect === 'dmg_3_all_and_poison') {
      gameState.players.forEach(p => {
        if (p.id !== sourcePlayerId) {
          p.field.forEach(c => {
            dispatch({ type: 'DAMAGE', payload: { targetPlayerId: p.id, targetInstanceId: c.instanceId, amount: 3 + spellBonus, sourcePlayerId, sourceInstanceId } });
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

    const isSilenced = (attacker as any).silenced === true;
    if (!isSilenced && (attacker.keywords?.includes('poison_on_hit') || attackerPlayer.statBuffs.includes('plague_standard'))) {
      if (!isImmuneToPoison) {
        dispatchRef.current({ type: 'APPLY_POISON', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, stacks: 2 } });
        sounds.play('poison');
      }
    }
    if (!isSilenced && (attacker.keywords?.includes('stun_on_hit') || attackerPlayer.statBuffs.includes('frost_mantle'))) {
      if (!isImmuneToStun) {
        dispatchRef.current({ type: 'APPLY_STUN', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, turns: 1 } });
        sounds.play('stun');
      }
    }
    if (!isSilenced && attacker.keywords?.includes('electric')) {
      sounds.play('electric');
    }
    // Burn: flame_aura cards apply burn stacks on hit
    if (!isSilenced && attacker.keywords?.includes('flame_aura')) {
      dispatchRef.current({ type: 'APPLY_BURN', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, stacks: 1 } });
    }
    // Shadow silence: shadow cards with silence keyword silence the target
    if (!isSilenced && (attacker.keywords?.includes('silence_on_hit') || attacker.keywords?.includes('shadow_silence'))) {
      dispatchRef.current({ type: 'APPLY_SILENCE', payload: { playerId: targetPlayer.id, instanceId: targetInstanceId, turns: 1 } });
    }
  };

  const applyEnchantment = (_playerId: number, targetId: string, effect: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const target = player.field.find(c => c.instanceId === targetId);
    if (!target) return;

    if (effect === 'buff_2_2') {
      dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: targetId, atkDelta: 2, defDelta: 2 } });
      dispatch({ type: 'ADD_LOG', payload: { msg: `${target.name} gains +2 ATK / +2 DEF from enchantment.`, type: 'card' } });
    } else if (effect === 'buff_0_4') {
      dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: targetId, atkDelta: 0, defDelta: 4 } });
      dispatch({ type: 'ADD_LOG', payload: { msg: `${target.name} gains +4 DEF from enchantment.`, type: 'card' } });
    } else if (effect === 'buff_3_m1') {
      dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: targetId, atkDelta: 3, defDelta: -1 } });
      dispatch({ type: 'ADD_LOG', payload: { msg: `${target.name} gains +3 ATK / -1 DEF from enchantment.`, type: 'card' } });
    } else if (effect === 'add_poison_keyword') {
      dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: targetId, atkDelta: 0, defDelta: 0, keyword: 'poison_on_hit' } });
      dispatch({ type: 'ADD_LOG', payload: { msg: `${target.name} now applies poison on hit.`, type: 'card' } });
    } else if (effect === 'add_stun_keyword') {
      dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: targetId, atkDelta: 0, defDelta: 0, keyword: 'stun_on_hit' } });
      dispatch({ type: 'ADD_LOG', payload: { msg: `${target.name} now stuns on hit.`, type: 'card' } });
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

  // ── Recall field card to hand ─────────────────────────────────────────────
  const recallFieldCard = (instanceId: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    if (gameState.phase !== 'main' || !player.isHuman) return;
    const card = player.field.find(c => c.instanceId === instanceId);
    if (!card) return;
    dispatch({ type: 'RECALL_FIELD_CARD', payload: { playerId: player.id, instanceId } });
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} recalled ${card.name} to hand.`, type: 'card' } });
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
    setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg, attackerId: attackerInstanceId });
    setTimeout(() => setCombatAnim(null), 700);
    sendCombatAnim({ attackerInstanceId, targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg });

    if (targetOwner && targetInstanceId) {
      const targetCreature = targetOwner.field.find(c => c.instanceId === targetInstanceId);
      if (targetCreature) {
        applyStatusOnHit(player, attacker, targetOwner, targetInstanceId);
        const resist = targetOwner.perks.includes('perk_resist_1') ? 1 : 0;
        if (targetCreature.currentDef <= (dmg - resist)) {
          const cEffects = equippedEffectsRef.current;
          const doubleKill = player.isHuman && (cEffects.includes('double_kill_gold') || cEffects.includes('bonus_aether_4'));
          dispatch({ type: 'ADD_GOLD', payload: { playerId: player.id, amount: doubleKill ? 100 : 50 } });
          dispatch({ type: 'RECORD_KILL', payload: { playerId: player.id } });
          sounds.play('gold');
          if (player.isHuman) {
            triggerAchievement('kill_5_creatures', 1);
            triggerAchievement('kill_50_creatures', 1);
            // Challenger: steal on kill
            if (cEffects.includes('steal_pct_on_kill')) {
              const enemy = gameState.players.find(p => p.id !== player.id);
              if (enemy && enemy.gold > 0) {
                const stolen = Math.max(1, Math.floor(enemy.gold * 0.05));
                dispatch({ type: 'STEAL_GOLD', payload: { fromPlayerId: enemy.id, toPlayerId: player.id, amount: stolen } });
                dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} plunders ${stolen}g!`, type: 'gold' } });
              }
            }
            // Challenger: heal on kill
            if (cEffects.includes('heal_on_kill_2')) {
              dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 2 } });
            }
          }
          if (attacker.keywords?.includes('heal_on_kill')) {
            dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 2 } });
          }
          // Bloodrite stat buff: kill heals hero
          if (player.statBuffs.includes('bloodrite')) {
            dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 1 } });
          }
          // Amalgam: gains +1/+1 permanently on personal kills only
          if (attacker.keywords?.includes('amalgam')) {
            dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: attackerInstanceId, atkDelta: 1, defDelta: 1 } });
            dispatch({ type: 'ADD_LOG', payload: { msg: `${attacker.name} absorbs ${targetCreature.name}'s essence! (+1/+1)`, type: 'card' } });
          }
        }
      }
    }

    sounds.play('attack');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} attacks for ${dmg} damage!`, type: 'damage' } });
  };

  // ── Use ability ───────────────────────────────────────────────────────────
  const useAbility = (attackerInstanceId: string, abilityIndex: number, targetPlayerId: number, targetInstanceId?: string) => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const attacker = player.field.find(c => c.instanceId === attackerInstanceId);
    if (!attacker || attacker.tapped || attacker.stunned) return;

    const ability = getCardAbilities(attacker)[abilityIndex];
    if (!ability || (attacker.abilityCooldowns?.[abilityIndex] ?? 0) > 0) return;

    // Defender rule: block direct hero damage if enemy has field cards
    const targetOwner = gameState.players.find(p => p.id === targetPlayerId);
    if (!targetInstanceId && targetOwner && targetOwner.field.length > 0) {
      dispatch({ type: 'ADD_LOG', payload: { msg: `${targetOwner.name} is protected by their defenders!`, type: 'other' } });
      return;
    }

    const dmg = attacker.currentAtk + attacker.tempAtkBonus + ability.atkDelta;
    dispatch({ type: 'USE_ABILITY', payload: { attackerPlayerId: player.id, attackerInstanceId, abilityIndex, targetPlayerId, targetInstanceId } });
    setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg, attackerId: attackerInstanceId });
    setTimeout(() => setCombatAnim(null), 700);
    sendCombatAnim({ attackerInstanceId, targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg });
    sounds.play('attack');
    dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name}'s ${attacker.name} uses ${ability.name} for ${dmg} damage!`, type: 'damage' } });

    // Kill bonus if target card is destroyed — same rules as auto-combat loop
    if (targetOwner && targetInstanceId) {
      const targetCard = targetOwner.field.find(c => c.instanceId === targetInstanceId);
      if (targetCard && targetCard.currentDef <= dmg) {
        const cEffects = equippedEffectsRef.current;
        const doubleKill = player.isHuman && (cEffects.includes('double_kill_gold') || cEffects.includes('bonus_aether_4'));
        dispatch({ type: 'ADD_GOLD', payload: { playerId: player.id, amount: doubleKill ? 100 : 50 } });
        dispatch({ type: 'RECORD_KILL', payload: { playerId: player.id } });
        sounds.play('gold');
        if (player.isHuman) {
          triggerAchievement('kill_5_creatures', 1);
          triggerAchievement('kill_50_creatures', 1);
          if (cEffects.includes('steal_pct_on_kill')) {
            const enemy = gameState.players.find(p => p.id !== player.id);
            if (enemy && enemy.gold > 0) {
              const stolen = Math.max(1, Math.floor(enemy.gold * 0.05));
              dispatch({ type: 'STEAL_GOLD', payload: { fromPlayerId: enemy.id, toPlayerId: player.id, amount: stolen } });
              dispatch({ type: 'ADD_LOG', payload: { msg: `${player.name} plunders ${stolen}g!`, type: 'gold' } });
            }
          }
          if (cEffects.includes('heal_on_kill_2')) {
            dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 2 } });
          }
        }
        if (attacker.keywords?.includes('heal_on_kill')) {
          dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 2 } });
        }
        if (player.statBuffs.includes('bloodrite')) {
          dispatch({ type: 'HEAL', payload: { targetPlayerId: player.id, amount: 1 } });
        }
        // Amalgam: gains +1/+1 permanently on personal kills only
        if (attacker.keywords?.includes('amalgam')) {
          const tgtCard = targetOwner.field.find(c => c.instanceId === targetInstanceId);
          dispatch({ type: 'BUFF_CARD', payload: { playerId: player.id, instanceId: attackerInstanceId, atkDelta: 1, defDelta: 1 } });
          dispatch({ type: 'ADD_LOG', payload: { msg: `${attacker.name} absorbs ${tgtCard?.name ?? 'the fallen'}'s essence! (+1/+1)`, type: 'card' } });
        }
      }
    }
  };

  // ── Buy ───────────────────────────────────────────────────────────────────
  const buyItem = (shopItemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === shopItemId);
    if (!item) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    // Challenger: 15% shop discount
    const cEffects = equippedEffectsRef.current;
    const effectiveCost = player.isHuman && cEffects.includes('discount_shop_15')
      ? Math.floor(item.cost * 0.85)
      : item.cost;
    if (player.gold < effectiveCost) return;

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
        dispatch({ type: 'BUY_SHOP_ITEM', payload: { playerId: player.id, itemTemplateId: item.id, cost: effectiveCost, itemType: 'card', name: tpl.name, description: tpl.description, cardTemplate: tpl } });
      }
    } else {
      dispatch({ type: 'BUY_SHOP_ITEM', payload: { playerId: player.id, itemTemplateId: item.id, cost: effectiveCost, itemType: item.type, name: item.name, description: item.description, effectKey: item.effectKey } });
    }

    sounds.play('coinPurchase');
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
   * When multiple opponents exist (e.g. human + other AIs in single-player),
   * AIs distribute attacks instead of all piling on the human.
   * Returns { targetPlayerId, targetInstanceId? }
   */
  function chooseAiAttackTarget(
    cp: typeof gameState.players[0],
    difficulty: AiDifficulty,
    players: typeof gameState.players,
    attacker?: FieldCard,
    amalgamWaiting?: boolean,
  ) {
    // All living opponents (not self)
    const opponents = players.filter(p => p.id !== cp.id && p.hp > 0);
    if (opponents.length === 0) return null;

    // Pick which opponent to attack based on difficulty.
    // With a single opponent there's no choice; with multiple, distribute.
    let chosenOpponent: typeof players[0];

    if (opponents.length === 1) {
      chosenOpponent = opponents[0];
    } else {
      const human = opponents.find(p => p.isHuman);
      const nonHuman = opponents.filter(p => !p.isHuman);
      switch (difficulty) {
        case 'Novice': {
          // Bots mostly fight each other — only 15% chance to target the human
          chosenOpponent = (human && nonHuman.length > 0 && Math.random() < 0.85)
            ? nonHuman[Math.floor(Math.random() * nonHuman.length)]
            : opponents[Math.floor(Math.random() * opponents.length)];
          break;
        }
        case 'Easy': {
          // Bots prefer other bots — 30% chance to target the human
          chosenOpponent = (human && nonHuman.length > 0 && Math.random() < 0.70)
            ? nonHuman[Math.floor(Math.random() * nonHuman.length)]
            : opponents[Math.floor(Math.random() * opponents.length)];
          break;
        }
        case 'Normal': {
          // 45% chance human, 55% weakest opponent
          const weakest = [...opponents].sort((a, b) => a.hp - b.hp)[0];
          chosenOpponent = (human && Math.random() < 0.45) ? human : weakest;
          break;
        }
        case 'Hard': {
          // 60% human, 40% weakest (most killable)
          const weakestH = [...opponents].sort((a, b) => a.hp - b.hp)[0];
          chosenOpponent = (human && Math.random() < 0.6) ? human : weakestH;
          break;
        }
        case 'Expert':
        case 'Nightmare':
        default: {
          // 70% human, 30% weakest — smart but not perfectly predictable
          const weakestE = [...opponents].sort((a, b) => a.hp - b.hp)[0];
          chosenOpponent = (human && Math.random() < 0.7) ? human : weakestE;
          break;
        }
      }
    }

    // Apply the defender rule and card-targeting logic for the chosen opponent
    const defenders = chosenOpponent.field.filter(c => !c.stunned);
    const activeField = chosenOpponent.field; // includes stunned

    if (activeField.length > 0) {
      const atkPow = attacker ? attacker.currentAtk + attacker.tempAtkBonus : 0;

      switch (difficulty) {
        case 'Novice':
          // Dumb: random target, ignores taunt
          return {
            targetPlayerId: chosenOpponent.id,
            targetInstanceId: (defenders.length > 0
              ? defenders[Math.floor(Math.random() * defenders.length)]
              : activeField[0]
            ).instanceId,
          };

        case 'Easy': {
          // Respect taunt; otherwise random
          const tauntEasy = defenders.find(c => c.keywords?.includes('taunt'));
          if (tauntEasy) return { targetPlayerId: chosenOpponent.id, targetInstanceId: tauntEasy.instanceId };
          const pool = defenders.length > 0 ? defenders : activeField;
          return { targetPlayerId: chosenOpponent.id, targetInstanceId: pool[Math.floor(Math.random() * pool.length)].instanceId };
        }

        case 'Normal': {
          // Taunt → weakest killable by this card → lowest DEF
          const tauntNormal = defenders.find(c => c.keywords?.includes('taunt'));
          if (tauntNormal) return { targetPlayerId: chosenOpponent.id, targetInstanceId: tauntNormal.instanceId };
          const killableNormal = defenders
            .filter(c => c.currentDef <= atkPow && !(amalgamWaiting && c.currentDef <= (attacker ? atkPow * 0.5 : 0)))
            .sort((a, b) => a.currentDef - b.currentDef)[0];
          const lowestDef = [...defenders].sort((a, b) => a.currentDef - b.currentDef)[0];
          return { targetPlayerId: chosenOpponent.id, targetInstanceId: (killableNormal ?? lowestDef ?? activeField[0]).instanceId };
        }

        case 'Hard': {
          // Taunt → highest-threat killable → biggest threat
          const tauntHard = defenders.find(c => c.keywords?.includes('taunt'));
          if (tauntHard) return { targetPlayerId: chosenOpponent.id, targetInstanceId: tauntHard.instanceId };
          const killableNow = defenders
            .filter(c => c.currentDef <= atkPow)
            .sort((a, b) => b.currentAtk - a.currentAtk)[0];
          if (killableNow) return { targetPlayerId: chosenOpponent.id, targetInstanceId: killableNow.instanceId };
          const untappedHard = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);
          const totalAtkHard = untappedHard.reduce((s, c) => s + c.currentAtk + c.tempAtkBonus, 0);
          const killableAll = defenders.filter(c => c.currentDef <= totalAtkHard).sort((a, b) => b.currentAtk - a.currentAtk)[0];
          const biggestThreat = [...defenders].sort((a, b) => b.currentAtk - a.currentAtk)[0];
          return { targetPlayerId: chosenOpponent.id, targetInstanceId: (killableAll ?? biggestThreat ?? activeField[0]).instanceId };
        }

        case 'Expert':
        case 'Nightmare': {
          // Optimal: taunt → highest-threat killable → target Amalgam → biggest threat
          const tauntEx = defenders.find(c => c.keywords?.includes('taunt'));
          if (tauntEx) return { targetPlayerId: chosenOpponent.id, targetInstanceId: tauntEx.instanceId };
          const killableEx = defenders
            .filter(c => c.currentDef <= atkPow)
            .sort((a, b) => b.currentAtk - a.currentAtk)[0];
          if (killableEx) return { targetPlayerId: chosenOpponent.id, targetInstanceId: killableEx.instanceId };
          const enemyAmalgam = defenders.find(c => c.keywords?.includes('amalgam'));
          if (enemyAmalgam) return { targetPlayerId: chosenOpponent.id, targetInstanceId: enemyAmalgam.instanceId };
          const biggestThreatEx = [...defenders].sort((a, b) => b.currentAtk - a.currentAtk)[0];
          return { targetPlayerId: chosenOpponent.id, targetInstanceId: (biggestThreatEx ?? activeField[0]).instanceId };
        }
      }
    }

    // No defenders — hero is vulnerable
    return { targetPlayerId: chosenOpponent.id, targetInstanceId: undefined };
  }

  /** Choose which card the AI plays based on difficulty */
  function chooseAiCard(
    cp: typeof gameState.players[0],
    difficulty: AiDifficulty,
    players: typeof gameState.players,
  ) {
    // Curse cards require a field target — only include them when a valid target exists
    const hasEnemyFieldTargets = players.some(p => p.id !== cp.id && p.hp > 0 && p.field.length > 0);
    const affordable = cp.hand
      .filter(c =>
        c.cost <= cp.aether &&
        !cp.cardsPlayedByType[c.type] &&
        !(c.type === 'character' && cp.field.length >= 4) &&
        !(c.type === 'artifact' && cp.artifactSlot !== null) &&
        !(c.type === 'curse' && !hasEnemyFieldTargets)
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

  /** Choose spell target based on difficulty — targets any living opponent, not just the human */
  function chooseAiSpellTarget(
    effect: string,
    difficulty: AiDifficulty,
    players: typeof gameState.players,
    cpId: number,
  ): string | undefined {
    const opponents = players.filter(p => p.id !== cpId && p.hp > 0);
    if (opponents.length === 0) return undefined;

    // Pick which opponent to aim the spell at — mirrors chooseAiAttackTarget logic
    const human = opponents.find(p => p.isHuman);
    const nonHuman = opponents.filter(p => !p.isHuman);
    let chosen: typeof opponents[0];
    if (opponents.length === 1) {
      chosen = opponents[0];
    } else if (difficulty === 'Novice') {
      // Mostly fight other bots — 15% chance to target human
      chosen = (human && nonHuman.length > 0 && Math.random() < 0.85)
        ? nonHuman[Math.floor(Math.random() * nonHuman.length)]
        : opponents[Math.floor(Math.random() * opponents.length)];
    } else if (difficulty === 'Easy') {
      // 30% chance to target human
      chosen = (human && nonHuman.length > 0 && Math.random() < 0.70)
        ? nonHuman[Math.floor(Math.random() * nonHuman.length)]
        : opponents[Math.floor(Math.random() * opponents.length)];
    } else if (difficulty === 'Normal') {
      // 45% chance human, 55% weakest — mirrors attack targeting
      const weakest = [...opponents].sort((a, b) => a.hp - b.hp)[0];
      chosen = (human && Math.random() < 0.45) ? human : weakest;
    } else if (difficulty === 'Hard') {
      // 60% human, 40% weakest
      const weakestH = [...opponents].sort((a, b) => a.hp - b.hp)[0];
      chosen = (human && Math.random() < 0.6) ? human : weakestH;
    } else {
      // Expert/Nightmare: 70% human, 30% weakest
      const weakestE = [...opponents].sort((a, b) => a.hp - b.hp)[0];
      chosen = (human && Math.random() < 0.7) ? human : weakestE;
    }

    if (effect.includes('target')) {
      const isDamageEffect = effect.startsWith('dmg_') || effect.includes('destroy') || effect.includes('poison') || effect.includes('burn');
      // Defender rule: damage spells must target field cards if the chosen opponent has any
      if (isDamageEffect && chosen.field.length > 0) {
        if (difficulty === 'Hard' || difficulty === 'Expert' || difficulty === 'Nightmare') {
          const best = [...chosen.field].sort((a, b) => b.currentAtk - a.currentAtk)[0];
          return best.instanceId;
        }
        return chosen.field[0].instanceId;
      }
      if (difficulty === 'Hard' || difficulty === 'Expert' || difficulty === 'Nightmare') {
        const best = [...chosen.field].sort((a, b) => b.currentAtk - a.currentAtk)[0];
        return best ? best.instanceId : chosen.id.toString();
      }
      return chosen.field.length === 0 ? chosen.id.toString() : chosen.field[0].instanceId;
    }
    return undefined;
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  const eloAppliedRef = useRef(false);

  useEffect(() => {
    // Reset ELO guard and challenger revive when a new game starts
    const phase = gameState.phase as string;
    if (phase === 'countdown') {
      eloAppliedRef.current = false;
      challengerReviveUsedRef.current = false;
      return;
    }
    if (phase === 'gameover') {
      const winner = gameState.players.find(p => p.id === gameState.winner);
      if (winner?.isHuman) {
        sounds.play('victory');
        triggerAchievement('first_win');
        triggerAchievement('win_3_games', 1);
        triggerAchievement('win_10_games', 1);
        triggerAchievement('mythic_50_wins', 1);
        if (!winner.damageTakenThisGame) triggerAchievement('win_no_damage');
        // Logged-in wins are persisted by GamePage's match record. Keep the
        // local reward for offline play without awarding the account twice.
        if (!account) addShards(SHARDS_PER_WIN);
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

        // Full player stun: skip entire turn
        const wasPlayerStunned = (cp.playerStunTurns ?? 0) > 0;
        dispatchRef.current({ type: 'REPLENISH_AETHER', payload: { playerId: cp.id } });
        dispatchRef.current({ type: 'PROCESS_STATUS_EFFECTS', payload: { playerId: cp.id } });
        dispatchRef.current({ type: 'TICK_COOLDOWNS', payload: { playerId: cp.id } });

        if (wasPlayerStunned) {
          dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} is imprisoned — their turn is skipped!`, type: 'other' } });
          // Only skip to end if the game is still active (status effects above may have triggered gameover)
          if (stateRef.current.phase !== 'gameover') {
            dispatchRef.current({ type: 'SET_PHASE', payload: 'end' });
          }
          return;
        }

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
          // Challenger: heal on draw / heal per turn
          const cEffects = equippedEffectsRef.current;
          if (cEffects.includes('heal_on_draw_1') || cEffects.includes('heal_per_turn_1')) {
            dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 1 } });
          }
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
      // Remote human slot: don't auto-advance — wait for OPPONENT_TURN_ENDED over WS
      if (currentPlayer.isRemoteHuman) return;

      gameLoopRef.current = setTimeout(() => {
        // Guard: a delayed attack/damage may have triggered gameover while we waited
        if (stateRef.current.phase === 'gameover') return;
        checkEvolutions();
        if (currentPlayer.isHuman) {
          triggerAchievement('survive_10_turns', 1);
          // Notify other human players in multiplayer that this turn is done
          if (gameState.matchType === 'multiplayer') {
            sendTurnEndSignalRef.current();
          }
        }
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
        const untappedRaw = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);
        // Amalgam attacks last so other cards can weaken targets for it to finish
        const untapped = [...untappedRaw].sort((a, b) => {
          const aAmalgam = a.keywords?.includes('amalgam') ? 1 : 0;
          const bAmalgam = b.keywords?.includes('amalgam') ? 1 : 0;
          return aAmalgam - bAmalgam;
        });

        if (untapped.length === 0) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        // Check that at least one living opponent exists (chooseAiAttackTarget will handle the rest)
        const hasLivingOpponent = state.players.some(p => p.id !== cp.id && p.hp > 0);
        if (!hasLivingOpponent) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const attacker = untapped[0];
        const amalgamWaiting = untapped.slice(1).some(c => c.keywords?.includes('amalgam'));
        const target = chooseAiAttackTarget(cp, diff, state.players, attacker, amalgamWaiting);
        if (!target) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        // Resolve the actual target player for downstream logic
        const targetPlayer = state.players.find(p => p.id === target.targetPlayerId);

        // AI: use a ready ability if one is available (Hard+ always, others 50% chance)
        const aiAbilities = getCardAbilities(attacker);
        const readyAbilities = aiAbilities
          .map((ab, i) => ({ ab, i }))
          .filter(({ i }) => (attacker.abilityCooldowns?.[i] ?? 0) === 0);
        // Silenced cards cannot use abilities
        const shouldUseAbility = !attacker.silenced && readyAbilities.length > 0 &&
          (diff === 'Hard' || diff === 'Expert' || diff === 'Nightmare' ? true : Math.random() < 0.5);

        if (shouldUseAbility) {
          const best = readyAbilities.reduce((a, b) => a.ab.atkDelta >= b.ab.atkDelta ? a : b);
          const abilityDmg = attacker.currentAtk + attacker.tempAtkBonus + best.ab.atkDelta;
          dispatchRef.current({
            type: 'USE_ABILITY',
            payload: { attackerPlayerId: cp.id, attackerInstanceId: attacker.instanceId, abilityIndex: best.i, targetPlayerId: target.targetPlayerId, targetInstanceId: target.targetInstanceId },
          });
          setCombatAnim({ targetId: target.targetInstanceId || target.targetPlayerId.toString(), damage: abilityDmg, attackerId: attacker.instanceId });
          setTimeout(() => setCombatAnim(null), 650);
          dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name}'s ${attacker.name} uses ${best.ab.name} for ${abilityDmg} damage!`, type: 'damage' } });
          sounds.play('attack');
          if (target.targetInstanceId && targetPlayer) {
            const tgtCreature = targetPlayer.field.find(c => c.instanceId === target.targetInstanceId);
            if (tgtCreature && tgtCreature.currentDef <= abilityDmg) {
              dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: 50 } });
              dispatchRef.current({ type: 'RECORD_KILL', payload: { playerId: cp.id } });
              if (attacker.keywords?.includes('amalgam')) {
                dispatchRef.current({ type: 'BUFF_CARD', payload: { playerId: cp.id, instanceId: attacker.instanceId, atkDelta: 1, defDelta: 1 } });
                dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${attacker.name} absorbs ${tgtCreature.name}'s essence! (+1/+1)`, type: 'card' } });
              }
            }
          }
          gameLoopRef.current = setTimeout(runAiCombatLoop, 700);
          return;
        }

        const dmg = attacker.currentAtk + attacker.tempAtkBonus;

        // Kill-steal: if this attack would kill the target hero, take 40% of their gold first
        if (!target.targetInstanceId && targetPlayer) {
          const resist = targetPlayer.perks.includes('perk_resist_1') ? 1 : 0;
          const effectiveDmg = Math.max(0, dmg - resist);
          const wouldKill = targetPlayer.hp - effectiveDmg <= 0 &&
            !(targetPlayer.perks.includes('perk_undying') && !targetPlayer.undyingUsed);
          if (wouldKill && targetPlayer.gold > 0) {
            const stolen = Math.floor(targetPlayer.gold * 0.4);
            if (stolen > 0) {
              dispatchRef.current({ type: 'STEAL_GOLD', payload: { fromPlayerId: targetPlayer.id, toPlayerId: cp.id, amount: stolen } });
              dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} plundered ${stolen}g from ${targetPlayer.name}!`, type: 'gold' } });
            }
          }
        }

        // Capture human field before attack for challenger revive check
        const humanBeforeAttack = state.players.find(p => p.isHuman);
        const humanFieldBefore: FieldCard[] = humanBeforeAttack ? [...humanBeforeAttack.field] : [];

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
        setCombatAnim({ targetId: target.targetInstanceId || target.targetPlayerId.toString(), damage: dmg, attackerId: attacker.instanceId });
        setTimeout(() => setCombatAnim(null), 650);

        // Challenger: revive first death
        if (
          target.targetInstanceId &&
          equippedEffectsRef.current.includes('revive_first_death') &&
          !challengerReviveUsedRef.current
        ) {
          setTimeout(() => {
            const newState = stateRef.current;
            const humanAfter = newState.players.find(p => p.isHuman);
            if (!humanAfter) return;
            const currIds = new Set(humanAfter.field.map(c => c.instanceId));
            const deadCards = humanFieldBefore.filter(c => !currIds.has(c.instanceId));
            if (deadCards.length > 0) {
              challengerReviveUsedRef.current = true;
              const dead = deadCards[0];
              const revivedCard: CardInstance = {
                templateId: dead.templateId,
                instanceId: `card_${generateId()}`,
                name: dead.name,
                type: dead.type,
                cost: dead.cost,
                atk: dead.atk,
                def: dead.def,
                description: dead.description,
                rarity: dead.rarity,
                keywords: dead.keywords,
                effect: dead.effect,
                artTheme: dead.artTheme,
              };
              dispatchRef.current({ type: 'GIVE_STARTING_CARDS', payload: { playerId: humanAfter.id, cards: [revivedCard] } });
              dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `✨ Draela's spirit revives ${dead.name} — returned to your hand!`, type: 'card' } });
              announce(`${dead.name} REVIVED!`);
            }
          }, 200);
        }

        // AI status on hit — apply to the actual target player (not hardcoded human)
        if (target.targetInstanceId && targetPlayer) {
          if (attacker.keywords?.includes('poison_on_hit') || cp.statBuffs.includes('plague_standard')) {
            if (!targetPlayer.perks.includes('perk_poison_immune')) {
              dispatchRef.current({ type: 'APPLY_POISON', payload: { playerId: targetPlayer.id, instanceId: target.targetInstanceId, stacks: 2 } });
            }
          }
          if (attacker.keywords?.includes('stun_on_hit') || cp.statBuffs.includes('frost_mantle')) {
            if (!targetPlayer.perks.includes('perk_stun_immune')) {
              dispatchRef.current({ type: 'APPLY_STUN', payload: { playerId: targetPlayer.id, instanceId: target.targetInstanceId, turns: 1 } });
            }
          }
          // AI kill bonus
          const tgtCreature = targetPlayer.field.find(c => c.instanceId === target.targetInstanceId);
          if (tgtCreature && tgtCreature.currentDef <= dmg) {
            dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: 50 } });
            dispatchRef.current({ type: 'RECORD_KILL', payload: { playerId: cp.id } });
            if (attacker.keywords?.includes('heal_on_kill')) {
              dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
            }
            if (attacker.keywords?.includes('amalgam')) {
              dispatchRef.current({ type: 'BUFF_CARD', payload: { playerId: cp.id, instanceId: attacker.instanceId, atkDelta: 1, defDelta: 1 } });
              dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${attacker.name} absorbs ${tgtCreature.name}'s essence! (+1/+1)`, type: 'card' } });
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
          const spellBonus = (cp?.statBuffs.includes('rabadon') ? 2 : 0)
            + (equippedEffectsRef.current.includes('spell_power_2') && cp?.isHuman ? 2 : 0)
            + (equippedEffectsRef.current.includes('spell_power_1') && cp?.isHuman ? 1 : 0);
          spells.forEach(spell => {
            if (spell.effect) handleSpellEffect(currentPlayer.id, spell.instanceId, spell.effect, spell.targetId, spellBonus);
            dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${currentPlayer.name}'s ${spell.name} fires!`, type: 'card' } });
          });
          sounds.play('cardPlay_spell');
          dispatchRef.current({ type: 'CLEAR_PENDING_SPELLS', payload: { playerId: currentPlayer.id } });

          // After spells resolve, continue with creature attacks.
          // The effect will NOT re-run because phase/currentPlayerIndex haven't changed.
          if (!currentPlayer.isHuman) {
            gameLoopRef.current = setTimeout(runAiCombatLoop, 400);
          } else if (autoCombatRef.current) {
            gameLoopRef.current = setTimeout(runPlayerAutoCombatLoop, 400);
          }
        }, 400);
        return;
      }

      // ── Player auto-combat loop ─────────────────────────────────────────
      // Declared as a function (not const) so it is hoisted and accessible
      // inside the spell-resolution closure above without a TDZ error.
      function runPlayerAutoCombatLoop() {
        const state = stateRef.current;
        const cp = state.players[state.currentPlayerIndex];
        if (!cp || !cp.isHuman || state.phase !== 'combat') return;

        const untapped = cp.field.filter(c => !c.tapped && !c.hasAttackedThisTurn && !c.stunned);
        if (untapped.length === 0) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const enemy = state.players.find(p => !p.isHuman && p.hp > 0);
        if (!enemy) {
          dispatchRef.current({ type: 'ADVANCE_PHASE' });
          return;
        }

        const attacker = untapped[0];
        const enemyCards = enemy.field;

        // Target: lowest-currentDef enemy card; hero only if field is empty
        const targetPlayerId = enemy.id;
        let targetInstanceId: string | undefined;
        if (enemyCards.length > 0) {
          const lowestHp = [...enemyCards].sort((a, b) => a.currentDef - b.currentDef)[0];
          targetInstanceId = lowestHp.instanceId;
        }

        // Pick strongest ready ability (highest effective damage)
        const abilities = getCardAbilities(attacker);
        const readyAbilities = abilities
          .map((ab, i) => ({ ab, i }))
          .filter(({ i }) => (attacker.abilityCooldowns?.[i] ?? 0) === 0);

        const cEffects = equippedEffectsRef.current;

        // Silenced cards cannot use abilities
        if (!attacker.silenced && readyAbilities.length > 0) {
          const best = readyAbilities.reduce((a, b) =>
            (attacker.currentAtk + attacker.tempAtkBonus + a.ab.atkDelta) >=
            (attacker.currentAtk + attacker.tempAtkBonus + b.ab.atkDelta) ? a : b,
          );
          const dmg = attacker.currentAtk + attacker.tempAtkBonus + best.ab.atkDelta;

          dispatchRef.current({
            type: 'USE_ABILITY',
            payload: { attackerPlayerId: cp.id, attackerInstanceId: attacker.instanceId, abilityIndex: best.i, targetPlayerId, targetInstanceId },
          });
          setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg, attackerId: attacker.instanceId });
          setTimeout(() => setCombatAnim(null), 650);
          sounds.play('attack');
          dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${attacker.name} uses ${best.ab.name} for ${dmg} damage!`, type: 'damage' } });

          if (targetInstanceId) {
            const tgt = enemy.field.find(c => c.instanceId === targetInstanceId);
            if (tgt && tgt.currentDef <= dmg) {
              const doubleKill = cEffects.includes('double_kill_gold') || cEffects.includes('bonus_aether_4');
              dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: doubleKill ? 100 : 50 } });
              dispatchRef.current({ type: 'RECORD_KILL', payload: { playerId: cp.id } });
              sounds.play('gold');
              triggerAchievement('kill_5_creatures', 1);
              triggerAchievement('kill_50_creatures', 1);
              if (cEffects.includes('steal_pct_on_kill')) {
                const stolen = Math.max(1, Math.floor(enemy.gold * 0.05));
                dispatchRef.current({ type: 'STEAL_GOLD', payload: { fromPlayerId: enemy.id, toPlayerId: cp.id, amount: stolen } });
              }
              if (cEffects.includes('heal_on_kill_2')) {
                dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
              }
              if (attacker.keywords?.includes('heal_on_kill')) {
                dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
              }
              if (cp.statBuffs.includes('bloodrite')) {
                dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 1 } });
              }
            }
          }
        } else {
          // Regular attack
          let dmg = attacker.currentAtk + attacker.tempAtkBonus;
          if (cp.statBuffs.includes('stormrazor') && !attacker.hasAttackedThisTurn) dmg += 1;

          // Thornmail
          const targetOwnerState = state.players.find(p => p.id === targetPlayerId);
          if (targetOwnerState?.statBuffs.includes('thornmail') && targetInstanceId) {
            dispatchRef.current({ type: 'DAMAGE', payload: { targetPlayerId: cp.id, targetInstanceId: attacker.instanceId, amount: 1 } });
          }

          // Kill-steal for hero attack
          if (!targetInstanceId && enemy.gold > 0) {
            const resist = enemy.perks.includes('perk_resist_1') ? 1 : 0;
            const effectiveDmg = Math.max(0, dmg - resist);
            const wouldKill = enemy.hp - effectiveDmg <= 0 && !(enemy.perks.includes('perk_undying') && !enemy.undyingUsed);
            if (wouldKill) {
              const stolen = Math.floor(enemy.gold * 0.4);
              if (stolen > 0) {
                dispatchRef.current({ type: 'STEAL_GOLD', payload: { fromPlayerId: enemy.id, toPlayerId: cp.id, amount: stolen } });
                dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} plundered ${stolen}g from ${enemy.name}!`, type: 'gold' } });
                sounds.play('gold');
              }
            }
          }

          dispatchRef.current({
            type: 'ATTACK',
            payload: { attackerPlayerId: cp.id, attackerInstanceId: attacker.instanceId, targetPlayerId, targetInstanceId, damageOverride: dmg },
          });
          setCombatAnim({ targetId: targetInstanceId || targetPlayerId.toString(), damage: dmg, attackerId: attacker.instanceId });
          setTimeout(() => setCombatAnim(null), 650);

          if (targetInstanceId && targetOwnerState) {
            const tgt = targetOwnerState.field.find(c => c.instanceId === targetInstanceId);
            if (tgt) {
              applyStatusOnHit(cp, attacker, targetOwnerState, targetInstanceId);
              const resist = targetOwnerState.perks.includes('perk_resist_1') ? 1 : 0;
              if (tgt.currentDef <= (dmg - resist)) {
                const doubleKill = cEffects.includes('double_kill_gold') || cEffects.includes('bonus_aether_4');
                dispatchRef.current({ type: 'ADD_GOLD', payload: { playerId: cp.id, amount: doubleKill ? 100 : 50 } });
                dispatchRef.current({ type: 'RECORD_KILL', payload: { playerId: cp.id } });
                sounds.play('gold');
                triggerAchievement('kill_5_creatures', 1);
                triggerAchievement('kill_50_creatures', 1);
                if (cEffects.includes('steal_pct_on_kill')) {
                  const stolen = Math.max(1, Math.floor(enemy.gold * 0.05));
                  dispatchRef.current({ type: 'STEAL_GOLD', payload: { fromPlayerId: enemy.id, toPlayerId: cp.id, amount: stolen } });
                  dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${cp.name} plunders ${stolen}g!`, type: 'gold' } });
                }
                if (cEffects.includes('heal_on_kill_2')) {
                  dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
                }
                if (attacker.keywords?.includes('heal_on_kill')) {
                  dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 2 } });
                }
                if (cp.statBuffs.includes('bloodrite')) {
                  dispatchRef.current({ type: 'HEAL', payload: { targetPlayerId: cp.id, amount: 1 } });
                }
                // Amalgam: gains +1/+1 permanently on personal kills only
                if (attacker.keywords?.includes('amalgam')) {
                  dispatchRef.current({ type: 'BUFF_CARD', payload: { playerId: cp.id, instanceId: attacker.instanceId, atkDelta: 1, defDelta: 1 } });
                  dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${attacker.name} absorbs ${tgt.name}'s essence! (+1/+1)`, type: 'card' } });
                }
              }
            }
          }

          sounds.play('attack');
          dispatchRef.current({ type: 'ADD_LOG', payload: { msg: `${attacker.name} attacks for ${dmg} damage!`, type: 'damage' } });
        }

        gameLoopRef.current = setTimeout(runPlayerAutoCombatLoop, 700);
      }

      if (!currentPlayer.isHuman && !currentPlayer.isRemoteHuman) {
        gameLoopRef.current = setTimeout(runAiCombatLoop, 900);
      } else if (autoCombatRef.current) {
        gameLoopRef.current = setTimeout(runPlayerAutoCombatLoop, 900);
      }
      return;
    }

    // ── AI main / buy phases ───────────────────────────────────────────────
    // Remote human slots wait for OPPONENT_TURN_ENDED signal — no AI logic
    if (!currentPlayer.isHuman && !currentPlayer.isRemoteHuman) {
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
            setPlayedCardAnim({ card: { ...card }, key: Date.now() });
            setTimeout(() => setPlayedCardAnim(null), 750);
            dispatchRef.current({ type: 'STAGE_SPELL', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId } });
          } else if (card.type === 'enchantment') {
            const targetId = cp.field[0]?.instanceId;
            if (targetId) {
              setPlayedCardAnim({ card: { ...card }, key: Date.now() });
              setTimeout(() => setPlayedCardAnim(null), 750);
              dispatchRef.current({ type: 'PLAY_CARD', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId } });
            } else {
              dispatchRef.current({ type: 'ADVANCE_PHASE' });
              return;
            }
          } else if (card.type === 'curse') {
            // Curse cards must target an enemy field card — pick one based on difficulty
            const opponents = state.players.filter(p => p.id !== cp.id && p.hp > 0 && p.field.length > 0);
            if (opponents.length === 0) { dispatchRef.current({ type: 'ADVANCE_PHASE' }); return; }
            const target = (() => {
              const allField = opponents.flatMap(p => p.field);
              if (diff === 'Hard' || diff === 'Expert' || diff === 'Nightmare') {
                // Target the highest-DEF card (hardest to kill, most impactful to debuff)
                return [...allField].sort((a, b) => b.currentDef - a.currentDef)[0];
              }
              return allField[Math.floor(Math.random() * allField.length)];
            })();
            setPlayedCardAnim({ card: { ...card }, key: Date.now() });
            setTimeout(() => setPlayedCardAnim(null), 750);
            dispatchRef.current({ type: 'PLAY_CARD', payload: { playerId: cp.id, cardInstanceId: card.instanceId, targetId: target.instanceId } });
          } else {
            setPlayedCardAnim({ card: { ...card }, key: Date.now() });
            setTimeout(() => setPlayedCardAnim(null), 750);
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
      gameState, dispatch, playCard, stageSpell, sellArtifact, sellCreature, sellHandCard, attackWith, useAbility,
      buyItem, useInventoryItem, equipInventoryItem, endPhase, pickDraftCard, recallFieldCard,
      achievements, achievementToast, combatAnim, playedCardAnim, announcement,
      shopRotationIds, shopRotationTimeLeft, buyPhaseTimeLeft, mainPhaseTimeLeft,
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
