import { useEffect, useRef, useState, useCallback } from 'react';

export interface RoomPlayer {
  socketId: string;
  name: string;
  isHost: boolean;
}

export interface RoomBot {
  id: string;
  name: string;
}

export interface RoomState {
  code: string;
  gameMode: '8card' | 'draft';
  hostId: string;
  players: RoomPlayer[];
  bots: RoomBot[];
}

export interface GameStartedPayload {
  gameMode: '8card' | 'draft';
  players: { socketId: string; name: string }[];
  bots: RoomBot[];
  seed: number;
}

type Status = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';

interface UseRoomSocketOptions {
  onRoomState: (room: RoomState, yourSocketId?: string) => void;
  onGameStarted: (payload: GameStartedPayload) => void;
  onError: (message: string) => void;
}

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  // Works both with and without the /api prefix in the proxy
  return `${proto}://${window.location.host}/api/ws`;
}

export function useRoomSocket({ onRoomState, onGameStarted, onError }: UseRoomSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const callbacksRef = useRef({ onRoomState, onGameStarted, onError });
  callbacksRef.current = { onRoomState, onGameStarted, onError };

  const connect = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) { resolve(); return; }
      wsRef.current?.close();

      setStatus('connecting');
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => { setStatus('connected'); resolve(); };
      ws.onerror = () => {
        setStatus('error');
        reject(new Error('WebSocket connection failed'));
        callbacksRef.current.onError('Could not connect to server. Is the API server running?');
      };
      ws.onclose = () => setStatus('closed');

      ws.onmessage = (event) => {
        let msg: any;
        try { msg = JSON.parse(event.data); } catch { return; }

        switch (msg.type) {
          case 'ROOM_STATE':
            callbacksRef.current.onRoomState(msg.room as RoomState, msg.yourSocketId as string | undefined);
            break;
          case 'GAME_STARTED':
            callbacksRef.current.onGameStarted(msg as GameStartedPayload);
            break;
          case 'ERROR':
            callbacksRef.current.onError(msg.message ?? 'Unknown error');
            break;
        }
      };
    });
  }, []);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
  }, []);

  useEffect(() => () => { wsRef.current?.close(); }, []);

  const createRoom = useCallback(async (code: string, name: string) => {
    await connect();
    send({ type: 'CREATE_ROOM', code, name });
  }, [connect, send]);

  const joinRoom = useCallback(async (code: string, name: string) => {
    await connect();
    send({ type: 'JOIN_ROOM', code, name });
  }, [connect, send]);

  const leaveRoom = useCallback(() => {
    send({ type: 'LEAVE_ROOM' });
  }, [send]);

  const updateSettings = useCallback((gameMode: '8card' | 'draft', bots: RoomBot[]) => {
    send({ type: 'UPDATE_SETTINGS', gameMode, bots });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: 'START_GAME' });
  }, [send]);

  return { status, createRoom, joinRoom, leaveRoom, updateSettings, startGame, disconnect };
}
