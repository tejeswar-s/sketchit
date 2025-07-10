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
            {/* Avatar Display */}
            <span style={{ 
              fontSize: 20, 
              marginRight: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '6px',
              border: '1px solid #007bff'
            }}>
              {p.avatar && p.avatar.emoji ? p.avatar.emoji : '👤'}
            </span>
            <span>{p.name}</span>
            <span style={{ marginLeft: 8 }}>{showBadges && i < 3 ? badges[i] : ''}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 