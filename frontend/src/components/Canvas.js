import React, { useRef, useEffect, useState, useContext } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function Canvas({ isDrawing, onDraw, drawingData, disabled, color, width, tool, isEraser, setColor, setWidth, setTool, setIsEraser, onUndo, onRedo, renderControls }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [localStack, setLocalStack] = useState([]);
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

  // Sync local stack with drawing data
  useEffect(() => {
    if (drawingData && Array.isArray(drawingData)) {
      setLocalStack(drawingData);
      // Clear redo stack when new data comes in
      setRedoStack([]);
    }
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
      // Add to local stack for undo
      setLocalStack(stack => [...stack, line]);
      // Clear redo stack when new drawing is added
      setRedoStack([]);
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
    console.log('[Canvas] Undo clicked, localStack length:', localStack.length);
    if (isDrawing && localStack.length > 0) {
      const newStack = localStack.slice(0, -1);
      const undoneLine = localStack[localStack.length - 1];
      setUndoStack([...undoStack, undoneLine]);
      setLocalStack(newStack);
      setRedoStack([]);
      console.log('[Canvas] Undo: removed line, new stack length:', newStack.length);
      if (onDraw) onDraw({ type: 'set', stack: newStack });
    }
  };

  // Redo last undone action
  const handleRedo = () => {
    console.log('[Canvas] Redo clicked, undoStack length:', undoStack.length);
    if (isDrawing && undoStack.length > 0) {
      const restored = undoStack[undoStack.length - 1];
      const newStack = [...localStack, restored];
      setUndoStack(undoStack.slice(0, -1));
      setLocalStack(newStack);
      console.log('[Canvas] Redo: restored line, new stack length:', newStack.length);
      if (onDraw) onDraw({ type: 'set', stack: newStack });
    }
  };

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
      <canvas
        ref={canvasRef}
        width={480}
        height={400}
        style={{ background: '#111', borderRadius: 12, border: '2px solid #444', touchAction: 'none', display: 'block', margin: '0 auto', width: '100%', maxWidth: 480, height: 'auto' }}
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