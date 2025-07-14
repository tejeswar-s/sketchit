import React from 'react';

export default function PlayerList({ players, hostId, drawerId, myUserId, onMute, onKick, onToggleMic, speakingUserIds = [], globalMuted = false, isHostUser = false, micStatus = {} }) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div style={{ background: '#222', borderRadius: 8, padding: 12, color: '#fff', minWidth: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>Players</h4>
        {isHostUser && (
          <button
            onClick={() => onMute('all')}
            style={{
              background: globalMuted ? '#ff4d4f' : '#1aff7c',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '4px 16px',
              fontWeight: 700,
              fontSize: 15,
              marginLeft: 8,
              cursor: 'pointer',
              boxShadow: globalMuted ? '0 0 8px #ff4d4f88' : '0 0 8px #1aff7c88',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            title={globalMuted ? 'Unmute all' : 'Mute all'}
          >
            {globalMuted ? 'Unmute All' : 'Mute All'}
          </button>
        )}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((p, i) => (
          <div
            key={p.userId}
            style={{
              display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 8, marginBottom: 6,
              background: p.userId === myUserId ? '#23272b' : 'transparent',
              boxShadow: speakingUserIds.includes(p.userId) ? '0 0 8px 2px #1aff7c99' : 'none',
              border: speakingUserIds.includes(p.userId) ? '2px solid #1aff7c' : '2px solid transparent',
              transition: 'box-shadow 0.2s, border 0.2s',
            }}
          >
            {/* Avatar Display */}
            <span style={{ 
              fontSize: 24, 
              marginRight: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              border: p.userId === drawerId ? '2.5px solid #1aff7c' : '2px solid #007bff' // Green for drawer, blue for others
            }}>
              {p.avatar && p.avatar.emoji ? p.avatar.emoji : '👤'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onToggleMic && onToggleMic(p.userId)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isHostUser || p.userId === myUserId ? 'pointer' : 'not-allowed',
                  outline: 'none',
                  marginRight: 2,
                  fontSize: 20,
                  color: micStatus[p.userId] ? '#1aff7c' : '#888',
                  position: 'relative',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={micStatus[p.userId] ? 'Mic on' : 'Mic off'}
                disabled={!(isHostUser || p.userId === myUserId)}
              >
                {micStatus[p.userId] ? '🎤' : '🎙️'}
              </button>
              {p.name}
              {p.pending && (
                <span style={{
                  background: 'linear-gradient(90deg, #a777e3 60%, #6e44ff 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 12,
                  borderRadius: 8,
                  padding: '2px 8px',
                  marginLeft: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 1px 6px #6e44ff33',
                  letterSpacing: 0.5,
                }}>
                  Waiting...
                </span>
              )}
              {/* Ready badge */}
              {p.isReady && (
                <span style={{
                  background: 'linear-gradient(90deg, #1aff7c 60%, #43e97b 100%)',
                  color: '#222',
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 8,
                  padding: '2px 10px',
                  marginLeft: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 1px 6px #1aff7c33',
                  letterSpacing: 1,
                }}>
                  <span style={{ fontSize: 15, marginRight: 2 }}>✔</span> Ready
                </span>
              )}
            </span>
            <span style={{ marginLeft: 8, color: '#ffd700', fontWeight: 'bold', minWidth: 40, textAlign: 'right' }}>{p.score} pts</span>
            {p.userId === hostId && <span title="Host" style={{ marginLeft: 6, color: '#ff0' }}>★</span>}
            {isHostUser && p.userId !== myUserId && (
              <button onClick={() => onKick(p.userId)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#f44', cursor: 'pointer' }}>⛔</button>
            )}
          </div>
        ))}
      </ul>
    </div>
  );
} 