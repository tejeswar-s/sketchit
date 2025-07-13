import React, { useEffect, useState } from 'react';
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
  const [showSettingsSaved, setShowSettingsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useSocketEvents({
    'room:update': (updatedRoom) => setRoom(updatedRoom),
    'round-start': () => navigate(`/game/${roomCode}`),
  });

  useEffect(() => {
    if (!room) navigate('/');
  }, [room, navigate]);

  if (!room) return null;
  const isHost = room.players.find(p => p.userId === user.userId)?.isHost;
  const readyCount = room.players.filter(p => p.isReady).length;
  const canStart = isHost && room.players.length >= 2;

  const handleStart = () => {
    socket.emit('start-game', { code: room.code, userId: user.userId });
  };

  const handleSettingsChange = (settings) => {
    socket.emit('room:updateSettings', { code: room.code, settings }, (updatedRoom) => {
      if (updatedRoom) {
        setRoom(updatedRoom);
        setShowSettingsSaved(true);
        setTimeout(() => setShowSettingsSaved(false), 2000);
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="lobby-bg min-vh-100 d-flex flex-column justify-content-center align-items-center position-relative" style={{ background: 'linear-gradient(135deg, #181a1b 0%, #23272b 100%)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: '#a777e3', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 SketchIt 🖌️
        </span>
      </div>
      <div className="container py-5" style={{ position: 'relative', zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="glass-card-dark p-4 p-md-5 shadow-lg rounded-4 animate__animated animate__fadeInDown position-relative" style={{ overflow: 'hidden' }}>
              {/* SVG background only inside card */}
              <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}>
                <ellipse cx="1200" cy="100" rx="340" ry="120" fill="#a777e322" />
                <ellipse cx="300" cy="800" rx="320" ry="100" fill="#6e44ff22" />
                <ellipse cx="900" cy="600" rx="200" ry="60" fill="#8ec5fc11" />
              </svg>
              {/* Room code box */}
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-4 gap-3" style={{ position: 'relative', zIndex: 1 }}>
                <div className="text-center text-md-start">
                  <h2 className="fw-bold mb-1" style={{ letterSpacing: 2, color: '#a777e3', textShadow: '0 2px 16px #6e44ff55, 0 0 8px #a777e344' }}>Lobby</h2>
                  <div className="small text-muted mb-2" style={{ color: '#b0b3b8' }}>Share this code with friends to join!</div>
                </div>
                <div className="room-code-box d-flex align-items-center justify-content-center gap-2 px-4 py-2 rounded-3" style={{ background: 'rgba(167,119,227,0.10)', border: '1.5px solid #a777e3', color: '#a777e3', fontWeight: 700, fontSize: 28, letterSpacing: 2, boxShadow: '0 2px 8px #a777e322', userSelect: 'all' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 28 }}>{room.code}</span>
                  <button onClick={handleCopy} className="btn btn-sm btn-primary ms-2" style={{ fontWeight: 700, fontSize: 18, borderRadius: 8, padding: '4px 14px', boxShadow: '0 2px 4px #a777e322', border: 'none', background: '#6e44ff', color: '#fff' }}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </div>
              <hr style={{ borderColor: '#a777e344', margin: '24px 0 18px 0', position: 'relative', zIndex: 1 }} />
              <div className="row g-4 flex-lg-row flex-column-reverse" style={{ position: 'relative', zIndex: 1 }}>
                {/* Left: Player List */}
                <div className="col-lg-5 d-flex flex-column align-items-center align-items-lg-start">
                  <h5 className="fw-bold mb-3" style={{ color: '#a777e3', letterSpacing: 1 }}>Players</h5>
                  <PlayerList
                    players={room.players}
                    hostId={room.players.find(p => p.isHost)?.userId}
                    drawerId={gameState?.drawingPlayerId}
                    myUserId={user.userId}
                    onMute={() => {}}
                    onKick={() => {}}
                  />
                  {isHost && (
                    <button
                      onClick={handleStart}
                      className="modern-lobby-btn w-100 mt-4 animate__animated animate__pulse animate__infinite"
                      disabled={!canStart}
                      style={{
                        fontWeight: 800,
                        fontSize: 26,
                        borderRadius: 20,
                        padding: '22px 0',
                        background: canStart ? 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)' : 'linear-gradient(90deg, #444 0%, #23272b 100%)',
                        border: 'none',
                        color: canStart ? '#fff' : '#bbb',
                        letterSpacing: 2,
                        boxShadow: canStart ? '0 4px 24px #7f53ac44, 0 0 8px #647dee33' : 'none',
                        transition: 'background 0.3s, color 0.3s, transform 0.18s, box-shadow 0.3s',
                        marginTop: 18,
                        textShadow: canStart ? '0 2px 8px #23272b44' : 'none',
                        outline: 'none',
                        cursor: canStart ? 'pointer' : 'not-allowed',
                        opacity: canStart ? 1 : 0.7,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={e => { if (canStart) { e.target.style.background = 'linear-gradient(90deg, #a777e3 0%, #8ec5fc 100%)'; e.target.style.color = '#23272b'; e.target.style.transform = 'scale(1.06)'; e.target.style.boxShadow = '0 4px 32px #a777e388, 0 0 12px #8ec5fc55'; } }}
                      onMouseLeave={e => { if (canStart) { e.target.style.background = 'linear-gradient(90deg, #7f53ac 0%, #647dee 100%)'; e.target.style.color = '#fff'; e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 4px 24px #7f53ac44, 0 0 8px #647dee33'; } }}
                    >
                      <span style={{ fontSize: 28, marginRight: 10 }}>🚀</span> Start Game
                    </button>
                  )}
                  {isHost && room.players.length < 2 && (
                    <div style={{
                      background: 'rgba(255,77,79,0.13)',
                      color: '#ff4d4f',
                      marginTop: 14,
                      fontWeight: 700,
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 17,
                      boxShadow: '0 2px 12px #ff4d4f22',
                      border: '1.5px solid #ff4d4f55',
                      letterSpacing: 1,
                      maxWidth: 320,
                      width: '100%',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 22, marginRight: 6 }}>⚠️</span>
                      At least 2 players are required to start the game.
                    </div>
                  )}
                </div>
                {/* Right: Settings */}
                <div className="col-lg-7 d-flex flex-column align-items-center align-items-lg-stretch">
                  <h5 className="fw-bold mb-3" style={{ color: '#a777e3', letterSpacing: 1 }}>Game Settings</h5>
                  <SettingsPanel settings={room.settings} onSave={handleSettingsChange} isHost={isHost} />
                  {showSettingsSaved && (
                    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'rgba(34,39,43,0.97)', color: '#a777e3', padding: '16px 32px', borderRadius: 14, boxShadow: '0 2px 12px #a777e344, 0 0 4px #6e44ff33', zIndex: 9999, fontWeight: 600, fontSize: 18, letterSpacing: 1, backdropFilter: 'blur(8px) saturate(120%)', border: '1.5px solid #23272b', textShadow: '0 0 8px #a777e344' }}>
                      <span style={{ color: '#a777e3', fontWeight: 700 }}>✔</span> Settings updated
                    </div>
                  )}
                </div>
              </div>
            </div>
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
        .modern-lobby-btn-dark:active {
          transform: scale(0.97);
          box-shadow: 0 2px 16px #a777e388, 0 0 8px #8ec5fc55;
        }
        .modern-lobby-btn-dark {
          filter: drop-shadow(0 0 4px #a777e344);
        }
        .room-code-box button:active {
          transform: scale(0.97);
        }
        @media (max-width: 900px) {
          .room-code-box { font-size: 22px !important; padding: 8px 12px !important; }
        }
        @media (max-width: 600px) {
          .glass-card-dark { padding: 1.5rem !important; }
          .room-code-box { font-size: 18px !important; padding: 6px 8px !important; }
        }
      `}</style>
    </div>
  );
} 