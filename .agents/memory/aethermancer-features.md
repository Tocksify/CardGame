---
name: Aethermancer feature batch 1
description: What was implemented in the large feature session for Aethermancer TCG
---

## Key architectural decisions

**CardType rename**: `'creature'` → `'character'` everywhere. If you see type errors referencing `creature`, search for remaining `'creature'` references.

**CardRarity**: Now `'common' | 'rare' | 'legendary' | 'secret'`. Secret is highest rarity, extremely rare in pool draws.

**GIVE_CARDS reducer side effect**: Hardcodes `phase: 'buy'` on every dispatch. Intentional — after draft pick or pool draw, always lands in buy phase. AI auto-advances from buy in their loop (800ms timeout in GameContext).

**Draft mode flow**: Draw phase → `SET_DRAFT_OPTIONS` (sets phase to 'draft') → human picks via `pickDraftCard()` → `GIVE_CARDS` (phase → 'buy'). AI auto-picks best card (highest cost) in draw phase timeout.

**Status effects**: `poisonStacks: number` (ticked down each turn, deals damage = stacks before decrement), `stunned: boolean` + `stunTurnsLeft: number`. Processed by `PROCESS_STATUS_EFFECTS` at start of each player's draw phase.

**Multiplayer death**: When `me.hp <= 0 && matchType === 'multiplayer' && phase !== 'gameover'`, show spectate/quit overlay instead of forcing out. Gameover only triggers when 1 alive player remains.

**Account / ELO**: `src/store/account.ts` — localStorage only, starts at 1000 ELO, K=50, win +40-50, loss -min 40.

**Why** GIVE_CARDS sets phase to 'buy': ensures human always gets buy phase interaction after receiving cards; AI is handled by the buy-phase setTimeout block.
