export interface RoomPlayer {
  socketId: string;
  name: string;
  isHost: boolean;
}

export interface RoomBot {
  id: string;
  name: string;
}

export interface Room {
  code: string;
  players: RoomPlayer[];
  bots: RoomBot[];
  gameMode: '8card' | 'draft';
  hostId: string;
  createdAt: number;
}

const rooms = new Map<string, Room>();

const DEFAULT_BOTS: RoomBot[] = [{ id: 'bot_1', name: 'Void Herald' }];

export function createRoom(code: string, hostSocketId: string, hostName: string): Room {
  const room: Room = {
    code,
    players: [{ socketId: hostSocketId, name: hostName, isHost: true }],
    bots: [...DEFAULT_BOTS],
    gameMode: '8card',
    hostId: hostSocketId,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, socketId: string, name: string): Room | { error: string } {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found. Check the code and try again.' };
  if (room.players.length >= 4) return { error: 'Room is full (max 4 players).' };
  // Already in room — return room state
  if (room.players.find(p => p.socketId === socketId)) return room;
  room.players.push({ socketId, name, isHost: false });
  return room;
}

export function leaveRoom(socketId: string): { room: Room | null; code: string } {
  for (const [code, room] of rooms) {
    const idx = room.players.findIndex(p => p.socketId === socketId);
    if (idx === -1) continue;
    room.players.splice(idx, 1);
    if (room.players.length === 0) {
      rooms.delete(code);
      return { room: null, code };
    }
    // Transfer host if needed
    if (room.hostId === socketId) {
      room.hostId = room.players[0].socketId;
      room.players[0].isHost = true;
    }
    return { room, code };
  }
  return { room: null, code: '' };
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code);
}

export function getRoomBySocket(socketId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.socketId === socketId)) return room;
  }
  return null;
}

export function updateRoomSettings(
  code: string,
  hostSocketId: string,
  gameMode: '8card' | 'draft',
  bots: RoomBot[],
): Room | null {
  const room = rooms.get(code);
  if (!room || room.hostId !== hostSocketId) return null;
  room.gameMode = gameMode;
  room.bots = bots;
  return room;
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

// Clean up stale rooms older than 2 hours
export function cleanStaleRooms(): void {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}
