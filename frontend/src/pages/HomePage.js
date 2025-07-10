import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarPicker, { randomAvatarConfig } from '../components/AvatarPicker';
import { generateRandomName } from '../utils/nameGenerator';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';

export default function HomePage() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(randomAvatarConfig());
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setRoom } = useGame();
  const socket = useSocket();

  const handleCreate = () => {
    if (!socket) return;
    setLoading(true);
    const userId = Math.random().toString(36).slice(2, 10);
    const nickname = name.trim() || generateRandomName();
    setUser({ userId, name: nickname, avatar });
    socket.emit('room:create', { name: nickname, avatar, userId }, (room) => {
      setRoom(room);
      setLoading(false);
      navigate(`/lobby/${room.code}`);
    });
  };

  const handleJoin = () => {
    if (!socket || !roomCode.trim()) return;
    setLoading(true);
    const userId = Math.random().toString(36).slice(2, 10);
    const nickname = name.trim() || generateRandomName();
    setUser({ userId, name: nickname, avatar });
    socket.emit('room:join', { code: roomCode.trim().toUpperCase(), name: nickname, avatar, userId }, (room) => {
      if (room.error) {
        alert(room.error);
        setLoading(false);
      } else {
        setRoom(room);
        setLoading(false);
        navigate(`/lobby/${room.code}`);
      }
    });
  };

  // Add a ref to AvatarPicker to trigger randomization from the dice button
  const avatarPickerRef = useRef();
  const createBtnRef = useRef();
  const joinBtnRef = useRef();
  // For shine effect on mouse out
  const [shineOutCreate, setShineOutCreate] = useState(false);
  const [shineOutJoin, setShineOutJoin] = useState(false);

  useEffect(() => {
    // Dynamically import mdb-ui-kit only on client
    import('mdb-ui-kit').then(({ Ripple, initMDB }) => {
      initMDB({ Ripple });
    });
  }, []);

  // AvatarPicker randomize handler
  const handleAvatarRandom = () => {
    if (avatarPickerRef.current && avatarPickerRef.current.handleRandom) {
      avatarPickerRef.current.handleRandom();
    }
  };

  return (
    <div className="container homepage-container position-relative">
      {/* SVG background for HomePage */}
      <svg className="homepage-bg" width="100%" height="100%" viewBox="0 0 440 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="370" cy="60" rx="120" ry="40" fill="#a777e322" />
        <ellipse cx="80" cy="380" rx="110" ry="30" fill="#6e44ff22" />
        <ellipse cx="220" cy="250" rx="70" ry="18" fill="#8ec5fc11" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2, color: '#a777e3', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 SketchIt 🖌️
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: 18, position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Left: Nickname + Create Room */}
        <div style={{ width: '50%', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 140, paddingRight: 12 }}>
          <div>
            <label style={{ color: '#a777e3', fontWeight: 600 }}>Nickname</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter nickname"
              style={{ width: '100%', borderRadius: 8, border: '1.5px solid #6e44ff', padding: 10, marginTop: 4, background: '#181a1b', color: '#fff', fontSize: '1.08rem' }}
            />
          </div>
          <button
            ref={createBtnRef}
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className={`btn btn-primary w-100 mt-2 btn-rounded shine-effect${shineOutCreate ? ' out' : ''}`}
            data-mdb-ripple-init={(!loading && name.trim()) ? true : undefined}
            style={{ fontWeight: 700, fontSize: 18, borderRadius: 12, boxShadow: '0 2px 12px #a777e344, 0 0 4px #6e44ff33', letterSpacing: 1, height: 48 }}
            onMouseOut={() => setShineOutCreate(true)}
            onAnimationEnd={() => setShineOutCreate(false)}
          >
            Create Room
          </button>
        </div>
        {/* Right: Avatar with dice, moved even closer to right edge */}
        <div style={{ width: '50%', minWidth: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', position: 'relative', height: 140, marginRight: -12 }}>
          {/* Dice button farther from avatar */}
          <button
            aria-label="Randomize avatar"
            onClick={handleAvatarRandom}
            style={{
              position: 'absolute',
              top: -18,
              right: 24,
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6e44ff 0%, #a777e3 100%)',
              color: '#fff',
              border: 'none',
              fontSize: 22,
              boxShadow: '0 2px 8px #6e44ff33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'background 0.18s, color 0.18s, transform 0.12s',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'linear-gradient(90deg, #a777e3 0%, #8ec5fc 100%)';
              e.target.style.color = '#23272b';
              e.target.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'linear-gradient(135deg, #6e44ff 0%, #a777e3 100%)';
              e.target.style.color = '#fff';
              e.target.style.transform = 'scale(1)';
            }}
          >
            🎲
          </button>
          <AvatarPicker ref={avatarPickerRef} selected={avatar} onSelect={setAvatar} />
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', margin: '12px 0', color: '#a777e3', fontWeight: 600, letterSpacing: 1 }}>or</div>
        <label style={{ color: '#a777e3', fontWeight: 600 }}>Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter room code to join"
          style={{ width: '100%', borderRadius: 8, border: '1.5px solid #6e44ff', padding: 10, marginTop: 4, background: '#181a1b', color: '#fff', fontSize: '1.08rem', textTransform: 'uppercase' }}
        />
        <button
          ref={joinBtnRef}
          onClick={handleJoin}
          disabled={loading || !name.trim() || !roomCode.trim()}
          className={`btn btn-success w-100 mt-2 btn-rounded shine-effect${shineOutJoin ? ' out' : ''}`}
          data-mdb-ripple-init={(!loading && name.trim() && roomCode.trim()) ? true : undefined}
          style={{ fontWeight: 700, fontSize: 18, borderRadius: 12, boxShadow: '0 2px 12px #6e44ff44, 0 0 4px #8ec5fc33', letterSpacing: 1 }}
          onMouseOut={() => setShineOutJoin(true)}
          onAnimationEnd={() => setShineOutJoin(false)}
        >
          Join Room
        </button>
      </div>
    </div>
  );
} 