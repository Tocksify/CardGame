/**
 * Aethermancer — Electron main process
 *
 * Starts the Express API server and the Vite dev server as child processes,
 * waits for both to be ready, then opens the game in a BrowserWindow.
 */

const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const FRONTEND_PORT = 3000;
const API_PORT = 3001;
const STARTUP_TIMEOUT_MS = 60_000; // 60 s — Vite cold-start can be slow

// Root of the monorepo (one level up from desktop-setup/)
const REPO_ROOT = path.join(__dirname, '..');

// A random SESSION_SECRET is fine for local-only desktop use
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');

let apiProcess = null;
let frontendProcess = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(...args) {
  console.log('[aethermancer-desktop]', ...args);
}

/** Poll localhost:<port> until it responds or we time out. */
function waitForPort(port) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + STARTUP_TIMEOUT_MS;

    const check = () => {
      const req = http.get(`http://localhost:${port}`, () => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Service on port ${port} did not start within ${STARTUP_TIMEOUT_MS / 1000}s`));
        } else {
          setTimeout(check, 600);
        }
      });
      req.setTimeout(500, () => req.destroy());
    };

    check();
  });
}

/** Spawn a pnpm script and inherit stdio so logs appear in the terminal. */
function spawnService(label, args, env) {
  log(`Starting ${label}…`);
  const isWindows = process.platform === 'win32';
  const proc = spawn(isWindows ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: REPO_ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: isWindows,
  });
  proc.on('error', (err) => log(`${label} spawn error:`, err.message));
  proc.on('exit', (code) => log(`${label} exited with code ${code}`));
  return proc;
}

// ── Service startup ───────────────────────────────────────────────────────────

async function startServices() {
  // 1. API server (Express + WebSockets)
  apiProcess = spawnService('API server', [
    '--filter', '@workspace/api-server', 'run', 'dev',
  ], {
    PORT: String(API_PORT),
    NODE_ENV: 'development',
    SESSION_SECRET,
  });

  // 2. Vite dev server using the desktop-specific config (adds /api proxy)
  const desktopConfig = path.join(__dirname, 'vite.desktop.config.ts');
  frontendProcess = spawnService('Vite frontend', [
    '--filter', '@workspace/aethermancer', 'exec',
    'vite', '--config', desktopConfig, '--host', '0.0.0.0',
  ], {
    PORT: String(FRONTEND_PORT),
    BASE_PATH: '/',
    NODE_ENV: 'development',
  });

  log(`Waiting for services (frontend :${FRONTEND_PORT}, api :${API_PORT})…`);
  await Promise.all([
    waitForPort(FRONTEND_PORT),
    waitForPort(API_PORT),
  ]);
  log('Both services ready.');
}

// ── Electron window ───────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Aethermancer',
    backgroundColor: '#0d0d0d',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://localhost:${FRONTEND_PORT}`);

  // Open DevTools in development — remove this line for a packaged release
  // win.webContents.openDevTools();
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  try {
    await startServices();
    createWindow();
  } catch (err) {
    log('ERROR — could not start services:', err.message);
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
  log('Shutting down services…');
  apiProcess?.kill();
  frontendProcess?.kill();
});
