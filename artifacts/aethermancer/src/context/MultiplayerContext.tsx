import React, { createContext, useContext, useRef, useCallback, useState } from 'react';

// ── Shared types ─────────────────────────────────────────────────────────────
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

// ── Context shape ─────────────────────────────────────────────────────────────
interface MultiplayerContextType {
  status: Status;
  roomState: RoomState | null;
  yourSocketId: string;
  serverError: string;
  /** Seconds remaining for draft wait (null = not waiting) */
  draftSecondsLeft: number | null;

  setServerError: (msg: string) => void;
  /** Optimistically update room state (e.g. host bot changes) */
  setRoomState: React.Dispatch<React.SetStateAction<RoomState | null>>;

  createRoom: (code: string, name: string) => Promise<void>;
  joinRoom: (code: string, name: string) => Promise<void>;
  leaveRoom: () => void;
  updateSettings: (gameMode: '8card' | 'draft', bots: RoomBot[]) => void;
  startGame: () => void;
  /** Sent by each real player when they finish the 3-card draft pick */
  signalDraftDone: () => void;
  /** Disconnect WS (call after navigating away from multiplayer entirely) */
  disconnect: () => void;

  /** Register the GAME_STARTED callback (MultiplayerRoomsPage) */
  setOnGameStarted: (cb: ((payload: GameStartedPayload) => void) | null) => void;
  /** Register the ALL_DRAFT_DONE callback (PreDraftPage) */
  setOnAllDraftDone: (cb: (() => void) | null) => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

function getWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/api/ws`;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function MultiplayerProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [yourSocketId, setYourSocketId] = useState('');
  const [serverError, setServerError] = useState('');
  const [draftSecondsLeft, setDraftSecondsLeft] = useState<number | null>(null);

  const onGameStartedRef = useRef<((payload: GameStartedPayload) => void) | null>(null);
  const onAllDraftDoneRef = useRef<(() => void) | null>(null);
  const draftCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearDraftCountdown = () => {
    if (draftCountdownRef.current) {
      clearInterval(draftCountdownRef.current);
      draftCountdownRef.current = null;
    }
    setDraftSecondsLeft(null);
  };

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

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
        setServerError('Could not connect to server. Is the API server running?');
      };
      ws.onclose = () => setStatus('closed');

      ws.onmessage = (event) => {
        let msg: any;
        try { msg = JSON.parse(event.data); } catch { return; }

        switch (msg.type) {
          case 'ROOM_STATE': {
            const next = msg.room as RoomState;
            setRoomState(prev =>
              JSON.stringify(prev) === JSON.stringify(next) ? prev : next
            );
            if (msg.yourSocketId) setYourSocketId(msg.yourSocketId as string);
            setServerError('');
            break;
          }
          case 'GAME_STARTED':
            onGameStartedRef.current?.(msg as GameStartedPayload);
            break;
          case 'ALL_DRAFT_DONE':
            clearDraftCountdown();
            onAllDraftDoneRef.current?.();
            break;
          case 'ERROR':
            setServerError((msg as any).message ?? 'Unknown error');
            break;
        }
      };
    });
  }, []);

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
    clearDraftCountdown();
    setRoomState(null);
    setYourSocketId('');
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
  }, [send]);

  const disconnect = useCallback(() => {
    clearDraftCountdown();
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
  }, []);

  const updateSettings = useCallback((gameMode: '8card' | 'draft', bots: RoomBot[]) => {
    send({ type: 'UPDATE_SETTINGS', gameMode, bots });
  }, [send]);

  const startGame = useCallback(() => {
    send({ type: 'START_GAME' });
  }, [send]);

  const signalDraftDone = useCallback(() => {
    send({ type: 'PLAYER_DRAFT_DONE' });
    // Start a local 20-second visual countdown
    clearDraftCountdown();
    setDraftSecondsLeft(20);
    let s = 20;
    draftCountdownRef.current = setInterval(() => {
      s -= 1;
      if (s <= 0) {
        clearInterval(draftCountdownRef.current!);
        draftCountdownRef.current = null;
        setDraftSecondsLeft(null);
      } else {
        setDraftSecondsLeft(s);
      }
    }, 1000);
  }, [send]);

  const setOnGameStarted = useCallback((cb: ((payload: GameStartedPayload) => void) | null) => {
    onGameStartedRef.current = cb;
  }, []);

  const setOnAllDraftDone = useCallback((cb: (() => void) | null) => {
    onAllDraftDoneRef.current = cb;
  }, []);

  return (
    <MultiplayerContext.Provider value={{
      status, roomState, yourSocketId, serverError, draftSecondsLeft,
      setServerError, setRoomState,
      createRoom, joinRoom, leaveRoom, updateSettings, startGame,
      signalDraftDone, disconnect,
      setOnGameStarted, setOnAllDraftDone,
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const ctx = useContext(MultiplayerContext);
  if (!ctx) throw new Error('useMultiplayer must be used within MultiplayerProvider');
  return ctx;
}
