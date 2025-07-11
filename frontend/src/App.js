import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import { UIProvider } from './contexts/UIContext';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GameRoomPage from './pages/GameRoomPage';
import LeaderboardPage from './pages/LeaderboardPage';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <UIProvider>
          <Router>
            <div className="app-dark-bg" style={{ height: '100vh', overflowY: 'auto', background: '#181a1b', color: '#fff' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/lobby/:roomCode" element={<LobbyPage />} />
                <Route path="/game/:roomCode" element={<GameRoomPage />} />
                <Route path="/leaderboard/:roomCode" element={<LeaderboardPage />} />
              </Routes>
            </div>
          </Router>
        </UIProvider>
      </GameProvider>
    </SocketProvider>
  );
}

export default App; 