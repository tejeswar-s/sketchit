import React, { useRef, useEffect, useState, useContext } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function Canvas({ isDrawing, onDraw, drawingData, disabled }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [color, setColor] = useState('#fff');
  const [width, setWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [localStack, setLocalStack] = useState([]);
  const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'fill'
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Predefined color palette
  const COLORS = [
    '#7c2323', '#000', '#fff', '#e53935', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#00bcd4', '#ff9800', '#795548', '#c0c0c0'
  ];
  const SIZES = [2, 4, 8, 16];

  const socket = useSocket();

  useEffect(() => {
    if (!drawingData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 600, 400);
    drawingData.forEach(line => {
      ctx.strokeStyle = line.color || '#fff';
      ctx.lineWidth = line.width || 3;
      ctx.beginPath();
      ctx.moveTo(line.from.x, line.from.y);
      ctx.lineTo(line.to.x, line.to.y);
      ctx.stroke();
    });
  }, [drawingData]);

  // Undo stack for local actions
  useEffect(() => {
    setLocalStack(drawingData || []);
  }, [drawingData]);

  useEffect(() => {
    if (!socket) return;
    const handleFill = ({ x, y, color }) => {
      const ctx = canvasRef.current.getContext('2d');
      floodFill(ctx, x, y, color);
    };
    socket.on('fill', handleFill);
    return () => socket.off('fill', handleFill);
  }, [socket]);

  const handlePointerDown = (e) => {
    if (disabled) return;
    setDrawing(true);
    setLastPos(getPos(e));
  };
  const handlePointerMove = (e) => {
    if (!drawing || disabled) return;
    const pos = getPos(e);
    if (lastPos && pos) {
      const line = { from: lastPos, to: pos, color: isEraser ? '#111' : color, width };
      onDraw && onDraw(line);
      setLastPos(pos);
      setLocalStack(stack => [...stack, line]);
    }
  };
  const handlePointerUp = () => {
    setDrawing(false);
    setLastPos(null);
  };
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  // Flood fill algorithm for fill bucket
  const floodFill = (ctx, x, y, fillColor) => {
    const imageData = ctx.getImageData(0, 0, 600, 400);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const startIdx = (Math.floor(y) * width + Math.floor(x)) * 4;
    const targetColor = data.slice(startIdx, startIdx + 4);
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);
    if (targetColor[0] === fillR && targetColor[1] === fillG && targetColor[2] === fillB) return;
    const stack = [[Math.floor(x), Math.floor(y)]];
    let filled = false;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const idx = (cy * width + cx) * 4;
      if (
        data[idx] === targetColor[0] &&
        data[idx + 1] === targetColor[1] &&
        data[idx + 2] === targetColor[2] &&
        data[idx + 3] === targetColor[3]
      ) {
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = 255;
        stack.push([cx + 1, cy]);
        stack.push([cx - 1, cy]);
        stack.push([cx, cy + 1]);
        stack.push([cx, cy - 1]);
        filled = true;
      }
    }
    if (filled) {
      ctx.putImageData(imageData, 0, 0);
    }
  };

  // Undo last action
  const handleUndo = () => {
    if (localStack.length > 0) {
      const newStack = localStack.slice(0, -1);
      setLocalStack(newStack);
      // Optionally, emit the new stack to backend (not implemented in backend yet)
    }
  };

  // Controls UI
  const controls = (
    <div className="d-flex align-items-center justify-content-center mb-2" style={{ gap: 8 }}>
      {/* Color buttons */}
      {COLORS.map(c => (
        <button
          key={c}
          className="btn btn-sm"
          style={{ background: c, border: color === c ? '2px solid #0af' : '2px solid #fff', width: 24, height: 24, margin: 0, padding: 0, borderRadius: 4 }}
          onClick={() => { setColor(c); setTool('pen'); setIsEraser(false); }}
          disabled={disabled}
        />
      ))}
      {/* Tool buttons */}
      <button className={`btn btn-sm ${tool === 'pen' ? 'btn-primary' : ''}`} style={{ background: tool === 'pen' ? '#b39ddb' : '#fff', border: '1px solid #888', marginLeft: 8 }} onClick={() => { setTool('pen'); setIsEraser(false); }} disabled={disabled} title="Pen">✏️</button>
      <button className={`btn btn-sm ${tool === 'eraser' ? 'btn-warning' : ''}`} style={{ marginLeft: 2 }} onClick={() => { setTool('eraser'); setIsEraser(true); }} disabled={disabled} title="Eraser">🧽</button>
      <button className={`btn btn-sm ${tool === 'fill' ? 'btn-info' : ''}`} style={{ marginLeft: 2 }} onClick={() => { setTool('fill'); setIsEraser(false); }} disabled={disabled} title="Fill">🪣</button>
      <button className="btn btn-sm btn-light" style={{ marginLeft: 2 }} onClick={handleUndo} disabled={disabled} title="Undo">↩️</button>
      <button className="btn btn-sm btn-light" style={{ marginLeft: 2 }} onClick={() => {
        if (redoStack.length > 0) {
          const restored = redoStack[redoStack.length - 1];
          setRedoStack(redoStack.slice(0, -1));
          setLocalStack([...localStack, restored]);
        }
      }} disabled={disabled || redoStack.length === 0} title="Redo">↪️</button>
      {/* Size buttons */}
      {SIZES.map(s => (
        <button
          key={s}
          className="btn btn-sm btn-light"
          style={{ marginLeft: 2, width: 28, height: 28, border: width === s ? '2px solid #0af' : '1px solid #888', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setWidth(s)}
          disabled={disabled}
        >
          <span style={{ display: 'inline-block', background: '#222', borderRadius: '50%', width: s, height: s }} />
        </button>
      ))}
      {/* Trash/clear button (future) */}
      {/* <button className="btn btn-sm btn-danger" style={{ marginLeft: 2 }} title="Clear">🗑️</button> */}
    </div>
  );

  // Canvas event handlers
  const handleCanvasClick = (e) => {
    if (tool === 'fill' && !disabled) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      if (isDrawing && socket) {
        socket.emit('fill', { x, y, color });
      }
      // Optionally, apply locally for drawer for instant feedback
      const ctx = canvasRef.current.getContext('2d');
      floodFill(ctx, x, y, color);
    }
  };

  return (
    <div>
      {isDrawing && !disabled && controls}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ background: '#111', borderRadius: 12, border: '2px solid #444', touchAction: 'none', width: '100%', maxWidth: 600, display: 'block', margin: '0 auto' }}
        onMouseDown={isDrawing && tool !== 'fill' ? handlePointerDown : undefined}
        onMouseMove={isDrawing && tool !== 'fill' ? handlePointerMove : undefined}
        onMouseUp={isDrawing && tool !== 'fill' ? handlePointerUp : undefined}
        onMouseLeave={isDrawing && tool !== 'fill' ? handlePointerUp : undefined}
        onTouchStart={isDrawing && tool !== 'fill' ? handlePointerDown : undefined}
        onTouchMove={isDrawing && tool !== 'fill' ? handlePointerMove : undefined}
        onTouchEnd={isDrawing && tool !== 'fill' ? handlePointerUp : undefined}
        onClick={tool === 'fill' ? handleCanvasClick : undefined}
      />
    </div>
  );
} 