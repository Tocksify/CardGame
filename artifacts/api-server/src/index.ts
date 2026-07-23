import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import { logger } from './lib/logger';
import { handleWsConnection } from './ws-handler';
import { cleanStaleRooms } from './rooms';

const rawPort = process.env['PORT'];

if (!rawPort) {
  throw new Error('PORT environment variable is required but was not provided.');
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade requests
httpServer.on('upgrade', (req, socket, head) => {
  // Strip any base-path prefix — the Replit proxy may strip /api already
  const url = req.url ?? '';
  if (url === '/ws' || url === '/api/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', handleWsConnection(wss));

// Clean up stale rooms every 30 minutes
setInterval(cleanStaleRooms, 30 * 60 * 1000);

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, 'Error listening on port');
    process.exit(1);
  }
  logger.info({ port }, 'Server listening');
});
