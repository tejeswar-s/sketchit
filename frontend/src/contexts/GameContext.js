import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [user, setUser] = useState(null); // { userId, name, avatar }
  const [room, setRoom] = useState(null); // room object from backend
  const [gameState, setGameState] = useState(null); // gameState from backend
  const [leaderboard, setLeaderboard] = useState([]);

  return (
    <GameContext.Provider value={{ user, setUser, room, setRoom, gameState, setGameState, leaderboard, setLeaderboard }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
} 