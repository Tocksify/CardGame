---
name: Aethermancer combat stats
description: Rule for keeping end-of-game card performance metrics accurate.
---

Card performance metrics must be recorded at the reducer boundary from the actual damage applied after armor, resistance, and survival effects. UI or action-intent estimates will drift from the outcome shown to the player.

**Why:** Combat can modify incoming damage through card armor, player resistance, undying effects, and area targeting. Recording only the requested attack amount makes the end-of-game ledger misleading.

**How to apply:** When adding a new damage source, include its source player and card instance in the damage action, then update the source card's stats from the reducer's computed dealt amount.