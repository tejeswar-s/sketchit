import React, { useRef, useEffect, useState, useContext } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function Canvas({ isDrawing, onDraw, onStrokeEnd, drawingData, tempStroke = [], disabled, color, width, tool, isEraser, setColor, setWidth, setTool, setIsEraser, onUndo, onRedo, renderControls }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  // Remove: const [currentStroke, setCurrentStroke] = useState([]);
  const [localStack, setLocalStack] = useState([]);
  // No redo stack needed
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 400 });

  // Dynamically update canvas size to match rendered size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight
        });
      }
    };
    updateSize();
    const resizeObserver = new window.ResizeObserver(updateSize);
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);
    window.addEventListener('resize', updateSize);
    return () => {
      if (canvasRef.current) resizeObserver.unobserve(canvasRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Predefined color palette
  const COLORS = [
    '#7c2323', '#000', '#fff', '#e53935', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#00bcd4', '#ff9800', '#795548', '#c0c0c0'
  ];
  const SIZES = [2, 4, 8, 16];

  const socket = useSocket();

  useEffect(() => {
    if (!drawingData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    drawingData.forEach(action => {
      if (action.type === 'fill') {
        floodFill(ctx, action.x, action.y, action.color);
      } else if (action.type === 'stroke') {
        action.lines.forEach(line => {
          ctx.strokeStyle = line.color || '#fff';
          ctx.lineWidth = line.width || 3;
          ctx.beginPath();
          ctx.moveTo(line.from.x, line.from.y);
          ctx.lineTo(line.to.x, line.to.y);
          ctx.stroke();
        });
      } else if (!action.type) {
        // For legacy or real-time segments
        ctx.strokeStyle = action.color || '#fff';
        ctx.lineWidth = action.width || 3;
        ctx.beginPath();
        ctx.moveTo(action.from.x, action.from.y);
        ctx.lineTo(action.to.x, action.to.y);
        ctx.stroke();
      }
    });
    // Draw tempStroke in real time
    if (tempStroke && tempStroke.length > 0) {
      tempStroke.forEach(line => {
        ctx.strokeStyle = line.color || '#fff';
        ctx.lineWidth = line.width || 3;
        ctx.beginPath();
        ctx.moveTo(line.from.x, line.from.y);
        ctx.lineTo(line.to.x, line.to.y);
        ctx.stroke();
      });
    }
  }, [drawingData, canvasSize, tempStroke]);

  // Sync local stack with drawing data
  useEffect(() => {
    if (drawingData && Array.isArray(drawingData)) {
      setLocalStack(drawingData);
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

  const getRelativePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    // Scale to canvas coordinate system
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return { x: x * scaleX, y: y * scaleY };
  };

  // Update pointer handlers to use onDraw and onStrokeEnd, but do not manage currentStroke locally
  const handlePointerDown = (e) => {
    if (disabled) return;
    setDrawing(true);
    setLastPos(getRelativePos(e));
    // No need to reset currentStroke
  };
  const handlePointerMove = (e) => {
    if (!drawing || disabled) return;
    const pos = getRelativePos(e);
    if (lastPos && pos) {
      const line = { from: lastPos, to: pos, color: isEraser ? '#111' : color, width };
      onDraw && onDraw(line); // Real-time drawing
      setLastPos(pos);
      // No need to update currentStroke
    }
  };
  const handlePointerUp = () => {
    setDrawing(false);
    setLastPos(null);
    if (tempStroke.length > 0) {
      // Notify parent of completed stroke for undo/redo
      onStrokeEnd && onStrokeEnd({ type: 'stroke', lines: tempStroke });
      // No need to clear currentStroke
    }
  };

  // Flood fill algorithm for fill bucket
  const floodFill = (ctx, x, y, fillColor) => {
    if (!canvasRef.current || canvasRef.current.width === 0 || canvasRef.current.height === 0) return;
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
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
      // Find the last index of a stroke or fill
      let idx = localStack.length - 1;
      while (idx >= 0 && !localStack[idx].type) idx--;
      if (idx < 0) return; // No stroke/fill found
      const newStack = localStack.slice(0, idx);
      setLocalStack(newStack);
      if (onDraw) onDraw({ type: 'set', stack: newStack });
    }
  };

  // Redo removed

  // Canvas event handlers
  const handleCanvasClick = (e) => {
    if (tool === 'fill' && !disabled) {
      const pos = getRelativePos(e);
      const fillAction = { type: 'fill', x: pos.x, y: pos.y, color };
      onDraw && onDraw(fillAction);
      setLocalStack(stack => [...stack, fillAction]);
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ background: '#111', borderRadius: 12, border: '2px solid #444', touchAction: 'none', display: 'block', margin: '0 auto', width: '100%', maxWidth: 700, height: 'auto', minHeight: 300 }}
        onMouseDown={isDrawing && tool !== 'fill' ? handlePointerDown : undefined}
        onMouseMove={isDrawing && tool !== 'fill' ? handlePointerMove : undefined}
        onMouseUp={isDrawing && tool !== 'fill' ? handlePointerUp : undefined}
        onMouseLeave={isDrawing && tool !== 'fill' ? handlePointerUp : undefined}
        onTouchStart={isDrawing && tool !== 'fill' ? handlePointerDown : undefined}
        onTouchMove={isDrawing && tool !== 'fill' ? handlePointerMove : undefined}
        onTouchEnd={isDrawing && tool !== 'fill' ? handlePointerUp : undefined}
        onClick={tool === 'fill' ? handleCanvasClick : undefined}
      />
      <style>{`
        @media (max-width: 600px) {
          canvas {
            max-width: 98vw !important;
            width: 100vw !important;
            height: auto !important;
          }
        }
      `}</style>
      {renderControls && renderControls({
        onUndo,
        onRedo,
        setColor,
        setWidth,
        setTool,
        setIsEraser,
        color,
        width,
        tool,
        isEraser,
        disabled
      })}
    </div>
  );
} 