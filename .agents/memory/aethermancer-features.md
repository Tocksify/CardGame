---
name: Aethermancer feature batch 1 & 2
description: All major game features added — cards, AI, sounds, art, no-starting-hand draw model
---

## Draw model
- Neither 8-card nor draft mode gives a starting hand — `makeHand()` always returns `[]`
- 8-card mode draws 2 cards per turn from `drawFromPool()`
- Draft mode auto-generates 3 options; human picks 1, AI picks highest-cost

## Difficulty system
- `AiDifficulty` type lives in `gameStore.ts`; `difficulty` field on `GameState`
- `DIFFICULTY_CFG` record lives in `LobbyContext.tsx` and is exported
- `START_GAME` payload must include `difficulty`
- AI aggression/targeting and card selection logic all branch on `state.difficulty`

## Element sounds
- `ELEMENT_SOUNDS` map in `sounds.ts` maps artTheme string → SoundName
- All sounds are procedural Web Audio API — no files needed
- Element sound plays 120ms after the character deploy sound in `GameContext.playCard()`

## Card art
- `CardArt.tsx` has named `CharacterSilhouette` variants for all new heroes and new characters
- Theme lookup is by `templateId` first, then `artTheme` fallback, then `THEMES.aether` default
- CSS keyframes `cardArtPulse`, `cardArtRotate`, `cardArtShimmer` must exist in `index.css`

## Status keyword system
- `poison_on_hit`, `stun_on_hit`, `electric`, `heal_on_kill` keywords on character cards
- Stat buffs `frost_mantle` (all attacks apply stun) and `bloodrite` (kill heals hero 1) live in `player.statBuffs[]`
- `plague_standard` stat buff also applies poison on hit

## Key IDs
- New characters: c12–c16, h13–h20
- New spells: s13–s16
- New items: i13–i18
- New perks: `perk_deploy_bonus`, `perk_undying`
