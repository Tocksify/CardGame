---
name: Aethermancer accounts system
description: Full auth + admin system — schema, routes, frontend context, session persistence, secret admin access codes.
---

## DB schema (lib/db/src/schema/)
- `users.ts` — id, username (unique, lowercase), passwordHash, isAdmin, arcaneShards, rarityBoost (0-2),
  unlockedAchievementIds (text JSON array), purchasedChallengerIds (text JSON array),
  achievementProgress (text JSON map {[id]: number}), createdAt
- `match_history.ts` — userId FK, result (win/loss), opponentName, gameMode, shardsEarned, createdAt
- `user_sessions` — created automatically by connect-pg-simple for PostgreSQL session storage

## API routes (/api prefix, artifacts/api-server/src/routes/)
- `auth.ts` — GET /auth/me, POST /auth/register, POST /auth/login, POST /auth/logout
  - USER_FIELDS includes: id, username, isAdmin, arcaneShards, rarityBoost, unlockedAchievementIds,
    purchasedChallengerIds, achievementProgress
  - POST /auth/login hardcoded response includes all USER_FIELDS (not just a subset)
- `account.ts` — GET /account (returns all fields: shards, rarityBoost, purchasedChallengerIds,
  unlockedAchievementIds, achievementProgress, matches), PATCH /account/shards,
  PATCH /account/challengers, PATCH /account/achievements, PATCH /account/achievement-progress,
  POST /account/match
- `admin.ts` — GET /admin/users?q=, PATCH /admin/users/:id (arcaneShards, rarityBoost)

## Session storage
- express-session backed by connect-pg-simple (PostgreSQL, table: user_sessions, auto-created)
- SESSION_SECRET env var, 30-day cookies, httpOnly/lax/secure-in-prod
- **Why PostgreSQL store:** MemoryStore loses all sessions on server restart (silently logs everyone out)

## Admin seed
- artifacts/api-server/src/lib/seed.ts seeds "glo" (password: Jax030209) on startup
- Admin user has isAdmin=true, rarityBoost=2, arcaneShards=9999

## Frontend contexts
- AccountContext (artifacts/aethermancer/src/context/AccountContext.tsx)
  - Account interface: id, username, isAdmin, arcaneShards, rarityBoost,
    unlockedAchievementIds, purchasedChallengerIds, achievementProgress
  - Methods: login, register, logout, refreshAccount, updateLocalShards,
    unlockAchievement, saveAchievementProgress, recordMatch
  - applyAccount() parses all JSON fields and calls syncAchievementsToLocalStorage(ids, progress)
    (server progress wins over localStorage values)
  - recordMatch() does a full fetchMe() after recording so all fields re-sync
- ChallengerContext (artifacts/aethermancer/src/context/ChallengerContext.tsx)
  - buyChallenger() awaits both PATCH /account/shards AND PATCH /account/challengers;
    rolls back shards locally if either fails
  - shards sync effect also calls saveChallengerSave() to keep localStorage current

## GameContext achievement persistence
- triggerAchievement() calls saveAchievementProgressRef.current(progressMap) after any change
  so in-progress values (e.g. 4/10 wins) survive localStorage clear

## Rarity boost system (cards.ts)
- `_rarityBoost` module variable set by AccountContext
- boost=0→normal, boost=1→{10,20,30,40}, boost=2→{5,10,25,60}

## Admin panel access (secret codes)
- Desktop: press Q three times in OPTIONS page (only works if isAdmin)
- Mobile: tap the volume slider three times quickly in OPTIONS page (only works if isAdmin)

## Match history
- GamePage.tsx records match to /api/account/match on gameover (once per game, only if logged in)

**Why:** All account data (shards, challengers, achievements, progress) now persist server-side and
survive server restarts. The PostgreSQL session store is the critical piece — without it, users
silently lose their session on every server restart.
