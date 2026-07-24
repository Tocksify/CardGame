---
name: Aethermancer Challenger System
description: Full challenger system — pre-game characters with in-game abilities, Arcane Shards currency, roster store UI.
---

## Architecture

- `artifacts/aethermancer/src/lib/challengers.ts` — All 19 challenger definitions (rarities, costs, effectKeys, icons)
- `artifacts/aethermancer/src/store/challengers.ts` — localStorage persistence (key: `aethermancer_challengers`), buy/equip/addShards helpers, `SHARDS_PER_WIN = 150`
- `artifacts/aethermancer/src/context/ChallengerContext.tsx` — React context wrapping the store; wraps above GameProvider in App.tsx
- `artifacts/aethermancer/src/pages/ChallengersPage.tsx` — Roster UI with filter tabs, modal detail, buy/equip actions

## Effect System

Effects are applied in two places:

**At game start (LobbyPage.tsx `handleStart`):** Mutate the human Player object before dispatching START_GAME:
- `bonus_gold_start_300` → gold += 300
- `bonus_hp_10` → hp/maxHp += 10
- `bonus_aether_3/4` → aetherBonus += N (also bumps starting aether)
- Perk-based: `perk_poison_immune`, `perk_stun_immune`, `perk_draw_1`, `perk_resist_1`, `perk_undying`, `perk_deploy_bonus` → pushed into player.perks[]
- `start_legendary` → random legendary card (IDs: c10, c11, h3, h9, h18, h19, l1, l2) added to hand

**During game (GameContext.tsx):** Uses `equippedEffectsRef` (ref to equippedChallenger.effectKeys):
- Draw phase: `heal_on_draw_1`, `heal_per_turn_1` → HEAL +1 HP
- Kill (attackWith): `double_kill_gold` → 100g kill instead of 50g; `steal_pct_on_kill` → steal 5% enemy gold; `heal_on_kill_2` → heal 2 HP
- Buy (buyItem): `discount_shop_15` → effectiveCost = floor(item.cost * 0.85)
- Spells: `spell_power_1/2` → added to spellBonus in combat phase spell resolution
- `revive_first_death` → in AI runAiCombatLoop, captures humanFieldBefore ATTACK, then 200ms later checks for dead cards, dispatches GIVE_STARTING_CARDS with the revived card (CardInstance, back to hand)

## Currency

- 150 Arcane Shards per win, awarded in GameContext gameover phase when winner.isHuman
- `addShards()` called from useChallenger context

## Free Starters

Kael (bonus_gold_start_300) and Lyra (heal_on_draw_1) are always unlocked. `isFreeStarter: true` flag in definition.

## Achievement Unlocks

3 challengers unlock via achievements (not purchasable):
- `rook` ← `win_3_games`
- `seraph` ← `win_no_damage`  
- `malachar` ← `legendary_played`

Auto-detected in `loadChallengerSave()` by checking `localStorage aethermancer_achievements`.

## Pricing Tiers (Arcane Shards)

Common: 1,000–1,500 | Uncommon: 3,000–6,000 | Rare: 10,000–20,000 | Epic: 30,000–75,000 | Legendary: 150,000–500,000

**Why:** High costs mean long-term progression goals. At 150 shards/win, cheapest buyable = ~7 wins, most expensive = ~3,333 wins.
