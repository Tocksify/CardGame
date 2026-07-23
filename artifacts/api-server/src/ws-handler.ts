import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './lib/logger';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  getRoomByCode,
  updateRoomSettings,
  deleteRoom,
  Room,
  RoomBot,
} from './rooms';

interface WsClient extends WebSocket {
  socketId: string;
}

// C→S message types
type ClientMsg =
  | { type: 'CREATE_ROOM'; code: string; name: string }
  | { type: 'JOIN_ROOM'; code: string; name: string }
  | { type: 'LEAVE_ROOM' }
  | { type: 'UPDATE_SETTINGS'; gameMode: '8card' | 'draft'; bots: RoomBot[] }
  | { type: 'START_GAME' }
  | { type: 'PLAYER_DRAFT_DONE' };

function send(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function roomToMsg(room: Room) {
  return {
    code: room.code,
    gameMode: room.gameMode,
    hostId: room.hostId,
    players: room.players.map(p => ({ socketId: p.socketId, name: p.name, isHost: p.isHost })),
    bots: room.bots,
  };
}

function broadcast(wss: WebSocketServer, room: Room, msg: object) {
  for (const client of wss.clients) {
    const c = client as WsClient;
    if (room.players.find(p => p.socketId === c.socketId)) {
      send(c, msg);
    }
  }
}

let idCounter = 0;
function nextId() {
  return `ws_${++idCounter}_${Date.now()}`;
}

function checkDraftComplete(wss: WebSocketServer, room: Room) {
  if (room.players.length === 0) {
    deleteRoom(room.code);
    return;
  }
  const allDone = room.players.every(p => room.draftReadyPlayers.has(p.socketId));
  if (allDone) {
    if (room.draftTimerHandle) clearTimeout(room.draftTimerHandle);
    broadcast(wss, room, { type: 'ALL_DRAFT_DONE' });
    deleteRoom(room.code);
  }
}

export function handleWsConnection(wss: WebSocketServer) {
  return (ws: WebSocket) => {
    const client = ws as WsClient;
    client.socketId = nextId();

    logger.info({ socketId: client.socketId }, 'WS connected');

    ws.on('message', (raw) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'ERROR', message: 'Invalid message format.' });
        return;
      }

      switch (msg.type) {
        case 'CREATE_ROOM': {
          const code = msg.code.trim().toUpperCase();
          if (code.length !== 6) {
            send(ws, { type: 'ERROR', message: 'Invalid room code.' });
            return;
          }
          // Leave any existing room first
          const existing = getRoomBySocket(client.socketId);
          if (existing) {
            const { room: updated } = leaveRoom(client.socketId);
            if (updated) broadcast(wss, updated, { type: 'ROOM_STATE', room: roomToMsg(updated) });
          }
          const room = createRoom(code, client.socketId, msg.name);
          logger.info({ code, name: msg.name }, 'Room created');
          send(ws, { type: 'ROOM_STATE', room: roomToMsg(room), yourSocketId: client.socketId });
          break;
        }

        case 'JOIN_ROOM': {
          const code = msg.code.trim().toUpperCase();
          // Leave any existing room first
          const existing = getRoomBySocket(client.socketId);
          if (existing) {
            const { room: updated } = leaveRoom(client.socketId);
            if (updated) broadcast(wss, updated, { type: 'ROOM_STATE', room: roomToMsg(updated) });
          }
          const result = joinRoom(code, client.socketId, msg.name);
          if ('error' in result) {
            send(ws, { type: 'ERROR', message: result.error });
            return;
          }
          logger.info({ code, name: msg.name }, 'Player joined room');
          // Send state to joiner first (includes their socketId)
          send(ws, { type: 'ROOM_STATE', room: roomToMsg(result), yourSocketId: client.socketId });
          // Then broadcast updated state to everyone else in the room
          broadcast(wss, result, { type: 'ROOM_STATE', room: roomToMsg(result) });
          break;
        }

        case 'LEAVE_ROOM': {
          const { room, code } = leaveRoom(client.socketId);
          logger.info({ code }, 'Player left room');
          if (room) {
            broadcast(wss, room, { type: 'ROOM_STATE', room: roomToMsg(room) });
          }
          break;
        }

        case 'UPDATE_SETTINGS': {
          const room = getRoomBySocket(client.socketId);
          if (!room || room.hostId !== client.socketId) return;
          const updated = updateRoomSettings(room.code, client.socketId, msg.gameMode, msg.bots);
          if (updated) {
            broadcast(wss, updated, { type: 'ROOM_STATE', room: roomToMsg(updated) });
          }
          break;
        }

        case 'START_GAME': {
          const room = getRoomBySocket(client.socketId);
          if (!room || room.hostId !== client.socketId) {
            send(ws, { type: 'ERROR', message: 'Only the host can start the game.' });
            return;
          }
          logger.info({ code: room.code }, 'Game started');
          const seed = Math.floor(Math.random() * 1_000_000);
          const startMsg = {
            type: 'GAME_STARTED',
            gameMode: room.gameMode,
            players: room.players.map(p => ({ socketId: p.socketId, name: p.name })),
            bots: room.bots,
            seed,
          };
          broadcast(wss, room, startMsg);

          if (room.gameMode === 'draft') {
            // Keep room alive for draft coordination; start a 20-second server timer
            room.draftReadyPlayers = new Set();
            const roomCode = room.code;
            room.draftTimerHandle = setTimeout(() => {
              const r = getRoomByCode(roomCode);
              if (r) {
                logger.info({ code: roomCode }, 'Draft timer expired — sending ALL_DRAFT_DONE');
                broadcast(wss, r, { type: 'ALL_DRAFT_DONE' });
                deleteRoom(roomCode);
              }
            }, 20_000);
          } else {
            deleteRoom(room.code);
          }
          break;
        }

        case 'PLAYER_DRAFT_DONE': {
          const room = getRoomBySocket(client.socketId);
          if (!room) return;
          room.draftReadyPlayers.add(client.socketId);
          logger.info({ socketId: client.socketId, ready: room.draftReadyPlayers.size, total: room.players.length }, 'Player draft done');
          checkDraftComplete(wss, room);
          break;
        }

        default:
          send(ws, { type: 'ERROR', message: 'Unknown message type.' });
      }
    });

    ws.on('close', () => {
      logger.info({ socketId: client.socketId }, 'WS disconnected');
      const { room } = leaveRoom(client.socketId);
      if (room) {
        // If the room is in draft phase, re-check whether everyone remaining is done
        if (room.draftReadyPlayers.size > 0) {
          checkDraftComplete(wss, room);
        } else {
          broadcast(wss, room, { type: 'ROOM_STATE', room: roomToMsg(room) });
        }
      }
    });

    ws.on('error', (err) => {
      logger.error({ err, socketId: client.socketId }, 'WS error');
    });
  };
}
