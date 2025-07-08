import React from 'react';

export default function ScoreBoard({ players, showBadges }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const badges = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ background: '#222', borderRadius: 8, padding: 12, color: '#fff', minWidth: 200 }}>
      <h4 style={{ margin: '0 0 8px 0' }}>Scores</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sorted.map((p, i) => (
          <li key={p.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontWeight: 'bold', color: i === 0 ? '#ffd700' : '#fff', marginRight: 8 }}>{i + 1}.</span>
            <span style={{ fontSize: 20, marginRight: 8 }}>{p.avatar}</span>
            <span>{p.name}</span>
            <span style={{ marginLeft: 8 }}>{showBadges && i < 3 ? badges[i] : ''}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 