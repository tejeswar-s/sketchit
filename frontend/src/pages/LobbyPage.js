import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayerList from '../components/PlayerList';
import SettingsPanel from '../components/SettingsPanel';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import useSocketEvents from '../hooks/useSocketEvents';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, room, setRoom, gameState, setGameState } = useGame();
  const socket = useSocket();

  useSocketEvents({
    'room:update': (updatedRoom) => setRoom(updatedRoom),
    'round-start': () => navigate(`/game/${roomCode}`),
  });

  useEffect(() => {
    if (!room) navigate('/');
  }, [room, navigate]);

  if (!room) return null;
  const isHost = room.players.find(p => p.userId === user.userId)?.isHost;

  const handleStart = () => {
    socket.emit('start-game', { code: room.code, userId: user.userId });
  };

  const handleSettingsChange = (settings) => {
    // Optionally emit settings update to backend
    setRoom({ ...room, settings });
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: '48px auto', background: '#23272b', borderRadius: 16, padding: 32, boxShadow: '0 4px 32px #0008' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 16 }}>Lobby: {room.code}</h2>
      <PlayerList
        players={room.players}
        hostId={room.players.find(p => p.isHost)?.userId}
        drawerId={gameState?.drawingPlayerId}
        myUserId={user.userId}
        onMute={() => {}}
        onKick={() => {}}
      />
      <SettingsPanel settings={room.settings} onChange={handleSettingsChange} isHost={isHost} />
      {isHost && (
        <button onClick={handleStart} className="btn btn-primary w-100 mt-3">Start Game</button>
      )}
    </div>
  );
} 