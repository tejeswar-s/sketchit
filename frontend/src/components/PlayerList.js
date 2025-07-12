import React from 'react';

export default function PlayerList({ players, hostId, drawerId, myUserId, onMute, onKick, speakingUserIds = [] }) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div style={{ background: '#222', borderRadius: 8, padding: 12, color: '#fff', minWidth: 200 }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Players</h4>
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
              {p.isMicOn === true ? (
                <span style={{ color: '#1aff7c', fontSize: 18, marginRight: 2 }} title="Mic on">🎤</span>
              ) : (
                <span style={{ color: '#888', fontSize: 18, marginRight: 2 }} title="Mic off">🎤<span style={{ color: '#ff4d4f', fontSize: 14, marginLeft: -10, position: 'relative', top: 2 }}>/</span></span>
              )}
              {p.avatar && p.avatar.emoji ? <span style={{ fontSize: 20 }}>{p.avatar.emoji}</span> : null}
              {p.name}
            </span>
            <span style={{ marginLeft: 8, color: '#ffd700', fontWeight: 'bold', minWidth: 40, textAlign: 'right' }}>{p.score} pts</span>
            {p.userId === hostId && <span title="Host" style={{ marginLeft: 6, color: '#ff0' }}>★</span>}
            {myUserId === hostId && p.userId !== myUserId && (
              <>
                <button onClick={() => onMute(p.userId)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#fa0', cursor: 'pointer' }}>🔇</button>
                <button onClick={() => onKick(p.userId)} style={{ marginLeft: 2, background: 'none', border: 'none', color: '#f44', cursor: 'pointer' }}>⛔</button>
              </>
            )}
          </div>
        ))}
      </ul>
    </div>
  );
} 