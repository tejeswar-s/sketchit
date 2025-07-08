import React from 'react';

export default function WordPopup({ words, onSelect }) {
  console.log('WordPopup component rendered!', { words });

  return (
    <div style={{ background: '#222', color: '#fff', border: '4px solid red', borderRadius: 12, padding: 24, boxShadow: '0 4px 32px #0008', textAlign: 'center', zIndex: 99999 }}>
      <h3>Choose a word to draw</h3>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
        {words.map((word) => (
          <button
            key={word}
            onClick={() => onSelect(word)}
            style={{ fontSize: 20, padding: '12px 24px', borderRadius: 8, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
} 