/**
 * Aethermancer — Electron main process
 *
 * Development  (npm start / not packaged):
 *   • Spawns the API server via pnpm on port 3001
 *   • Spawns Vite dev server (with /api proxy) on port 3000
 *   • Opens http://localhost:3000
 *
 * Production  (packaged .exe):
 *   • Spawns the pre-built API server via utilityProcess.fork() on port 3000
 *     with SERVE_STATIC_DIR set → Express serves static files + /api + WS
 *   • One port, no proxy needed, WebSocket URL resolves naturally
 */

const { app, BrowserWindow, utilityProcess } = require('electron');
const { spawn }  = require('child_process');
const path       = require('path');
const http       = require('http');
const crypto     = require('crypto');

const FRONTEND_PORT = 3000;
const API_PORT_DEV  = 3001;          // only used in dev (separate from Vite)
const STARTUP_TIMEOUT_MS = 90_000;   // 90 s — allow for slow cold starts
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');

const isDev = !app.isPackaged;
const REPO_ROOT = path.join(__dirname, '..');

// Child-process handles so we can clean them up on quit
let devApiProcess  = null;
let devViteProcess = null;
let prodUtility    = null;

// ── Logging ──────────────────────────────────────────────────────────────────
function log(...args) { console.log('[aethermancer]', ...args); }

// ── Port polling ──────────────────────────────────────────────────────────────
function waitForPort(port) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    const check = () => {
      const req = http.get(`http://localhost:${port}`, () => resolve());
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Port ${port} not ready within ${STARTUP_TIMEOUT_MS / 1000}s`));
        } else {
          setTimeout(check, 700);
        }
      });
      req.setTimeout(500, () => req.destroy());
    };
    check();
  });
}

// ── Dev-mode helpers ──────────────────────────────────────────────────────────
function spawnPnpm(label, args, env) {
  log(`Starting ${label}…`);
  const isWin = process.platform === 'win32';
  const proc = spawn(isWin ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: isWin,
  });
  proc.on('error', (err) => log(`${label} error:`, err.message));
  proc.on('exit',  (code) => log(`${label} exited (${code})`));
  return proc;
}

// ── Service startup ───────────────────────────────────────────────────────────
async function startServices() {
  if (isDev) {
    // ── Development: Vite dev server + separate API server ─────────────────
    devApiProcess = spawnPnpm('API server (dev)', [
      '--filter', '@workspace/api-server', 'run', 'dev',
    ], {
      PORT: String(API_PORT_DEV),
      NODE_ENV: 'development',
      SESSION_SECRET,
    });

    const desktopConfig = path.join(__dirname, 'vite.desktop.config.ts');
    devViteProcess = spawnPnpm('Vite (dev)', [
      '--filter', '@workspace/aethermancer', 'exec',
      'vite', '--config', desktopConfig, '--host', '0.0.0.0',
    ], {
      PORT: String(FRONTEND_PORT),
      BASE_PATH: '/',
      NODE_ENV: 'development',
    });

    log(`Waiting for Vite :${FRONTEND_PORT} and API :${API_PORT_DEV}…`);
    await Promise.all([
      waitForPort(FRONTEND_PORT),
      waitForPort(API_PORT_DEV),
    ]);
  } else {
    // ── Production: single port via utilityProcess ──────────────────────────
    const apiEntry   = path.join(process.resourcesPath, 'api-server', 'index.mjs');
    const staticDir  = path.join(process.resourcesPath, 'frontend');

    log('Spawning production API server…');
    prodUtility = utilityProcess.fork(apiEntry, [], {
      env: {
        PORT: String(FRONTEND_PORT),
        NODE_ENV: 'production',
        SESSION_SECRET,
        SERVE_STATIC_DIR: staticDir,
      },
      // Route pino logs to a file next to the exe so they're inspectable
      stdio: 'pipe',
    });

    prodUtility.on('exit', (code) => log(`API server exited (${code})`));

    log(`Waiting for server :${FRONTEND_PORT}…`);
    await waitForPort(FRONTEND_PORT);
  }

  log('Ready — opening window.');
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Aethermancer',
    backgroundColor: '#0d0d0d',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://localhost:${FRONTEND_PORT}`);
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startServices();
    createWindow();
  } catch (err) {
    log('FATAL — services failed to start:', err.message);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  log('Shutting down…');
  devApiProcess?.kill();
  devViteProcess?.kill();
  prodUtility?.kill();
});
