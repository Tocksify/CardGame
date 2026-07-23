---
name: Aethermancer feature batch 3
description: Multiplayer rooms rework, bigger cards/text, cantPlayReason toast, TS fix, and batch 4 updates.
---

## Batch 3 (original)
- Multiplayer reworked to rooms (no matchmaking/ranked)
- Bigger card text and layout
- cantPlayReason toast with flashReason helper
- TS fix in GameContext

## Batch 4 additions (July 2026)

### Rarity weight fix
RARITY_WEIGHTS changed to `{ common: 65, rare: 28, legendary: 6, secret: 1 }`. Secret is now ~1% — very rare.

### New cards added (pool dilution)
- **Commons**: c17 Ember Scout, c18 Shield Bearer, c19 Frost Archer, c20 Mud Troll, c21 Dust Wraith, c22 Iron Drake Whelp, c23 Torch Bearer, s17 Swift Hex, s18 Stone Skin, s20 Whispering Venom
- **Rares**: r1 Storm Hawk, r2 Plague Wraith, r3 Bastion Knight, r4 Verdant Treant, h13 Emberwing, h14 Galeclaw, h15 Thornback, h16 Frostbound Drake, h17 The Warden, h20 Ash Phantom, s19 Void Rend, sH1 Mind Shatter (stun hero spell)
- **Legendaries**: l1 Arcane Colossus, l2 Death Knight, h18 Dawnbringer, h19 Blazing Titan
- **Secrets**: sec2 The Watcher (8/9 taunt stun-on-hit), sec3 The Ancient (9/12 taunt heavy_armor poison-on-hit)

### Stun Hero mechanic (Mind Shatter spell)
- `heroStunTurns?: number` added to Player in gameStore.ts
- `STUN_HERO` action sets target player's heroStunTurns = 1
- REPLENISH_AETHER checks heroStunTurns: if > 0, aether = 0, heroStunTurns decremented
- `stun_hero` spell effect in GameContext dispatches STUN_HERO on enemy + log + announce

### Artifact shop tab
- SHOP_TAB_TYPES extended with `artifacts: ['artifact']`
- 10 artifact shop items added (a1_shop through a10_shop) with type 'artifact' + cardTemplateId
- Buying type='artifact' routes through same path as type='card' (adds card to hand)
- Shop tab list: items | perks | artifacts | cards

### New artifact cards (aura effects)
- a6 Runic Barrier: `aura_def_2` — +2 DEF all chars
- a7 War Idol: `aura_atk_2` — +2 ATK all chars
- a8 Gold Shrine: `aura_gold_50` — +50g per turn (draw phase in GameContext)
- a9 Crimson Heart: `aura_heal_1` — heal 1 per turn (draw phase in GameContext)
- a10 Void Throne: `aura_atk_2_def_2` — +2/+2 all chars
- applyAuraToField extended for aura_atk_2, aura_def_2, aura_atk_2_def_2

### Relic → Artifact rename
All UI text changed: "Relic Slot" → "Artifact Slot", "Relic" → "Artifact" in equipped slot display, toasts, inventory hint, log messages.

### Artifact slot resize
- Width: 76px → 100px; inner card: w-14 → w-20; minHeight: 72 → 96
- Larger Package icon (18px empty / 14px filled), slightly larger fonts

**Why:** User explicitly asked for all of these. Kept secret at 1% because there are only 3 secret cards — drawing one should feel rare/special. Hero stun via aether-zeroing is the simplest approach that works without breaking phase flow or AI.
