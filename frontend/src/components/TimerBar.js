import React from 'react';

export default function TimerBar({ timeLeft, totalTime }) {
  const percent = totalTime ? (timeLeft / totalTime) * 100 : 0;
  return (
    <div style={{ width: '100%', background: '#333', borderRadius: 8, overflow: 'hidden', margin: '8px 0' }}>
      <div style={{ width: `${percent}%`, height: 16, background: percent < 30 ? '#f44' : percent < 60 ? '#fa0' : '#0f0', transition: 'width 0.5s' }} />
      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{timeLeft}s</span>
    </div>
  );
} 