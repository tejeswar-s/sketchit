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
    <div className="container" style={{ maxWidth: 500, margin: '48px auto', background: 'linear-gradient(135deg, #23272b 60%, #3a3f5a 100%)', borderRadius: 20, padding: 36, boxShadow: '0 8px 40px #000a', textAlign: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px #0006' }}>
        <span style={{ fontSize: 40 }}>🏆</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: '#a777e3', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 SketchIt 🖌️
        </span>
      </div>
      <h2 style={{ marginTop: 48, color: '#fff', letterSpacing: 1 }}>Game Over!</h2>
      <div style={{ color: '#aaa', fontSize: 18, marginBottom: 18 }}>Final Leaderboard</div>
      <div style={{ background: '#23272b', borderRadius: 14, padding: 18, boxShadow: '0 2px 12px #0004', marginBottom: 24 }}>
        <ScoreBoard players={leaderboard || room?.players || []} showBadges />
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {isHost && <button onClick={handleReplay} className="btn btn-primary">Play Again</button>}
        <button onClick={handleHome} className="btn btn-secondary">Exit Game</button>
      </div>
    </div>
  );
} 