import React from 'react';

export default function PlayerList({ players, hostId, drawerId, myUserId, onKick }) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div
      className="player-list-container"
      style={{
        background: '#222',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        maxWidth: 400,
        marginTop: 16,
      }}
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        {sorted.map((p, i) => {
          const isHost = p.userId === hostId;
          const isDrawer = p.userId === drawerId;
          let avatarBorder = '2px solid #007bff';
          if (isHost && isDrawer) {
            avatarBorder = '2.5px solid #1aff7c'; // green inner
          } else if (isHost) {
            avatarBorder = '2.5px solid #e53935'; // red for host
          } else if (isDrawer) {
            avatarBorder = '2.5px solid #1aff7c'; // green for drawer
          }
          return (
          <div
            key={p.userId}
            style={{
              display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: 8, marginBottom: 6,
              background: p.userId === myUserId ? '#23272b' : 'transparent',
              border: '2px solid transparent',
              transition: 'box-shadow 0.2s, border 0.2s',
              minWidth: 0,
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '100%',
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
              border: avatarBorder,
              boxSizing: 'border-box',
              minWidth: 0,
              maxWidth: '100%',
              boxShadow: isHost && isDrawer ? '0 0 0 2.5px #e53935' : undefined // red outer if both
            }}>
              {p.avatar && p.avatar.emoji ? p.avatar.emoji : '\ud83d\udc64'}
            </span>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span style={{ marginLeft: 'auto', color: '#ffd700', fontWeight: 'bold', minWidth: 40, textAlign: 'right' }}>{p.score} pts</span>
            {/* Kick button removed */}
          </div>
          );
        })}
      </ul>
    </div>
  );
} 