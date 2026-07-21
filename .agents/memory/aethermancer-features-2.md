---
name: Aethermancer feature batch 2
description: AI fix, 8-card hand, pre-draft screen, bonus gold, kill gold steal, ELO gameover
---

## AI Stuck Fix
The AI main-phase useEffect only fired on phase/player changes. When AI played a card,
neither changed → AI froze after one card. Fix: replaced single-shot timeout with a
recursive `runAiMainLoop` function that self-reschedules every 800 ms until `chooseAiCard`
returns null, then dispatches ADVANCE_PHASE.

**Why:** The dependency array `[gameState.phase, gameState.currentPlayerIndex]` never
changed between AI card plays within the same phase.

**How to apply:** Any future AI loop in main phase must use the ref-based recursive pattern,
NOT the useEffect dependency pattern.

## 8 Card Starting Hand
- `LobbyContext.generatePlayers` now returns `drawFromPool(8).map(makeCardInstance)` for `8card` mode.
- `MatchmakingPage` already did this correctly; confirmed it stays the same.
- The 2-per-turn draw in GameContext continues as before (additive).

## Pre-Draft Screen (`/pre-draft`)
New page `PreDraftPage.tsx`. Flow: START_GAME (empty hands) → `/pre-draft` → pick 3 from
full CARD_TEMPLATES grid → dispatch `GIVE_STARTING_CARDS` per player → `/game`.
- Human picks 3; AI players get `generateDraftOptions()` (3 random).
- New reducer action `GIVE_STARTING_CARDS` adds cards to hand without changing phase
  (unlike `GIVE_CARDS` which transitions to 'buy').
- LobbyPage routes to `/pre-draft` for draft mode; `/game` for 8card.
- MatchmakingPage does the same.

## Bonus Gold from Damage
- `Player` now has optional `damageDealtThisTurn?: number` and `bonusGoldPending?: number`.
- ATTACK reducer increments `damageDealtThisTurn` for the attacker by `attackerAtk`.
- END_TURN reducer converts `damageDealtThisTurn * 20` → `bonusGoldPending`, resets counter.
- GameContext draw phase: if `bonusGoldPending > 0`, dispatches ADD_GOLD + RESET_BONUS_GOLD.

**Why:** Reward aggressive play; gold bonus is for the NEXT turn (carry-over via bonusGoldPending).

## Kill Gold Steal (40%)
New reducer action `STEAL_GOLD { fromPlayerId, toPlayerId, amount }`.
Dispatched BEFORE the ATTACK that would kill, so gold is transferred before HP reaches 0.
- Human attackWith: detects `targetOwner.hp - effectiveDmg <= 0 && !undyingBlock`.
- AI combat loop: same check for hero targets.

## ELO on Gameover
Added to gameover useEffect in GameContext.tsx. Uses `eloAppliedRef` (resets on 'countdown')
to apply exactly once per game. Calls `applyEloChange(acc, humanWon, avgEnemyElo)` only when
`gameState.ranked && gameState.matchType === 'multiplayer'`.

## MatchmakingPage START_GAME
Required adding `difficulty: 'Normal'` to the START_GAME payload (multiplayer doesn't have
a difficulty selector, defaults to Normal).
