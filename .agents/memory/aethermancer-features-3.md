---
name: Aethermancer feature batch 3
description: Multiplayer rooms, bigger cards, cantPlayReason toasts, TS fix in GameContext, status effects UI, elemental combos, challenger sprites
---

## Multiplayer (rooms)
- Rooms-based (no matchmaking or ranked); host creates, guest joins by code.
- ELO only applies on ranked game-over.

## Card / UI sizing
- Cards made bigger; font sizes increased across ArenaCardUI.

## Toast — cantPlayReason
- When a card cannot be played, the reason is shown as a toast announcement.

## TypeScript fix — GameContext
- GameContext.tsx had a type mismatch that was fixed.

## Status effect badges (session 4)
- ArenaCardUI renders a compact badge strip below the description area showing:
  poison ☠️ (with stack count), burn 🔥 (stack count), stun ⚡ (turns left),
  silence 🔇 (turns left), armor 🛡️ (tempArmorTurns). Only rendered when any effect is active.
- FieldCard type gained: `burnStacks: number`, `silenced: boolean`, `silenceTurnsLeft: number`.
- PROCESS_STATUS_EFFECTS reducer ticks and clears both burn and silence.

## Elemental combo system (session 4)
- When a 2nd card of the same artTheme joins a player's field, APPLY_ELEMENTAL_COMBO fires:
  boosts all same-theme field cards by theme-specific ATK/DEF (fire→+1ATK, storm→+2ATK, etc.).
- Human playCard() detects this in GameContext.tsx after the PLAY_CARD dispatch.
- Combo banner (colored strip with label e.g. "🔥 FLAME PACT") appears in PlayerZone
  by computing theme counts inline from player.field.

## Burn and silence as real state (session 4)
- APPLY_BURN: adds stacks to target card's burnStacks.
- APPLY_SILENCE: sets silenced + silenceTurnsLeft; applied by shadow_silence keyword & silence_target spell effect.
- flame_aura keyword applies 1 burn stack on hit (respects silenced status).
- Silenced cards: their keywords are ignored in applyStatusOnHit (isSilenced guard).

## Player stun indicator (session 4)
- When playerStunTurns > 0: hex portrait shows "CAGED" overlay.
- When heroStunTurns > 0: shows "DAZED" overlay.

## Challenger sprites + redesigned select screen (session 4)
- ChallengerSprite.tsx: 19 inline SVG portraits (kael, lyra, theron, mira, aldric, sessa, vorn,
  rook, draela, nyx, ferrus, seraph, auren, zeth, vael, malachar, solaris, void_herald, prime).
  Props: challengerId, mode ('face' | 'full'), className.
- ChallengerCard: replaced emoji + buy button with sprite face + name/title only. Locked = grayscale/dimmed.
- ChallengerModal: shows full sprite (mode="full") in a bordered frame above name/description/buy button.
