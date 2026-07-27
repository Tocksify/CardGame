---
name: Aethermancer accounts system
description: Full auth + admin system added — schema, routes, frontend context, secret admin access codes.
---

## What was built

### DB schema (lib/db/src/schema/)
- `users.ts` — id, username (unique, lowercase), passwordHash, isAdmin, arcaneShards, rarityBoost (0-2), createdAt
- `match_history.ts` — userId FK, result (win/loss), opponentName, gameMode, shardsEarned, createdAt

### API routes (/api prefix, artifacts/api-server/src/routes/)
- `auth.ts` — GET /auth/me, POST /auth/register, POST /auth/login, POST /auth/logout
- `account.ts` — GET /account, PATCH /account/shards, POST /account/match
- `admin.ts` — GET /admin/users?q=, PATCH /admin/users/:id (arcaneShards, rarityBoost)

### Session
- express-session with SESSION_SECRET env var, 30-day cookies, httpOnly/lax
- Session type augmented in artifacts/api-server/src/types.d.ts

### Admin seed
- artifacts/api-server/src/lib/seed.ts seeds "glo" (password: Jax030209) on startup
- Admin user has isAdmin=true, rarityBoost=2, arcaneShards=9999

### Frontend context
- artifacts/aethermancer/src/context/AccountContext.tsx
  - Provides: account, login, register, logout, refreshAccount, updateLocalShards, recordMatch
  - Calls setRarityBoost(account.rarityBoost) from cards.ts whenever account changes

### Rarity boost system (cards.ts)
- Base rates increased: common:25, rare:30, legendary:30, secret:15 (was 35/35/25/5)
- `_rarityBoost` module variable set by AccountContext
- getRarityWeights(): boost=0→normal, boost=1→{10,20,30,40}, boost=2→{5,10,25,60}
- generateShopRotation() uses boost: more curse/card/artifact slots at higher boost

### Admin panel access (secret codes)
- Desktop: press Q three times in OPTIONS page (only works if isAdmin)
- Mobile: tap the volume slider three times quickly in OPTIONS page (only works if isAdmin)
- Admin panel route: /admin (AdminPanelPage.tsx)

### Pages added
- /login — LoginPage.tsx (login + register toggle)
- /admin — AdminPanelPage.tsx (search users, set shards, set rarityBoost)

### Match history
- GamePage.tsx records match to /api/account/match on gameover (once per game, only if logged in)
- Stores: result, opponentName (all enemies joined), gameMode, shardsEarned (150 win, 0 loss)

### Multiplayer username
- MultiplayerRoomsPage.tsx uses account.username if logged in, skips the name-pick screen

**Why:**
- All account-linked data (shards, match history, rarity boost) now persist server-side
- The module-level boost in cards.ts avoids threading context through every draw call site
