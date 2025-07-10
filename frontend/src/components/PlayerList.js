import React from 'react';

export default function PlayerList({ players, hostId, drawerId, myUserId, onMute, onKick }) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div style={{ background: '#222', borderRadius: 8, padding: 12, color: '#fff', minWidth: 200 }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Players</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((p, i) => (
          <li key={p.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: p.userId === myUserId ? 'bold' : 'normal', background: p.userId === myUserId ? '#1a2a3a' : 'none', borderRadius: 6, padding: '2px 4px' }}>
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
            <span style={{ color: p.userId === drawerId ? '#0af' : '#fff', flex: 1 }}>{p.name}</span>
            <span style={{ marginLeft: 8, color: '#ffd700', fontWeight: 'bold', minWidth: 40, textAlign: 'right' }}>{p.score} pts</span>
            {p.userId === hostId && <span title="Host" style={{ marginLeft: 6, color: '#ff0' }}>★</span>}
            {myUserId === hostId && p.userId !== myUserId && (
              <>
                <button onClick={() => onMute(p.userId)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#fa0', cursor: 'pointer' }}>🔇</button>
                <button onClick={() => onKick(p.userId)} style={{ marginLeft: 2, background: 'none', border: 'none', color: '#f44', cursor: 'pointer' }}>⛔</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
} 