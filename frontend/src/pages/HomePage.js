import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  // Responsive SVG dimensions
  const [svgSize, setSvgSize] = useState(() => ({
    width: window.innerWidth + 200,
    height: window.innerHeight + 200
  }));
  useEffect(() => {
    const handleResize = () => {
      setSvgSize({
        width: window.innerWidth + 200,
        height: window.innerHeight + 200
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const svgNetwork = useMemo(() => {
    const nodeCount = 500;
    const minCenterRadius = 120;
    const width = svgSize.width;
    const height = svgSize.height;
    const centerX = width / 2, centerY = height / 2;
    const outerRadius = Math.sqrt(width * width + height * height) / 2;
    const nodes = [];
    nodes.push({ x: 0, y: 0 });
    nodes.push({ x: width, y: 0 });
    nodes.push({ x: 0, y: height });
    nodes.push({ x: width, y: height });
    const edgeSteps = 20;
    for (let i = 1; i < edgeSteps; i++) {
      const t = i / edgeSteps;
      nodes.push({ x: t * width, y: 0 });
      nodes.push({ x: t * width, y: height });
      nodes.push({ x: 0, y: t * height });
      nodes.push({ x: width, y: t * height });
    }
    let attempts = 0;
    const needed = nodeCount - nodes.length;
    const maxAttempts = needed * 40;
    while (nodes.length < nodeCount && attempts < maxAttempts) {
      attempts++;
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.sqrt(Math.random()) * outerRadius * (0.98 + 0.04 * Math.random());
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (x < 0 || x > width || y < 0 || y > height) continue;
      const dx = x - centerX, dy = y - centerY;
      if (dx * dx + dy * dy > minCenterRadius * minCenterRadius * (0.3 + Math.random() * 1.5)) {
        nodes.push({ x, y });
      }
    }
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      let connections = 0;
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const n1 = nodes[i], n2 = nodes[j];
        const dx = n1.x - n2.x, dy = n1.y - n2.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 180000 && Math.random() < 0.13 && connections < 8) {
          lines.push(
            <line key={`l-${i}-${j}`} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
              stroke={i % 2 === 0 ? '#a777e3' : '#6e44ff'} strokeWidth={0.7 + Math.random() * 1.3} opacity={0.32 + Math.random() * 0.38}/>
          );
          connections++;
        }
      }
    }
    const nodeShapes = nodes.map((n, idx) => {
      if (idx % 3 === 0) {
        const r = 7 + Math.random() * 10;
        const points = Array.from({ length: 6 }, (_, i) => {
          const a = Math.PI / 3 * i;
          return `${n.x + Math.cos(a) * r},${n.y + Math.sin(a) * r}`;
        }).join(' ');
        return <polygon key={`h-${idx}`} points={points} stroke={idx % 2 === 0 ? '#a777e3' : '#6e44ff'} strokeWidth={1 + Math.random() * 1.2} fill="none" opacity={0.6}/>;
      } else {
        return <circle key={`c-${idx}`} cx={n.x} cy={n.y} r={4 + Math.random() * 8} stroke={idx % 2 === 0 ? '#a777e3' : '#6e44ff'} strokeWidth={0.8 + Math.random() * 1.2} fill="none" opacity={0.6}/>;
      }
    });
    return [lines, nodeShapes];
  }, [svgSize]);

  return (
    <>
      <div className="homepage-bg-art" style={{
        position: 'absolute',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 0,
        backgroundImage: 'url("hex-tech-bg.avif")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(120deg, rgba(166,119,227,0.32) 0%, rgba(110,68,255,0.28) 100%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      </div>
      <div className="container homepage-container position-relative">
        {/* SVG background for HomePage */}
        {/* Removed SVG background image */}
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
    </>
  );
} 