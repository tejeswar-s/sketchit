import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import { generateName } from '../utils/nameGenerator';

export default function JoinPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, setUser, setRoom } = useGame();
  const socket = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomExists, setRoomExists] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check if room exists
        const checkRoom = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        
        const response = await fetch(`${backendUrl}/api/rooms/${roomCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const room = await response.json();
          setRoomExists(true);
          setRoomInfo(room);
        } else {
          setError('Room not found');
        }
      } catch (err) {
        if (retryCount < 2) {
          setRetryCount(retryCount + 1);
          setTimeout(() => checkRoom(), 1000);
        } else {
          setError(`Failed to check room: ${err.message}`);
        }
      }
    };

      if (roomCode) {
        checkRoom();
      }
    }, [roomCode, retryCount]);

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const avatar = Math.floor(Math.random() * 8) + 1;
      // Use Socket.IO for joining
      socket.emit('room:join', {
        code: roomCode,
        name: playerName.trim(),
        avatar,
        userId
      }, (room) => {
        if (room && room.error) {
          setError(room.error);
        } else if (room) {
          setUser({ userId, name: playerName.trim(), avatar });
          setRoom(room);
          setError('');
          navigate(`/lobby/${roomCode}`);
        } else {
          setError('Failed to join room');
        }
        setIsLoading(false);
      });
    } catch (err) {
      setError('Failed to join room');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleJoin();
    }
  };

  if (!roomExists && !error) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #181a1b 0%, #23272b 100%)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-light">Checking room...</p>
        </div>
      </div>
    );
  }

  if (error && !roomExists) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #181a1b 0%, #23272b 100%)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
        <div className="glass-card-dark p-4 p-md-5 shadow-lg rounded-4 text-center" style={{ maxWidth: 500, width: '90%' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
          <h2 className="fw-bold mb-3" style={{ color: '#ff4d4f' }}>Room Not Found</h2>
          <p className="text-muted mb-4">The room you're looking for doesn't exist or has been deleted.</p>
          <div className="d-flex gap-2 justify-content-center">
            <button 
              onClick={() => {
                setError('');
                setRetryCount(0);
                setRoomExists(false);
              }}
              className="btn btn-secondary px-4 py-2"
              style={{ 
                background: 'linear-gradient(90deg, #6c757d 0%, #495057 100%)',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600
              }}
            >
              🔄 Retry
            </button>
            <button 
              onClick={() => navigate('/')}
              className="btn btn-primary px-4 py-2"
              style={{ 
                background: 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'linear-gradient(135deg, #181a1b 0%, #23272b 100%)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: '#a777e3', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 SketchIt 🖌️
        </span>
      </div>
      
      <div className="glass-card-dark p-4 p-md-5 shadow-lg rounded-4" style={{ maxWidth: 500, width: '90%' }}>
        {/* SVG background */}
        <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
          <ellipse cx="1200" cy="100" rx="340" ry="120" fill="#a777e322" />
          <ellipse cx="300" cy="800" rx="320" ry="100" fill="#6e44ff22" />
          <ellipse cx="900" cy="600" rx="200" ry="60" fill="#8ec5fc11" />
        </svg>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="fw-bold text-center mb-4" style={{ color: '#a777e3', letterSpacing: 2 }}>Join Room</h2>
          
          {roomInfo && (
            <div className="text-center mb-4">
              <p className="text-muted mb-2">Joining room:</p>
              <div className="room-code-box d-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-3 mb-3" style={{ background: 'rgba(167,119,227,0.10)', border: '1.5px solid #a777e3', color: '#a777e3', fontWeight: 700, fontSize: 24, letterSpacing: 2, boxShadow: '0 2px 8px #a777e322' }}>
                <span style={{ fontFamily: 'monospace' }}>{roomCode}</span>
              </div>
              <p className="text-muted small">
                {roomInfo.players.length} player{roomInfo.players.length !== 1 ? 's' : ''} in room
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="playerName" className="form-label fw-bold" style={{ color: '#a777e3' }}>
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              className="form-control"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              style={{
                background: 'rgba(34,39,43,0.8)',
                border: '1.5px solid #a777e344',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 16,
                fontWeight: 500
              }}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="alert alert-danger mb-3" style={{ 
              background: 'rgba(255,77,79,0.13)', 
              border: '1.5px solid #ff4d4f55',
              color: '#ff4d4f',
              borderRadius: 12
            }}>
              {error}
            </div>
          )}
          
          <button
            onClick={handleJoin}
            disabled={isLoading || !playerName.trim()}
            className="btn w-100 py-3 fw-bold"
            style={{
              background: isLoading || !playerName.trim() 
                ? 'linear-gradient(90deg, #444 0%, #23272b 100%)' 
                : 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)',
              border: 'none',
              borderRadius: 12,
              color: isLoading || !playerName.trim() ? '#bbb' : '#fff',
              fontSize: 18,
              letterSpacing: 1,
              boxShadow: isLoading || !playerName.trim() ? 'none' : '0 4px 24px #7f53ac44',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </button>
          
          <div className="text-center mt-3">
            <button
              onClick={() => navigate('/')}
              className="btn btn-link text-muted"
              style={{ textDecoration: 'none' }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .glass-card-dark {
          background: rgba(34,39,43,0.92);
          backdrop-filter: blur(18px) saturate(140%);
          border: 1.5px solid #23272b;
          box-shadow: 0 8px 40px #181a1b88, 0 0 24px #a777e322;
        }
        .form-control:focus {
          background: rgba(34,39,43,0.9) !important;
          border-color: #a777e3 !important;
          box-shadow: 0 0 0 0.2rem rgba(167,119,227,0.25) !important;
          color: #fff !important;
        }
        .form-control::placeholder {
          color: #6c757d !important;
        }
      `}</style>
    </div>
  );
} 