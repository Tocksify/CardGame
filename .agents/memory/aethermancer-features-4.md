---
name: Aethermancer ability system
description: 3-ability system per character card — Basic/Stronger/Ultimate with turn-based cooldowns, ability bar UI, AI usage, defender rule enforcement.
---

## What was built

Every character card on the field now has 3 themed abilities (Basic / Stronger / Ultimate).

### Data model
- `getCardAbilities(card)` in `lib/cards.ts` — looks up `ABILITY_THEMES[card.artTheme]` for names, returns `[CardAbility, CardAbility, CardAbility]` with `atkDelta` 0/+2/+4 and `cooldown` 1/2/4.
- `FieldCard.abilityCooldowns: [number, number, number]` — remaining cooldown per ability (0 = ready). Initialized to `[0, 0, 0]` in `PLAY_CARD` reducer.
- `TICK_COOLDOWNS { playerId }` — decrements all field card cooldowns for the player. Dispatched in the draw phase immediately after `PROCESS_STATUS_EFFECTS`.
- `USE_ABILITY { attackerPlayerId, attackerInstanceId, abilityIndex, targetPlayerId, targetInstanceId? }` — taps card, sets cooldown, applies damage (field card or hero). Enforces defender rule: direct hero damage blocked if target has field cards.

### GameState changes
- `targetingMode` extended with `'ability'`
- `abilityIndex?: number` field on `GameState` (set/cleared with `SET_TARGETING` / `CLEAR_TARGETING`)

### UI (GamePage.tsx)
- `ArenaCardUI` — 18 px ability bar at top of card (character field cards only), 3 columns showing damage and cooldown/✓. Amber highlight + pointer cursor when ready. `onAbilityClick?(abilityIndex)` prop.
- `PlayerZone` — threads `onAbilityClick?(cardInstanceId, abilityIndex)` down to `ArenaCardUI` for the human player's own cards (only during combat phase, untapped, unstunned, on my turn).
- Clicking an ability button → `SET_TARGETING` with mode `'ability'` + `abilityIndex` → player clicks enemy card/hero → `useAbility()` dispatched.
- `handleFieldClick` / `handleHeroClick` handle `'ability'` mode: field targets for enemy cards, hero only when enemy field is empty.
- `targetingLabel` includes `'ability': 'Select a target for your ability'`.

### AI
- In `runAiCombatLoop`, after picking an attacker and target, checks for ready abilities. Hard+ always uses best ability; Medium/Easy 50% chance.
- Picks highest `atkDelta` ready ability; dispatches `USE_ABILITY`; records kill bonus if target destroyed.

**Why:** Ability damage uses `currentAtk + tempAtkBonus + atkDelta` (same as normal attacks) so armor/resistance stay correctly reflected.
