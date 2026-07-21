import React, { useState } from 'react';
import { drawFromPool, generateDeck, AI_NAMES, CardTemplate } from '../lib/cards';
import { Player, GameMode, MatchType, AiDifficulty, generateId } from '../store/gameStore';

export type Difficulty = AiDifficulty;

export interface DifficultyConfig {
  hp: number;
  aetherBonus: number;
  deckStrength: number;
  label: string;
  /** How aggressively the AI targets field characters vs hero */
  aggression: 'passive' | 'balanced' | 'aggressive';
  /** Whether AI uses spells intelligently */
  smartSpells: boolean;
}

export const DIFFICULTY_CFG: Record<Difficulty, DifficultyConfig> = {
  Novice:    { hp: 15, aetherBonus: -1, deckStrength: 0,   label: 'Very easy — for new players. AI often hesitates.', aggression: 'passive', smartSpells: false },
  Easy:      { hp: 20, aetherBonus: 0,  deckStrength: 0.5, label: 'Relaxed challenge. AI plays randomly.', aggression: 'passive', smartSpells: false },
  Normal:    { hp: 30, aetherBonus: 0,  deckStrength: 1,   label: 'Balanced — recommended.', aggression: 'balanced', smartSpells: false },
  Hard:      { hp: 40, aetherBonus: 1,  deckStrength: 1.5, label: 'Tougher AI. Attacks smartly and uses Taunt rules.', aggression: 'balanced', smartSpells: true },
  Expert:    { hp: 50, aetherBonus: 2,  deckStrength: 2,   label: 'Relentless — removes threats, attacks efficiently.', aggression: 'aggressive', smartSpells: true },
  Nightmare: { hp: 60, aetherBonus: 3,  deckStrength: 3,   label: 'Merciless. Optimal play. You will suffer.', aggression: 'aggressive', smartSpells: true },
};

interface LobbyContextType {
  roomName: string;
  setRoomName: (n: string) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  maxAether: number;
  setMaxAether: (a: number) => void;
  animatedBattlefield: boolean;
  setAnimatedBattlefield: (v: boolean) => void;
  aiPlayers: { id: number; name: string }[];
  addAi: () => void;
  removeAi: (id: number) => void;
  generatePlayers: (opts?: { gameMode?: GameMode; matchType?: MatchType; ranked?: boolean }) => Player[];
  gameMode: GameMode;
  setGameMode: (m: GameMode) => void;
  matchType: MatchType;
  setMatchType: (t: MatchType) => void;
  ranked: boolean;
  setRanked: (r: boolean) => void;
  getDifficultyConfig: (d: Difficulty) => DifficultyConfig;
}

const LobbyContext = React.createContext<LobbyContextType | undefined>(undefined);

export function LobbyProvider({ children }: { children: React.ReactNode }) {
  const [roomName, setRoomName] = useState('Aether Arena');
  const [difficulty, setDifficulty] = useState<Difficulty>('Normal');
  const [maxAether, setMaxAether] = useState(10);
  const [animatedBattlefield, setAnimatedBattlefield] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('8card');
  const [matchType, setMatchType] = useState<MatchType>('singleplayer');
  const [ranked, setRanked] = useState(false);

  const [aiPlayers, setAiPlayers] = useState([
    { id: 2, name: AI_NAMES[0] },
  ]);

  const addAi = () => {
    if (aiPlayers.length < 4) {
      const nextId = Math.max(...aiPlayers.map(a => a.id), 1) + 1;
      const name = AI_NAMES[aiPlayers.length % AI_NAMES.length];
      setAiPlayers([...aiPlayers, { id: nextId, name }]);
    }
  };

  const removeAi = (id: number) => {
    if (aiPlayers.length > 1) setAiPlayers(aiPlayers.filter(a => a.id !== id));
  };

  const generatePlayers = (opts?: { gameMode?: GameMode; matchType?: MatchType; ranked?: boolean }): Player[] => {
    const mode = opts?.gameMode ?? gameMode;
    const cfg = DIFFICULTY_CFG[difficulty];

    const makeCardInstance = (tpl: CardTemplate) => ({ ...tpl, instanceId: `card_${generateId()}` });

    // No default starting hand — cards come from the draw phase
    const makeHand = () => [];
    const makeDeck = () => generateDeck().map(makeCardInstance);

    const startingGold = 10;

    const players: Player[] = [
      {
        id: 1, name: 'YOU', isHuman: true,
        hp: 30, maxHp: 30,
        aether: 3, maxAether: 3,
        deck: makeDeck(),
        hand: makeHand(),
        field: [], artifactSlot: null, artifactSlotTurns: 0,
        pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
        gold: startingGold, inventory: [], goldPerTurn: 0,
        aetherBonus: 0, perks: [], statBuffs: [],
      },
    ];

    aiPlayers.forEach(ai => {
      const aiHp = cfg.hp;
      players.push({
        id: ai.id, name: ai.name, isHuman: false,
        hp: aiHp, maxHp: aiHp,
        aether: 3, maxAether: 3,
        deck: makeDeck(),
        hand: makeHand(),
        field: [], artifactSlot: null, artifactSlotTurns: 0,
        pendingSpells: [], cardsPlayedByType: {}, discardPile: [],
        gold: startingGold, inventory: [], goldPerTurn: 0,
        aetherBonus: Math.max(0, cfg.aetherBonus), perks: [], statBuffs: [],
      });
    });

    return players;
  };

  return (
    <LobbyContext.Provider value={{
      roomName, setRoomName,
      difficulty, setDifficulty,
      maxAether, setMaxAether,
      animatedBattlefield, setAnimatedBattlefield,
      aiPlayers, addAi, removeAi,
      generatePlayers,
      gameMode, setGameMode,
      matchType, setMatchType,
      ranked, setRanked,
      getDifficultyConfig: (d) => DIFFICULTY_CFG[d],
    }}>
      {children}
    </LobbyContext.Provider>
  );
}

export function useLobby() {
  const context = React.useContext(LobbyContext);
  if (!context) throw new Error('useLobby must be used within a LobbyProvider');
  return context;
}
