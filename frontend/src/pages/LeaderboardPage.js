import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import ScoreBoard from '../components/ScoreBoard';

export default function LeaderboardPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { leaderboard, room, user, setUser, setRoom, setGameState, setLeaderboard } = useGame();
  const socket = useSocket();

  const isHost = room?.players?.find(p => p.isHost)?.userId === user?.userId;

  const handleReplay = () => {
    if (!isHost) return;
    socket.emit('replay', { code: room.code });
    setLeaderboard([]);
    setGameState(null);
    navigate(`/game/${roomCode}`);
  };

  const handleHome = () => {
    socket.emit('exit-game', { code: room.code, userId: user.userId });
    setUser(null);
    setRoom(null);
    setGameState(null);
    setLeaderboard([]);
    navigate('/');
  };

  return (
    <div className="container" style={{ maxWidth: 500, margin: '48px auto', background: '#23272b', borderRadius: 16, padding: 32, boxShadow: '0 4px 32px #0008', textAlign: 'center' }}>
      <h2>🏆 Game Over!</h2>
      <ScoreBoard players={leaderboard || room?.players || []} showBadges />
      <div style={{ marginTop: 24 }}>
        {isHost && <button onClick={handleReplay} className="btn btn-primary me-3">Play Again</button>}
        <button onClick={handleHome} className="btn btn-secondary">Exit Game</button>
      </div>
    </div>
  );
} 