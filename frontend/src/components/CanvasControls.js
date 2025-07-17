import React from 'react';

export default function CanvasControls({ color, setColor, width, setWidth, tool, setTool, isEraser, setIsEraser, disabled, onUndo, canUndo, onClear }) {
  const COLORS = [
    '#000', '#222', '#fff', '#e53935', '#fbc02d', '#43a047', '#1e88e5',
    '#8e24aa', '#00bcd4', '#ff9800', '#795548', '#c0c0c0', '#ffb6c1',
    '#ffd700', '#90ee90', '#00ced1', '#4682b4', '#dda0dd', '#ff6347', '#40e0d0', '#a0522d'
  ];
  const SIZES = [2, 4, 8, 16];
  const ERASER_SIZE = 32;
  const toolButtons = [
    { key: 'fill', icon: '🪣', onClick: () => { setTool('fill'); setIsEraser(false); }, disabled, title: 'Fill' },
    { key: 'undo', icon: '↩️', onClick: onUndo, disabled: !canUndo, title: 'Undo' },
    { key: 'clear', icon: '🗑️', onClick: onClear, disabled, title: 'Clear' },
    { key: 'eraser', icon: '🧽', onClick: () => { setIsEraser(true); setTool('brush'); setWidth(ERASER_SIZE); }, disabled, title: 'Eraser' },
    ...SIZES.map(s => ({ key: `size-${s}`, icon: <span style={{ display: 'inline-block', width: s * 2, height: s * 2, background: color, borderRadius: '50%', border: '1px solid #888' }} />, onClick: () => { setWidth(s); setIsEraser(false); setTool('brush'); }, disabled, title: `Brush size ${s}` }))
  ];
  const allButtons = [
    ...COLORS.map((c, i) => ({
      key: `color-${i}`,
      icon: <span style={{ display: 'inline-block', width: 18, height: 18, background: c, borderRadius: '50%', border: c === '#fff' ? '1.5px solid #aaa' : 'none', boxShadow: c === color ? '0 0 0 2px #a777e3' : 'none' }} />, onClick: () => { setColor(c); setIsEraser(false); setTool('brush'); }, disabled, title: c
    })),
    ...toolButtons
  ];
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 400;
  if (isSmallScreen) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(15, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 2,
        width: '92vw',
        maxWidth: '92vw',
        minWidth: 0,
        padding: '2px 0',
        boxSizing: 'border-box',
        justifyItems: 'center',
        alignItems: 'center',
        margin: '0 auto',
      }}>
        {allButtons.slice(0, 15).map(btn => (
          <button key={btn.key} onClick={btn.onClick} disabled={btn.disabled} title={btn.title} style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>{btn.icon}</button>
        ))}
        {allButtons.slice(15, 30).map(btn => (
          <button key={btn.key} onClick={btn.onClick} disabled={btn.disabled} title={btn.title} style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>{btn.icon}</button>
        ))}
      </div>
    );
  }
  // ...existing full screen layout code (import from Canvas.js or keep as before)...
  return null;
} 