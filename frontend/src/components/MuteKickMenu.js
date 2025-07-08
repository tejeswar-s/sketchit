import React from 'react';

export default function MuteKickMenu({ onMute, onKick }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onMute} style={{ background: '#fa0', color: '#222', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Mute</button>
      <button onClick={onKick} style={{ background: '#f44', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Kick</button>
    </div>
  );
} 