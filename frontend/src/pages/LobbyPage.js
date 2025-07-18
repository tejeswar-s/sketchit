import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayerList from '../components/PlayerList';
import SettingsPanel from '../components/SettingsPanel';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import useSocketEvents from '../hooks/useSocketEvents';
import { shareRoom } from '../utils/shareUtils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, room, setRoom, gameState, setGameState } = useGame();
  const socket = useSocket();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

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
        toast.success('Settings updated!');
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleShare = async () => {
    const result = await shareRoom(room.code);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleCloseRoom = () => {
    socket.emit('room-closed', { code: room.code });
    navigate('/');
  };

  return (
    <div className="lobby-bg min-vh-100 d-flex flex-column justify-content-center align-items-center position-relative" style={{ background: 'linear-gradient(135deg, #181a1b 0%, #23272b 100%)', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', overflow: 'hidden' }}>
      <div style={{
        width: '100%',
        minHeight: 80,
        background: 'linear-gradient(90deg, #a777e3 0%, #6e44ff 100%)',
        borderRadius: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 4
      }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 SketchIt 🖌️
        </span>
      </div>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
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
                {/* For small screens, use a horizontal row for Lobby, room code, Copy, Share */}
                <div className="lobby-header-row d-flex align-items-center justify-content-center" style={{ width: '100%', gap: 8, marginBottom: 0, justifyContent: 'center' }}>
                  <h2 className="fw-bold mb-1" style={{ letterSpacing: 2, color: '#a777e3', textShadow: '0 2px 16px #6e44ff55, 0 0 8px #a777e344', marginBottom: 0, fontSize: '1.5rem', minWidth: 70, textAlign: 'center' }}>Lobby</h2>
                  <div className="room-code-box d-flex align-items-center gap-2 px-2 py-1 rounded-3" style={{ background: 'rgba(167,119,227,0.10)', border: '1.5px solid #a777e3', color: '#a777e3', fontWeight: 700, fontSize: 18, letterSpacing: 2, boxShadow: '0 2px 8px #a777e322', userSelect: 'all', minWidth: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 18 }}>{room.code}</span>
                    <button onClick={handleCopy} className="btn btn-sm btn-primary ms-1" style={{ fontWeight: 700, fontSize: 13, borderRadius: 6, padding: '2px 8px', boxShadow: '0 2px 4px #a777e322', border: 'none', background: '#6e44ff', color: '#fff', minWidth: 0 }}>{copied ? 'Copied!' : 'Copy'}</button>
                    <button onClick={handleShare} className="btn btn-sm btn-success ms-1" style={{ fontWeight: 700, fontSize: 13, borderRadius: 6, padding: '2px 8px', boxShadow: '0 2px 4px #28a74522', border: 'none', background: '#28a745', color: '#fff', minWidth: 0 }}>{shared ? 'Shared!' : 'Share'}</button>
                </div>
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
                    onKick={() => {}}
                  />
                  {isHost && (
                    <div className="button-row-center">
                      <button
                        onClick={handleStart}
                        className="button-49"
                        disabled={!canStart}
                        style={{
                          fontWeight: 800,
                          fontSize: 24, // Increased font size
                          borderRadius: 10,
                          outline: 'none',
                          cursor: canStart ? 'pointer' : 'not-allowed',
                          opacity: canStart ? 1 : 0.7,
                          position: 'relative',
                          overflow: 'hidden',
                          letterSpacing: 2,
                        }}
                      >
                        Start Game
                      </button>
                    </div>
                  )}
                </div>
                {/* Right: Settings */}
                <div className="col-lg-7 d-flex flex-column align-items-center align-items-lg-stretch">
                  <SettingsPanel settings={room.settings} onSave={handleSettingsChange} isHost={isHost} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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
          .lobby-header-row {
            flex-direction: row !important;
            gap: 8px !important;
            width: 100% !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 0 !important;
          }
          .room-code-box {
            flex-direction: row !important;
            gap: 4px !important;
            padding: 2px 4px !important;
            font-size: 13px !important;
            min-width: 0 !important;
          }
          .room-code-box button {
            font-size: 0.8rem !important;
            padding: 2px 7px !important;
            min-width: 0 !important;
            border-radius: 6px !important;
          }
          .room-code-box span[style*='font-size: 18'] {
            font-size: 13px !important;
          }
          .fw-bold, h2 {
            font-size: 1.3rem !important;
            min-width: 60px !important;
            margin-bottom: 0 !important;
            text-align: center !important;
          }
          .glass-card-dark {
            padding: 0.7rem !important;
          }
          .room-code-box {
            font-size: 13px !important;
            padding: 3px 4px !important;
            gap: 4px !important;
          }
          .room-code-box button, .btn, .button-49, .button-89 {
            font-size: 0.8rem !important;
            padding: 3px 7px !important;
            min-width: 44px !important;
            border-radius: 6px !important;
          }
          .room-code-box span[style*='font-size: 28'] {
            font-size: 18px !important;
          }
          .fw-bold, h2, h5, label, .lobby-settings-label {
            font-size: 1rem !important;
            letter-spacing: 0.5px !important;
          }
          .settings-panel {
            min-width: 160px !important;
            max-width: 98vw !important;
            padding: 0.5rem 0.4rem 0.4rem 0.4rem !important;
          }
          .settings-title {
            font-size: 1.05rem !important;
            margin-bottom: 8px !important;
          }
          .settings-row {
            margin-bottom: 5px !important;
          }
          .settings-label {
            font-size: 0.85rem !important;
            min-width: 80px !important;
          }
          .settings-input, .settings-select {
            font-size: 0.85rem !important;
            padding: 2px 4px !important;
            height: 22px !important;
            width: 38px !important;
            margin-left: 4px !important;
            border-radius: 4px !important;
          }
          .settings-slider {
            width: 50px !important;
            height: 2px !important;
          }
          .settings-btn {
            font-size: 0.85rem !important;
            padding: 3px 8px !important;
            border-radius: 6px !important;
          }
          .player-list-container {
            padding: 6px !important;
            min-width: 120px !important;
          }
          .player-list-container h4 {
            font-size: 1rem !important;
          }
          .player-list-container span {
            font-size: 0.9rem !important;
          }
          .button-row-center {
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
            align-items: stretch !important;
            margin-top: 8px !important;
          }
          .button-49, .button-89 {
            width: 100% !important;
            min-width: 0 !important;
            font-size: 1.1rem !important;
            padding: 12px 0 !important;
            border-radius: 10px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 54px !important;
            box-sizing: border-box !important;
          }
          .button-49 span, .button-89 span, .button-49, .button-89 {
            vertical-align: middle !important;
            line-height: 1.2 !important;
          }
          .player-list-container {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 320px !important;
            margin: 0 auto 8px auto !important;
            box-sizing: border-box !important;
          }
          .button-row-center {
            flex-direction: column !important;
            gap: 8px !important;
            width: 100% !important;
            align-items: stretch !important;
            margin-top: 8px !important;
            max-width: 320px !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .button-49, .button-89 {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 320px !important;
            font-size: 1.1rem !important;
            padding: 12px 0 !important;
            border-radius: 10px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 54px !important;
            box-sizing: border-box !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }
        @media (min-width: 901px) {
          .lobby-header-row {
            gap: 18px !important;
            width: 100% !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 0 !important;
          }
          .fw-bold, h2 {
            font-size: 2.3rem !important;
            min-width: 120px !important;
            margin-bottom: 0 !important;
            text-align: center !important;
            letter-spacing: 2px !important;
          }
          .room-code-box {
            font-size: 2rem !important;
            padding: 10px 22px !important;
            gap: 14px !important;
            min-width: 0 !important;
            border-width: 2.5px !important;
          }
          .room-code-box button {
            font-size: 1.2rem !important;
            padding: 7px 18px !important;
            min-width: 64px !important;
            border-radius: 10px !important;
          }
          .room-code-box span[style*='font-size: 18'] {
            font-size: 2rem !important;
          }
        }
        /* Reduce vertical gaps between SketchIt heading, Lobby, and Game Settings */
        .lobby-header-row {
          margin-top: 2px !important;
          margin-bottom: 2px !important;
        }
        hr {
          margin: 4px 0 4px 0 !important;
        }
        .settings-panel {
          margin-top: 2px !important;
        }
        @media (max-width: 400px) {
        }
      `}</style>
    </div>
  );
} 