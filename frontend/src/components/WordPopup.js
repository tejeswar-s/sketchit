import React from 'react';

export default function WordPopup({ words, onSelect }) {
  console.log('WordPopup component rendered!', { words });

  return (
    <div style={{ width: '100%', maxWidth: 480, aspectRatio: '6/5', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #23272b 60%, #3a3f5a 100%)', color: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 8px 40px #000a', textAlign: 'center', zIndex: 99999, minWidth: 340, maxWidth: 420, maxHeight: 340, overflowY: 'auto', fontFamily: "'Rajdhani', 'Orbitron', 'Inter', 'Segoe UI', Arial, sans-serif" }}>
        <h3 style={{ margin: 0, color: '#a7bfff', letterSpacing: 1, fontFamily: "'Rajdhani', 'Orbitron', 'Inter', 'Segoe UI', Arial, sans-serif" }}>Choose a word to draw</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', marginTop: 24 }}>
          {words.map((word) => (
            <button
              key={word}
              onClick={() => onSelect(word)}
              style={{
                fontSize: 20,
                padding: '14px 24px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                boxShadow: '0 2px 12px #0004',
                transition: 'transform 0.1s, background 0.18s',
                outline: 'none',
                minWidth: 110,
                maxWidth: 180,
                marginBottom: 8,
                wordBreak: 'break-word',
                fontFamily: "'Rajdhani', 'Orbitron', 'Inter', 'Segoe UI', Arial, sans-serif",
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 