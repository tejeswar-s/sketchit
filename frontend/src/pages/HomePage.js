import React, { useState } from 'react';
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

  return (
    <div className="container" style={{ maxWidth: 420, margin: '48px auto', background: '#23272b', borderRadius: 16, padding: 32, boxShadow: '0 4px 32px #0008' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>🎨 SketchIt</h1>
      <div style={{ marginBottom: 16 }}>
        <label>Nickname</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter nickname or leave blank for random"
          style={{ width: '100%', borderRadius: 6, border: '1px solid #444', padding: 8, marginTop: 4, background: '#181a1b', color: '#fff' }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Pick an avatar</label>
        <AvatarPicker selected={avatar} onSelect={setAvatar} />
      </div>
      <button onClick={handleCreate} disabled={loading || !name.trim()} className="btn btn-primary w-100 mb-3">Create Room</button>
      <div style={{ textAlign: 'center', margin: '12px 0', color: '#aaa' }}>or</div>
      <div style={{ marginBottom: 16 }}>
        <label>Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter room code to join"
          style={{ width: '100%', borderRadius: 6, border: '1px solid #444', padding: 8, marginTop: 4, background: '#181a1b', color: '#fff', textTransform: 'uppercase' }}
        />
      </div>
      <button onClick={handleJoin} disabled={loading || !name.trim() || !roomCode.trim()} className="btn btn-success w-100">Join Room</button>
    </div>
  );
} 