# Aethermancer — Desktop Setup

Run Aethermancer as a native desktop app via Electron.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 or later | https://nodejs.org |
| pnpm | any | `npm install -g pnpm` |
| Git | any | https://git-scm.com |

---

## First-time setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd <repo-folder>

# 2. Install all monorepo dependencies (do this from the repo root)
pnpm install

# 3. Install desktop-specific dependencies (Electron)
cd desktop-setup
npm install
```

---

## Running the app

From the `desktop-setup` folder:

```bash
npm start
```

This will:
1. Start the Express + WebSocket API server on port **3001**
2. Start the Vite dev server on port **3000** (proxies `/api` → the API server)
3. Open the game in an Electron window once both are ready

Allow up to ~20 seconds for the first cold start while Vite compiles.

---

## Building a distributable (optional)

To package Aethermancer into a standalone installer for your platform:

```bash
# First, build the frontend
cd ..   # go back to repo root
pnpm --filter @workspace/aethermancer run build

# Then package with electron-builder
cd desktop-setup
npm run dist
```

Output will be in `desktop-setup/out/`.

| Platform | Output |
|---|---|
| Windows | `.exe` installer (NSIS) |
| macOS | `.dmg` |
| Linux | `.AppImage` |

---

## Ports used

| Service | Port |
|---|---|
| Vite (frontend) | 3000 |
| Express API + WebSockets | 3001 |

If either port is already in use on your machine, edit the `FRONTEND_PORT` /
`API_PORT` constants at the top of `main.js`.

---

## Troubleshooting

**"pnpm: command not found" on Windows**  
Run `npm install -g pnpm` in PowerShell (as Administrator if needed), then
restart your terminal.

**Electron window stays blank / shows "site can't be reached"**  
The services are still starting. Wait a few seconds — the window will refresh
automatically once Vite is ready. If it stays blank, check the terminal for
errors from the API or Vite process.

**Port already in use**  
Change `FRONTEND_PORT` or `API_PORT` at the top of `main.js`, then restart.
