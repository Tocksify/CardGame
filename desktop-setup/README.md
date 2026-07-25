# Aethermancer — Desktop Setup

Run Aethermancer as a native Windows desktop app via Electron.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 or later | https://nodejs.org |
| pnpm | any | `npm install -g pnpm` |
| Git | any | https://git-scm.com |

---

## Build the Windows installer  ← start here

From the repo root, double-click **`desktop-setup\build.bat`** or run it from a terminal:

```bat
desktop-setup\build.bat
```

What it does, in order:

| Step | Command |
|---|---|
| Install monorepo deps | `pnpm install` |
| Build the API server | `pnpm --filter @workspace/api-server run build` |
| Build the frontend | `pnpm --filter @workspace/aethermancer run build` |
| Install Electron deps | `npm install` (inside `desktop-setup/`) |
| Package installer | `npm run dist` (electron-builder → NSIS `.exe`) |

The finished installer lands in **`desktop-setup\out\`** as
`Aethermancer Setup x.x.x.exe`.

---

## Installing the game

1. Run `desktop-setup\out\Aethermancer Setup *.exe`
2. Follow the installer wizard — you can choose the install folder
3. A desktop shortcut and Start Menu entry are created automatically
4. Launch **Aethermancer** from either shortcut

No Node.js or pnpm required on the target machine — everything is bundled.

---

## How it works (production)

```
Aethermancer.exe
  └─ Electron (Chromium + Node.js)
       ├─ main.js  ──► spawns API server (port 3000)
       │                  ├─ Express /api routes
       │                  ├─ WebSocket  /api/ws
       │                  └─ Serves pre-built frontend static files
       └─ BrowserWindow → http://localhost:3000
```

Single port, no reverse-proxy needed. The API server handles HTTP, WebSocket,
and static file serving together.

---

## Running in dev mode (without building an installer)

```bash
# 1. Install all dependencies (from repo root)
pnpm install

# 2. Install Electron
cd desktop-setup
npm install

# 3. Launch
npm start
```

Dev mode starts the Vite dev server on port **3000** and the API server on
port **3001**, with `/api` proxied automatically.

---

## Troubleshooting

**`pnpm: command not found`**  
Run `npm install -g pnpm` in PowerShell (as Administrator if needed), then
reopen the terminal.

**Installer build fails at the Electron packaging step**  
Make sure you ran `pnpm install` from the **repo root** first so all workspace
dependencies are present before electron-builder tries to copy them.

**Window opens but shows a blank page**  
The server is still starting — wait a few seconds and reload (`Ctrl+R`).

**Port 3000 already in use**  
Edit the `FRONTEND_PORT` constant at the top of `main.js` and rebuild.
