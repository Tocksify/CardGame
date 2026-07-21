import React, { useState } from 'react';
import { generateDeck, AI_NAMES } from '../lib/cards';
import { Player } from '../store/gameStore';

interface LobbyContextType {
  roomName: string;
  setRoomName: (n: string) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  maxAether: number;
  setMaxAether: (a: number) => void;
  animatedBattlefield: boolean;
  setAnimatedBattlefield: (v: boolean) => void;
  aiPlayers: { id: number, name: string }[];
  addAi: () => void;
  removeAi: (id: number) => void;
  generatePlayers: () => Player[];
}

const LobbyContext = React.createContext<LobbyContextType | undefined>(undefined);

export function LobbyProvider({ children }: { children: React.ReactNode }) {
  const [roomName, setRoomName] = useState("Aether Arena");
  const [difficulty, setDifficulty] = useState("Normal");
  const [maxAether, setMaxAether] = useState(10);
  const [animatedBattlefield, setAnimatedBattlefield] = useState(false);

  const [aiPlayers, setAiPlayers] = useState([
    { id: 2, name: AI_NAMES[0] },
    { id: 3, name: AI_NAMES[1] }
  ]);

  const addAi = () => {
    if (aiPlayers.length < 4) {
      const nextId = Math.max(...aiPlayers.map(a => a.id), 1) + 1;
      const name = AI_NAMES[aiPlayers.length % AI_NAMES.length];
      setAiPlayers([...aiPlayers, { id: nextId, name }]);
    }
  };

  const removeAi = (id: number) => {
    if (aiPlayers.length > 2) {
      setAiPlayers(aiPlayers.filter(a => a.id !== id));
    }
  };

  const generatePlayers = (): Player[] => {
    let nextInstanceId = 1000;
    const makeDeck = () => generateDeck().map(t => ({ ...t, instanceId: `card_${nextInstanceId++}` }));

    const startingGold = 10;

    const players: Player[] = [
      {
        id: 1,
        name: "YOU",
        isHuman: true,
        hp: 30,
        maxHp: 30,
        aether: 3,
        maxAether: 3,
        deck: makeDeck(),
        hand: [],
        field: [],
        artifactSlot: null,
        artifactSlotTurns: 0,
        pendingSpells: [],
        cardsPlayedByType: {},
        discardPile: [],
        gold: startingGold,
        inventory: [],
        goldPerTurn: 0,
        aetherBonus: 0,
        perks: [],
        statBuffs: []
      }
    ];

    aiPlayers.forEach(ai => {
      players.push({
        id: ai.id,
        name: ai.name,
        isHuman: false,
        hp: difficulty === 'Hard' ? 40 : (difficulty === 'Easy' ? 20 : 30),
        maxHp: difficulty === 'Hard' ? 40 : (difficulty === 'Easy' ? 20 : 30),
        aether: 3,
        maxAether: 3,
        deck: makeDeck(),
        hand: [],
        field: [],
        artifactSlot: null,
        artifactSlotTurns: 0,
        pendingSpells: [],
        cardsPlayedByType: {},
        discardPile: [],
        gold: startingGold,
        inventory: [],
        goldPerTurn: 0,
        aetherBonus: difficulty === 'Hard' ? 1 : 0,
        perks: [],
        statBuffs: []
      });
    });

    // Draw starting hands
    players.forEach(p => {
      p.hand = p.deck.slice(0, 5);
      p.deck = p.deck.slice(5);
    });

    return players;
  };

  return (
    <LobbyContext.Provider value={{
      roomName, setRoomName, difficulty, setDifficulty,
      maxAether, setMaxAether, animatedBattlefield, setAnimatedBattlefield,
      aiPlayers, addAi, removeAi, generatePlayers
    }}>
      {children}
    </LobbyContext.Provider>
  );
}

export function useLobby() {
  const context = React.useContext(LobbyContext);
  if (context === undefined) {
    throw new Error('useLobby must be used within a LobbyProvider');
  }
  return context;
}
