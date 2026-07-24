# Aethermancer

A card game of arcane mastery — single-player vs AI, multiplayer rooms, character drafting, and ability-driven combat.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind + shadcn/ui (`artifacts/aethermancer`) |
| Backend | Express 5 + WebSockets (`artifacts/api-server`) |
| Database | PostgreSQL via Drizzle ORM (`lib/db`) |
| Shared libs | `lib/api-spec`, `lib/api-zod`, `lib/api-client-react` |
| Package mgr | pnpm workspace |

## How to run

Dependencies are managed by pnpm at the workspace root. After cloning / pulling:

```bash
pnpm install
```

Three workflows are configured and start automatically:

- **artifacts/aethermancer: web** — Vite dev server for the game UI (preview path `/`)
- **artifacts/api-server: API Server** — Express + WebSocket API (preview path `/api`)
- **artifacts/mockup-sandbox: Component Preview Server** — Canvas component sandbox (preview path `/__mockup`)

## Environment

- `DATABASE_URL` — PostgreSQL connection string (provisioned by Replit)
- `SESSION_SECRET` — Express session secret (set in Replit Secrets)
- `PORT` — Assigned per artifact by Replit; each service reads this automatically

## Database

Schema is defined in `lib/db/src/schema/`. To push schema changes to the database:

```bash
pnpm --filter @workspace/db exec drizzle-kit push
```

## User preferences

<!-- Agent: record user preferences here -->
