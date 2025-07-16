import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import ScoreBoard from '../components/ScoreBoard';

export default function LeaderboardPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { leaderboard, room, user, setUser, setRoom, setGameState, setLeaderboard } = useGame();
  const socket = useSocket();

  useEffect(() => {
    if (!user || !room) {
      navigate('/', { replace: true });
    }
  }, [user, room, navigate]);

  const isHost = room?.players?.find(p => p.isHost)?.userId === user?.userId;

  const handleReplay = () => {
    if (!isHost) return;
    socket.emit('replay', { code: room.code });
    setLeaderboard([]);
    setGameState(null);
    navigate(`/lobby/${roomCode}`);
  };

  const handleHome = () => {
    socket.emit('exit-game', { code: room.code, userId: user.userId });
    setUser(null);
    setRoom(null);
    setGameState(null);
    setLeaderboard([]);
    navigate('/');
  };

  useEffect(() => {
    if (!socket) return;
    const handler = () => navigate('/');
    socket.on('room-closed', handler);
    return () => { socket.off('room-closed', handler); };
  }, [socket, navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleReplay = () => {
      setLeaderboard([]);
      setGameState(null);
      navigate(`/lobby/${roomCode}`);
    };
    socket.on('room:replay', handleReplay);
    return () => { socket.off('room:replay', handleReplay); };
  }, [socket, navigate, roomCode, setLeaderboard, setGameState]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        backgroundImage: 'url("/hex-tech-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }} />

      <div
        className="container"
        style={{
          maxWidth: 500,
          margin: '40px auto',
          background: 'linear-gradient(135deg, #23272b 60%, #3a3f5a 100%)',
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 8px 40px #000a',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{
          position: 'absolute',
          top: -32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px #0006',
        }}>
          <span style={{ fontSize: 36 }}>🏆</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 6,
          marginTop: 4,
        }}>
          <span style={{
            fontSize: '7vw',
            fontWeight: 700,
            letterSpacing: 1.5,
            color: '#a777e3',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            🎨 SketchIt 🖌️
          </span>
        </div>

        <h2 style={{
          marginTop: 40,
          color: '#fff',
          letterSpacing: 0.8,
          fontSize: '5.2vw',
        }}>Game Over!</h2>

        <div style={{
          color: '#aaa',
          fontSize: '3.6vw',
          marginBottom: 16,
        }}>Final Leaderboard</div>

        <div style={{
          background: '#23272b',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 12px #0004',
          marginBottom: 20,
        }}>
          <ScoreBoard players={leaderboard || room?.players || []} showBadges />
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'center',
          marginTop: 20,
        }}>
          <button
            className="btn btn-primary"
            style={{ minWidth: 100, fontSize: '3.6vw' }}
            onClick={() => {
              if (!isHost) return;
              socket.emit('replay', { code: room.code });
            }}
          >
            Play Again
          </button>
          <button
            className="btn btn-danger"
            style={{ minWidth: 100, fontSize: '3.6vw' }}
            onClick={() => {
              if (user.isHost) {
                socket.emit('room-closed', { code: roomCode });
                navigate('/');
              } else {
                socket.emit('exit-game', { code: roomCode, userId: user.userId }, () => {
                  navigate('/');
                });
              }
            }}
          >
            Exit Game
          </button>
        </div>
      </div>

      <style>
        {`
          @media (max-width: 400px) {
            .container {
              margin: 20px 8px !important;
              padding: 20px !important;
              border-radius: 14px !important;
            }
          }
        `}
      </style>
    </>
  );
}
