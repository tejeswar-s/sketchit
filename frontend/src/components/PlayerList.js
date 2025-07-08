import React from 'react';
import Avatar from 'avataaars';

export default function PlayerList({ players, hostId, drawerId, myUserId, onMute, onKick }) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div style={{ background: '#222', borderRadius: 8, padding: 12, color: '#fff', minWidth: 200 }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Players</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((p, i) => (
          <li key={p.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, fontWeight: p.userId === myUserId ? 'bold' : 'normal', background: p.userId === myUserId ? '#1a2a3a' : 'none', borderRadius: 6, padding: '2px 4px' }}>
            {typeof p.avatar === 'object' && p.avatar !== null ? (
              <span style={{ marginRight: 8 }}><Avatar style={{ width: 32, height: 32 }} {...p.avatar} /></span>
            ) : (
              <span style={{ fontSize: 24, marginRight: 8 }}>{p.avatar}</span>
            )}
            <span style={{ color: p.userId === drawerId ? '#0af' : '#fff', flex: 1 }}>{p.name}</span>
            <span style={{ marginLeft: 8, color: '#ffd700', fontWeight: 'bold', minWidth: 40, textAlign: 'right' }}>{p.score} pts</span>
            {p.userId === hostId && <span title="Host" style={{ marginLeft: 6, color: '#ff0' }}>★</span>}
            {p.userId === drawerId && <span title="Drawing" style={{ marginLeft: 6, color: '#0af' }}>✏️</span>}
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