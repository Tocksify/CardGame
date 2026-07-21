# Aethermancer

A digital trading card game (TCG) — "A Game of Arcane Mastery" — with card-based combat, a card shop, and an achievement system.

## Run & Operate

- **Frontend**: `pnpm --filter @workspace/aethermancer run dev` — Vite dev server (reads `PORT` env var)
- **API**: `pnpm --filter @workspace/api-server run dev` — Express 5 server (reads `PORT` env var)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to Postgres (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (needed for backend DB features)

## Stack

- pnpm workspaces, Node.js 20+, TypeScript 5.9
- **Frontend**: React + Vite, Tailwind CSS, Shadcn UI, Framer Motion, Wouter (routing), TanStack Query
- **API**: Express 5, Pino logging, esbuild (CJS bundle)
- **DB**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `artifacts/aethermancer/` — React frontend (game UI, card logic, store, shop, achievements)
- `artifacts/api-server/` — Express API backend
- `artifacts/mockup-sandbox/` — component design/testing area
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/index.ts` — Drizzle database schema
- `artifacts/aethermancer/src/lib/cards.ts` — card definitions (creatures, spells, artifacts, enchantments)
- `artifacts/aethermancer/src/store/gameStore.ts` — core game state

## Architecture decisions

- Core game logic lives entirely on the frontend; the API is minimal (health check only currently).
- Orval generates typed API hooks from the OpenAPI spec — run codegen after changing `openapi.yaml`.
- esbuild bundles the API server into a single CJS file for production.

## Product

Single-player and (planned) multiplayer arcane card-battle game. Players build decks, battle AI opponents, visit the card shop, and unlock achievements.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `DATABASE_URL` must be set for DB-backed API features; the frontend runs fine without it.
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec.
- Run `pnpm --filter @workspace/db run push` to sync schema changes to the dev database.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
