import React from 'react';

export default function WordPopup({ words, onSelect, timer }) {
  console.log('WordPopup component rendered!', { words });

  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' }}>
      <div style={{
        background: 'linear-gradient(135deg, #23272b 80%, #3a3f5a 100%)',
        color: '#fff',
        borderRadius: 20,
        padding: window.innerWidth <= 400 ? '10px 4px' : 'clamp(18px, 6vw, 40px) clamp(16px, 8vw, 60px)',
        boxShadow: '0 4px 32px #000a, 0 0 16px #a777e344',
        textAlign: 'center',
        zIndex: 99999,
        minWidth: 0,
        maxWidth: window.innerWidth <= 400 ? '92vw' : 700,
        width: window.innerWidth <= 400 ? '92vw' : 700,
        maxHeight: 340,
        overflowY: 'auto',
        fontFamily: "'Rajdhani', 'Orbitron', 'Inter', 'Segoe UI', Arial, sans-serif",
        border: window.innerWidth <= 400 ? 'none' : '2.5px solid #a777e3',
        margin: '0 auto',
        position: 'relative',
        animation: 'fadeInDown 0.7s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}>
        {window.innerWidth <= 400 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 6,
            width: '100%',
          }}>
            {typeof timer === 'number' && (
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1aff7c', letterSpacing: 2, textShadow: '0 2px 8px #1aff7c44', marginRight: 6 }}>{timer}</div>
            )}
            <h3 style={{ margin: 0, color: '#a7bfff', letterSpacing: 1, fontFamily: "'Rajdhani', 'Orbitron', 'Inter', 'Segoe UI', Arial, sans-serif", fontSize: 16, fontWeight: 700 }}>{'Choose a word to draw'}</h3>
          </div>
        ) : (
          <>
            {typeof timer === 'number' && (
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1aff7c', marginBottom: 10, letterSpacing: 2, textShadow: '0 2px 8px #1aff7c44' }}>{timer}</div>
            )}
            <h3 style={{ margin: 0, color: '#a7bfff', letterSpacing: 1, fontFamily: "'Rajdhani', 'Orbitron', 'Inter', 'Segoe UI', Arial, sans-serif" }}>Choose a word to draw</h3>
          </>
        )}
        {window.innerWidth <= 400 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
            {words.map((word) => (
              <button
                key={word}
                onClick={() => onSelect(word)}
                style={{
                  fontSize: 14,
                  padding: '7px 10px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  boxShadow: '0 2px 12px #0004',
                  transition: 'transform 0.1s, background 0.18s',
                  outline: 'none',
                  minWidth: 80,
                  maxWidth: 180,
                  marginBottom: 0,
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
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', marginTop: 24, width: '100%' }}>
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
        )}
      </div>
    </div>
  );
} 