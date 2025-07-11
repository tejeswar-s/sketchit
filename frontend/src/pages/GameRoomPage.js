import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Canvas from '../components/Canvas';
import ChatBox from '../components/ChatBox';
import TimerBar from '../components/TimerBar';
import WordPopup from '../components/WordPopup';
import PlayerList from '../components/PlayerList';
import ScoreBoard from '../components/ScoreBoard';
import { useGame } from '../contexts/GameContext';
import { useSocket } from '../contexts/SocketContext';
import useSocketEvents from '../hooks/useSocketEvents';
import SettingsPanel from '../components/SettingsPanel';
import Modal from '../components/Modal';
import useVoiceChat from '../hooks/useVoiceChat';

// Add animation CSS for letter reveal
// const style = document.createElement('style');
// style.innerHTML = `
//   @keyframes fadeInLetter {
//     from { opacity: 0.2; color: #ff0; }
//     to { opacity: 1; color: #fff; }
//   }
// `;

// const messagesEndRef = useRef(null);
// document.head.appendChild(style);

function TopBar({ round, maxRounds, timeLeft, onSettings, phase, isDrawer, isHost, onLeave, onClose, selectedWordOrBlanks, isMicOn, onToggleMic, isHostUser, onGlobalMute, globalMuted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#1a2a3a', borderRadius: 8, padding: '6px 18px', marginBottom: 12, minHeight: 0, height: 56, gap: 0 }}>
      {/* Left: Timer and round */}
      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: 18, minWidth: 170 }}>
        <span style={{ background: '#fff', color: '#222', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>{timeLeft}</span>
        <span>Round {round} of {maxRounds}</span>
      </div>
      {/* Center: Selected word or blanks */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 200 }}>
        {selectedWordOrBlanks}
      </div>
      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220, justifyContent: 'flex-end' }}>
        <button className="btn btn-outline-danger btn-sm" onClick={onLeave} style={{ marginRight: 4 }}>Leave Room</button>
        {isHost && <button className="btn btn-danger btn-sm" onClick={onClose} style={{ marginRight: 12 }}>Close Room</button>}
        <button onClick={onSettings} style={{ background: 'none', border: 'none', fontSize: 28, color: '#fff', cursor: 'pointer' }} title="Settings">⚙️</button>
        {/* Mic toggle button - always at far right */}
        <button
          onClick={onToggleMic}
          style={{
            background: isMicOn ? 'linear-gradient(135deg, #1aff7c 60%, #43e97b 100%)' : 'linear-gradient(135deg, #444 60%, #222 100%)',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: isMicOn ? '#fff' : '#bbb',
            marginLeft: 16,
            boxShadow: isMicOn ? '0 0 0 4px #1aff7c55, 0 2px 8px #0006' : '0 2px 8px #0006',
            outline: isMicOn ? '2px solid #1aff7c' : 'none',
            transition: 'background 0.2s, box-shadow 0.2s, outline 0.2s',
            cursor: 'pointer',
            position: 'relative',
          }}
          title={isMicOn ? 'Turn off mic' : 'Turn on mic'}
          onMouseOver={e => { e.currentTarget.style.boxShadow = isMicOn ? '0 0 0 6px #1aff7c99, 0 2px 12px #0008' : '0 0 0 2px #888, 0 2px 12px #0008'; }}
          onMouseOut={e => { e.currentTarget.style.boxShadow = isMicOn ? '0 0 0 4px #1aff7c55, 0 2px 8px #0006' : '0 2px 8px #0006'; }}
        >
          {isMicOn ? '🎤' : '🎙️'}
          {/* Optional: live pulse */}
          {isMicOn && (
            <span style={{
              position: 'absolute',
              top: -6, left: -6, right: -6, bottom: -6,
              borderRadius: '50%',
              boxShadow: '0 0 12px 4px #1aff7c55',
              pointerEvents: 'none',
              animation: 'mic-pulse 1.2s infinite',
              zIndex: 0,
            }} />
          )}
        </button>
        {isHostUser && (
          <button
            onClick={onGlobalMute}
            style={{ background: globalMuted ? '#ff4d4f' : '#1aff7c', color: '#fff', border: 'none', borderRadius: 6, padding: '0 16px', height: 36, fontWeight: 600, marginLeft: 8, cursor: 'pointer', boxShadow: globalMuted ? '0 0 8px #ff4d4f88' : '0 0 8px #1aff7c88', transition: 'background 0.2s, box-shadow 0.2s' }}
            title={globalMuted ? 'Unmute all' : 'Mute all'}
          >
            {globalMuted ? 'Unmute All' : 'Mute All'}
          </button>
        )}
      </div>
      {/* Mic pulse animation */}
      <style>{`
        @keyframes mic-pulse {
          0% { box-shadow: 0 0 12px 4px #1aff7c55; }
          50% { box-shadow: 0 0 24px 8px #1aff7c33; }
          100% { box-shadow: 0 0 12px 4px #1aff7c55; }
        }
      `}</style>
    </div>
  );
}

// Helper to merge scores into player objects
function mergeScores(players, scores) {
  if (!scores) return players;
  const scoreMap = Object.fromEntries(scores.map(s => [s.userId, s.score]));
  return players.map(p => ({
    ...p,
    score: scoreMap[p.userId] !== undefined ? scoreMap[p.userId] : p.score,
  }));
}

export default function GameRoomPage() {
  // All hooks and state
  // Inject animation CSS for letter reveal on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeInLetter {
        from { opacity: 0.2; color: #ff0; }
        to { opacity: 1; color: #fff; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  const messagesEndRef = useRef(null); // Moved inside component
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, room, setRoom, gameState, setGameState, leaderboard, setLeaderboard } = useGame();
  const socket = useSocket();
  const [drawingData, setDrawingData] = useState([]);
  const [tempStroke, setTempStroke] = useState([]); // For real-time drawing
  const [messages, setMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hint, setHint] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [phase, setPhase] = useState('waiting'); // choose-word, drawing, round-end, ended
  const [maskedWord, setMaskedWord] = useState('');
  const [disabledGuess, setDisabledGuess] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [showSelectedWordModal, setShowSelectedWordModal] = useState(false);
  const [roundScores, setRoundScores] = useState(null);
  const [justRevealed, setJustRevealed] = useState([]);
  const prevHintRef = useRef('');
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundSummaryData, setRoundSummaryData] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showHostChange, setShowHostChange] = useState(false);
  const [showDrawerChange, setShowDrawerChange] = useState(false);
  const [hostChangeMsg, setHostChangeMsg] = useState('');
  const [drawerChangeMsg, setDrawerChangeMsg] = useState('');
  const [redirectMsg, setRedirectMsg] = useState('');
  const [showSettingsSaved, setShowSettingsSaved] = useState(false);
  // Drawing tool state (hoisted from Canvas)
  const [color, setColor] = useState('#fff');
  const [width, setWidth] = useState(4);
  const [tool, setTool] = useState('pen');
  const [isEraser, setIsEraser] = useState(false);
  // Undo/redo stacks for drawing
  const [localStack, setLocalStack] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  // Sync localStack with drawingData so undo button activates after drawing
  useEffect(() => {
    setLocalStack(drawingData);
  }, [drawingData]);
  // Chat input state
  const [input, setInput] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [micStatus, setMicStatus] = useState({}); // userId -> true/false
  const [globalMuted, setGlobalMuted] = useState(false);

  // Voice chat hook - must be at top level
  const { speakingUsers } = useVoiceChat({ 
    isMicOn, 
    roomCode, 
    user, 
    socket, 
    players: room?.players || [], 
    globalMuted, 
    isHostUser 
  });

  // Broadcast mic status when toggled
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('mic-status', { code: roomCode, userId: user.userId, isMicOn });
  }, [isMicOn, socket, user, roomCode]);

  // Listen for mic status updates from others
  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId, isMicOn }) => {
      setMicStatus(prev => ({ ...prev, [userId]: isMicOn }));
    };
    socket.on('mic-status', handler);
    return () => { socket.off('mic-status', handler); };
  }, [socket]);

  // Listen for global mute events
  useEffect(() => {
    if (!socket) return;
    const handler = ({ muted }) => setGlobalMuted(muted);
    socket.on('global-mute', handler);
    return () => { socket.off('global-mute', handler); };
  }, [socket]);

  // Undo last action
  const handleUndo = () => {
    if (isDrawer && drawingData.length > 0) {
      // Remove last group (stroke/fill) or segment if only segments exist
      let newData = [...drawingData];
      // If last is a stroke group, remove it; else, remove last segment
      if (newData[newData.length - 1]?.type === 'stroke' || newData[newData.length - 1]?.type === 'fill') {
        newData = newData.slice(0, -1);
      } else {
        // Remove all trailing segments (shouldn't happen, but fallback)
        while (newData.length && !newData[newData.length - 1].type) newData.pop();
      }
      setDrawingData(newData);
      socket.emit('draw-data', { code: room.code, data: { type: 'set', stack: newData } });
    }
  };
  // Redo last undone action
  const handleRedo = () => {
    if (isDrawer && undoStack.length > 0) {
      const restored = undoStack[undoStack.length - 1];
      const newStack = [...localStack, restored];
      setUndoStack(undoStack.slice(0, -1));
      setLocalStack(newStack);
      if (handleDraw) handleDraw({ type: 'set', stack: newStack });
    }
  };
  // Fill (bucket) handler
  const handleFill = (x, y, color) => {
    // Forward to Canvas via prop
    // (Canvas will handle the actual fill logic)
  };

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Derived variables
  const isDrawer = gameState && user ? gameState.drawingPlayerId === user.userId : false;
  const isMuted = room && user ? room.players.find(p => p.userId === user.userId)?.isMuted : false;
  const isHost = room && user ? room.players.find(p => p.userId === user.userId)?.isHost : false;
  const isHostUser = !!room?.players?.find(p => p.userId === user?.userId && p.isHost);

  // Now it's safe to log
  console.log('GameRoomPage render', { phase, isDrawer, wordChoices: gameState?.wordChoices });

  // Debug logging
  useEffect(() => {
    console.log('room:', room);
    console.log('gameState:', gameState);
  }, [room, gameState]);

  // Fetch room and game state if missing
  useEffect(() => {
    if (!room && roomCode) {
      fetch(`http://localhost:5000/api/rooms/${roomCode}`)
        .then(res => res.json())
        .then(data => {
          setRoom(data);
          setGameState(data.gameState);
        });
    } else if (room && !gameState) {
      setGameState(room.gameState);
    }
  }, [room, gameState, roomCode, setRoom, setGameState]);

  // Always sync gameState from room.gameState if out of sync
  useEffect(() => {
    if (room && room.gameState && (!gameState || gameState !== room.gameState)) {
      setGameState(room.gameState);
    }
  }, [room, gameState, setGameState]);

  // Socket event handlers
  useSocketEvents({
    'round-start': ({ drawerId, wordChoices, round, maxRounds, playerOrder }) => {
      setPhase('selecting-word');
      setRoom(r => ({ ...r, gameState: { ...r?.gameState, round, maxRounds, drawingPlayerId: drawerId, wordChoices, phase: 'selecting-word' } }));
      setGameState(gs => ({ ...gs, round, maxRounds, drawingPlayerId: drawerId, wordChoices, phase: 'selecting-word' }));
      setDrawingData([]);
      setMessages([]);
      setDisabledGuess(false);
      setSelectedWord('');
      setShowSelectedWordModal(false);
    },
    'word-selected': ({ maskedWord, roundTime, autoSelected, word, drawerId }) => {
      setPhase('drawing');
      setGameState(gs => ({
        ...gs,
        phase: 'drawing',
        wordChoices: [],
        currentWord: word,
      }));
      setMaskedWord(maskedWord);
      setTimeLeft(roundTime);
      setDisabledGuess(false);
      setDrawingData([]);
      setMessages([]);
      if (user && user.userId === drawerId) {
        setSelectedWord(word);
        setShowSelectedWordModal(true);
        setTimeout(() => setShowSelectedWordModal(false), 2000);
      }
      console.log('Received word-selected, phase set to drawing, word choices cleared');
    },
    'draw-data': (line) => {
      if (line && line.type === 'set') {
        setDrawingData(line.stack);
      } else {
        setDrawingData(data => [...data, line]);
      }
    },
    'guess-result': ({ userId, guess, correct, score }) => {
      setMessages(msgs => [...msgs, { name: room?.players.find(p => p.userId === userId)?.name || 'Player', message: guess, correct }]);
      if (userId === user.userId && correct) setDisabledGuess(true);
    },
    'hint-update': ({ hint }) => {
      // Compute newly revealed indices for animation
      setMaskedWord(prev => {
        const prevArr = prev ? prev.split('') : [];
        const currArr = hint.split('');
        const newIndices = currArr.map((c, i) => c !== '_' && prevArr[i] === '_' ? i : null).filter(i => i !== null);
        setJustRevealed(newIndices);
        setTimeout(() => setJustRevealed([]), 1200);
        return hint;
      });
    },
    'timer-update': ({ timeLeft }) => setTimeLeft(timeLeft),
    'round-end': ({ word, scores, guesses }) => {
      setPhase('round-end');
      setMaskedWord(word.split('').map(c => (c === ' ' ? ' ' : c)).join(' '));
      setMessages(msgs => [...msgs, { name: 'SYSTEM', message: `The word was: ${word}`, system: true }]);
      setDisabledGuess(true);
      setRoundScores(scores); // Store the scores from the event
    },
    'game-end': ({ leaderboard }) => {
      setPhase('ended');
      setLeaderboard(leaderboard);
      navigate(`/leaderboard/${roomCode}`);
    },
    'game:reset': () => {
      setPhase('waiting');
      setMaskedWord('');
      setDrawingData([]);
      setMessages([]);
      setDisabledGuess(false);
    },
    'room:update': (updatedRoom) => {
      setRoom(updatedRoom);
      setGameState(updatedRoom.gameState);
    },
    'host-changed': ({ newHostId }) => {
      setHostChangeMsg('Host left. New host assigned!');
      setShowHostChange(true);
      setTimeout(() => setShowHostChange(false), 3000);
    },
    'drawer-changed': ({ newDrawerId }) => {
      setDrawerChangeMsg('Drawer left. New drawer assigned!');
      setShowDrawerChange(true);
      setTimeout(() => setShowDrawerChange(false), 3000);
    },
    'round-restart': ({ drawerId }) => {
      // Optionally show a quick round restart notification
    },
    'room-closed': () => {
      setRedirectMsg('Room was closed by the host.');
      setTimeout(() => navigate('/'), 2000);
    },
    'kicked': () => {
      setRedirectMsg('You were kicked from the room.');
      setTimeout(() => navigate('/'), 2000);
    },
  });

  useEffect(() => {
    if (!room) navigate('/');
  }, [room, navigate]);

  // Word blanks for top bar
  const wordBlanks = (gameState?.hint || '').replace(/[a-zA-Z]/g, '_').replace(/ /g, ' ');

  // Debug logs for WordPopup logic (always runs, even if gameState is null)
  useEffect(() => {
    console.log('phase:', gameState?.phase, 'isDrawer:', isDrawer, 'wordChoices:', gameState?.wordChoices);
    console.log('Current userId:', user?.userId, 'Drawing playerId:', gameState?.drawingPlayerId);
  }, [gameState?.phase, isDrawer, gameState?.wordChoices, user?.userId, gameState?.drawingPlayerId]);

  // Only use gameState.wordChoices for the popup
  const shouldShowWordPopup =
    gameState &&
    gameState.phase === 'selecting-word' &&
    isDrawer &&
    Array.isArray(gameState.wordChoices) &&
    gameState.wordChoices.length > 0;

  // In handleWordSelect, do NOT set any local state for the popup
  const handleWordSelect = (word) => {
    socket.emit('word-select', { code: room.code, userId: user.userId, word });
    // Do NOT set any local state here!
  };

  // Animate newly revealed letters in the hint
  useEffect(() => {
    if (phase === 'drawing' && !isDrawer && maskedWord && prevHintRef.current) {
      const prev = prevHintRef.current.split('');
      const curr = maskedWord.split('');
      const newIndices = curr.map((c, i) => c !== '_' && prev[i] === '_' ? i : null).filter(i => i !== null);
      if (newIndices.length > 0) {
        setJustRevealed(newIndices);
        setTimeout(() => setJustRevealed([]), 3000);
      }
    }
    prevHintRef.current = maskedWord;
  }, [maskedWord, phase, isDrawer]);

  // Show round summary modal at round end
  useEffect(() => {
    if (phase === 'round-end' && gameState && gameState.guesses) {
      setRoundSummaryData({
        word: gameState.currentWord,
        guesses: gameState.guesses,
        players: room?.players || [],
        drawerId: gameState.drawingPlayerId,
      });
      setShowRoundSummary(true);
      // Auto-close after 1 second
      const t = setTimeout(() => setShowRoundSummary(false), 2000);
      return () => clearTimeout(t);
    }
  }, [phase, gameState, room]);

  // Also close summary if drawer changes
  useEffect(() => {
    if (phase !== 'round-end') setShowRoundSummary(false);
  }, [phase]);  

  // game over
  useEffect(() => {
    if (!socket) return;
    socket.on('game-over', ({ scores }) => {
      console.log('Game over received. Scores:', scores);
      navigate(`/leaderboard/${roomCode}`, { state: { scores } });
    });
    return () => { if (socket) socket.off('game-over'); };
  }, [socket, navigate, roomCode]);
  

  // Guard: Only render if user, room, and gameState are set
  if (!user || !room || !gameState) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
        <div className="spinner-border text-primary" role="status" />
        <div style={{ marginTop: 16 }}>Loading game...</div>
      </div>
    );
  }

  const handleSend = (msg) => {
    if (!msg || disabledGuess) return;
    if (!isDrawer) {
      socket.emit('guess', { code: room.code, userId: user.userId, guess: msg });
    }
  };

  const handleDraw = (line) => {
    // Real-time: add segment to tempStroke and drawingData
    setTempStroke(stroke => [...stroke, line]);
    setDrawingData(data => [...data, line]);
    socket.emit('draw-data', { code: room.code, data: line });
  };
  const handleStrokeEnd = (stroke) => {
    // Remove tempStroke segments from drawingData, then add the grouped stroke
    setDrawingData(data => {
      const withoutTemp = data.slice(0, -tempStroke.length);
      return [...withoutTemp, stroke];
    });
    setTempStroke([]);
    socket.emit('draw-data', { code: room.code, data: stroke });
  };

  // Save settings handler
  const handleSaveSettings = (newSettings) => {
    console.log('[GameRoomPage] handleSaveSettings called with:', newSettings);
    console.log('[GameRoomPage] Room code:', room?.code);
    console.log('[GameRoomPage] User is host:', isHost);
    
    // Emit to backend (add a new socket event 'room:updateSettings')
    socket.emit('room:updateSettings', { code: room.code, settings: newSettings }, (updatedRoom) => {
      console.log('[GameRoomPage] Settings save callback received:', updatedRoom);
      if (updatedRoom && !updatedRoom.error) {
        setRoom(updatedRoom);
        setShowSettings(false);
        setShowSettingsSaved(true); // Set state for success notification
        setTimeout(() => setShowSettingsSaved(false), 3000); // Hide after 3 seconds
        console.log('[GameRoomPage] Settings saved successfully');
      } else {
        console.error('[GameRoomPage] Settings save failed:', updatedRoom?.error);
      }
    });
  };

  // Leave/close room handlers
  const handleLeaveRoom = () => {
    socket.emit('room:leave', { code: room.code, userId: user.userId }, () => {
      navigate('/');
    });
  };
  const handleCloseRoom = () => {
    // For now, just leave for all (future: emit room-closed to all)
    socket.emit('room:leave', { code: room.code, userId: user.userId }, () => {
      socket.emit('room-closed', { code: room.code });
      navigate('/');
    });
  };

  // In the render:
  const mergedPlayers = mergeScores(room?.players || [], roundScores);

  // Use mergedPlayers for PlayerList and ScoreBoard
  return (
    <div className="container game-room-responsive" style={{ width: '100%', margin: 0, background: '#23272b', borderRadius: 0, padding: 0, boxShadow: 'none', position: 'relative', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Centered SketchIt title with purple paint brush */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: 2, color: '#a777e3', display: 'flex', alignItems: 'center', gap: 10 }}>
          🎨 SketchIt 🖌️
        </span>
      </div>
      <TopBar
        round={gameState?.round || 1}
        maxRounds={room?.settings?.maxRounds || 3}
        timeLeft={timeLeft}
        onSettings={() => setShowSettings(true)}
        phase={phase}
        isDrawer={isDrawer}
        isHost={isHost}
        onLeave={() => setShowLeaveModal(true)}
        onClose={() => setShowLeaveModal(true)}
        selectedWordOrBlanks={
          phase === 'drawing' && isDrawer ? (
            <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 'bold', color: '#a7bfff', textAlign: 'center', whiteSpace: 'nowrap' }}>{gameState.currentWord}</div>
          ) : phase === 'drawing' && !isDrawer ? (
            <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 'bold', color: '#fff', textAlign: 'center', whiteSpace: 'nowrap' }}>
              {maskedWord.split('').map((c, i) => (
                <span
                  key={i}
                  className={justRevealed.includes(i) && c !== '_' ? 'reveal-anim' : ''}
                  style={{
                    color: justRevealed.includes(i) && c !== '_' ? '#ff0' : '#fff',
                    transition: 'color 0.3s',
                    width: c === ' ' ? 16 : 24,
                    display: 'inline-block',
                    textAlign: 'center',
                    opacity: justRevealed.includes(i) && c !== '_' ? 0.2 : 1,
                    animation: justRevealed.includes(i) && c !== '_' ? 'fadeInLetter 1s forwards' : 'none',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          ) : null
        }
        isMicOn={isMicOn}
        onToggleMic={() => setIsMicOn(m => !m)}
        isHostUser={isHostUser}
        onGlobalMute={() => {
          socket.emit('global-mute', { code: roomCode, muted: !globalMuted });
          setGlobalMuted(m => !m);
        }}
        globalMuted={globalMuted}
      />
      {/* Leave/Close Room Modal */}
      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title={isHost ? 'Close Room' : 'Leave Room'}>
        <div style={{ marginBottom: 16 }}>
          {isHost
            ? 'Are you sure you want to close the room for everyone?'
            : 'Are you sure you want to leave the room?'}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
          {isHost
            ? <button className="btn btn-danger" onClick={handleCloseRoom}>Close Room</button>
            : <button className="btn btn-danger" onClick={handleLeaveRoom}>Leave Room</button>}
        </div>
      </Modal>
      {/* Settings Modal (view only for all users) */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Room Settings">
        <SettingsPanel settings={room?.settings || {}} isHost={false} viewOnly={true} showAsModal={false} />
      </Modal>
      {/* Main Responsive Flex Row */}
      <div style={{ display: 'flex', gap: 16, padding: '0 16px', alignItems: 'flex-start', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        {/* Left: Players/Scores */}
        <div style={{ flex: '1 1 0', minWidth: 160, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 420, background: '#222', borderRadius: 16, boxShadow: '0 2px 16px #0006', padding: '10px 0', justifyContent: 'flex-start', boxSizing: 'border-box' }}>
          <PlayerList
            players={mergedPlayers.map(p => ({ ...p, isMicOn: micStatus[p.userId] }))}
            speakingUserIds={Object.entries(speakingUsers).filter(([_, v]) => v).map(([k]) => k)}
            hostId={room?.players?.find(p => p.isHost)?.userId}
            drawerId={gameState?.drawingPlayerId}
            myUserId={user?.userId}
            onMute={() => {}}
            onKick={() => {}}
          />
        </div>
        {/* Center: Canvas */}
        <div style={{ flex: '2 1 0', minWidth: 0, maxWidth: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 0, margin: '0 6px', background: '#181a1d', borderRadius: 18, boxShadow: '0 2px 24px #0008', padding: '10px 0', gap: 20, justifyContent: 'center', boxSizing: 'border-box' }}>
          {/* Always reserve space for the canvas/overlay to prevent layout jump */}
          {/* TODO: For canvas precision, ensure Canvas uses ref/clientWidth/clientHeight for drawing calculations */}
          <div style={{ width: '100%', maxWidth: 700, aspectRatio: '6/5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Show WordPopup as overlay over drawing section during word selection */}
            {shouldShowWordPopup && isDrawer ? (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                <WordPopup words={gameState.wordChoices} onSelect={handleWordSelect} />
              </div>
            ) : null}
            {/* Only show the canvas during drawing phase and when not selecting word */}
            {phase === 'drawing' && !shouldShowWordPopup && (
              <Canvas
                isDrawing={isDrawer && phase === 'drawing'}
                onDraw={handleDraw}
                onStrokeEnd={handleStrokeEnd}
                drawingData={drawingData}
                disabled={!(isDrawer && phase === 'drawing')}
                color={color}
                width={width}
                tool={tool}
                isEraser={isEraser}
                setColor={setColor}
                setWidth={setWidth}
                setTool={setTool}
                setIsEraser={setIsEraser}
                onUndo={handleUndo}
                onRedo={handleRedo}
                renderControls={false}
              />
            )}
          </div>
          {/* Drawing tools below the canvas for the drawer */}
          {phase === 'drawing' && !shouldShowWordPopup && isDrawer && (
            <CanvasControls
              color={color}
              setColor={setColor}
              width={width}
              setWidth={setWidth}
              tool={tool}
              setTool={setTool}
              isEraser={isEraser}
              setIsEraser={setIsEraser}
              disabled={!(isDrawer && phase === 'drawing')}
              onUndo={handleUndo}
              canUndo={localStack.length > 0}
            />
          )}
          {/* Animated round summary modal */}
          <Modal open={showRoundSummary} onClose={() => setShowRoundSummary(false)} title="Score Table">
            {roundSummaryData && (
              <>
                {console.log('Round summary guesses:', roundSummaryData.guesses)}
                <div className="animate__animated animate__fadeInDown" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>
                    The word was: <span style={{ fontWeight: 'bold', color: '#0af' }}>{roundSummaryData.word}</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Guesses:</strong>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {/* Show guessers */}
                      {roundSummaryData.players.filter(p => p.userId !== roundSummaryData.drawerId).map(p => {
                        const playerGuesses = roundSummaryData.guesses.filter(g => g.userId === p.userId);
                        const correctGuess = playerGuesses.find(g => g.correct);
                        const guess = correctGuess || (playerGuesses.length > 0 ? playerGuesses[playerGuesses.length - 1] : undefined);
                        const roundScore = guess && guess.correct ? guess.score : 0;
                        return (
                          <li key={p.userId} style={{ background: '#23272b', borderRadius: 6, margin: '4px 0', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {p.avatar && p.avatar.emoji ? <span style={{ fontSize: 20 }}>{p.avatar.emoji}</span> : null}
                              {p.name}
                            </span>
                            <span>{guess ? guess.guess : <em style={{ color: '#aaa', fontWeight: 400 }}>No guess</em>}</span>
                            <span style={{ color: roundScore > 0 ? '#1aff7c' : '#ff4d4f', minWidth: 36, textAlign: 'right' }}>{roundScore > 0 ? `+${roundScore}` : '0'}</span>
                          </li>
                        );
                      })}
                      {/* Show drawer's score for the round */}
                      {(() => {
                        const drawer = roundSummaryData.players.find(p => p.userId === roundSummaryData.drawerId);
                        // Drawer gets 50 points per correct guesser
                        const correctGuessers = roundSummaryData.guesses.filter(g => g.correct);
                        const drawerRoundScore = correctGuessers.length * 50;
                        return (
                          <li key={drawer.userId} style={{ background: '#23272b', borderRadius: 6, margin: '4px 0', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {drawer.avatar && drawer.avatar.emoji ? <span style={{ fontSize: 20 }}>{drawer.avatar.emoji}</span> : null}
                              {drawer.name} <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 4 }}>(Drawer)</span>
                            </span>
                            <span><em style={{ color: '#aaa', fontWeight: 400 }}>—</em></span>
                            <span style={{ color: drawerRoundScore > 0 ? '#1aff7c' : '#ff4d4f', minWidth: 36, textAlign: 'right' }}>{drawerRoundScore > 0 ? `+${drawerRoundScore}` : '0'}</span>
                          </li>
                        );
                      })()}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </Modal>
        </div>
        {/* Right: Chat */}
        <div style={{ flex: '1 1 0', minWidth: 220, maxWidth: 440, display: 'flex', flexDirection: 'column', minHeight: 420, height: '100%', background: '#23272b', borderRadius: 16, boxShadow: '0 2px 16px #0006', padding: '0', justifyContent: 'flex-end', alignSelf: 'stretch', boxSizing: 'border-box' }}>
          {/* Messages area */}
          <div style={{ flex: '1 1 0', maxHeight: 320, overflowY: 'auto', padding: '12px 10px 0 10px', marginBottom: 0 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  background: msg.system ? 'transparent' : msg.correct ? 'rgba(26,255,124,0.08)' : 'rgba(255,255,255,0.03)',
                  color: msg.system ? '#a7a7b3' : msg.correct ? '#1aff7c' : '#f3f3fa',
                  fontWeight: msg.system ? 500 : 600,
                  fontSize: 15,
                  marginBottom: 6,
                  borderRadius: 8,
                  padding: msg.system ? '2px 0' : '7px 12px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  boxShadow: msg.correct ? '0 0 6px #1aff7c33' : 'none',
                  border: msg.correct ? '1px solid #1aff7c55' : 'none',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: msg.system ? 'default' : 'pointer',
                  position: 'relative',
                  flexWrap: 'wrap',
                }}
                onMouseOver={e => { if (!msg.system) e.currentTarget.style.background = 'rgba(167,123,255,0.10)'; }}
                onMouseOut={e => { if (!msg.system) e.currentTarget.style.background = msg.correct ? 'rgba(26,255,124,0.08)' : 'rgba(255,255,255,0.03)'; }}
              >
                {!msg.system && (
                  <span style={{ fontWeight: 700, color: '#a7bfff', marginRight: 6 }}>{msg.name}:</span>
                )}
                {msg.correct && !msg.system ? (
                  <span style={{ fontWeight: 500 }}>
                    guessed the correct word!
                  </span>
                ) : (
                  <span style={{ fontWeight: 500 }}>{msg.message}</span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input row */}
          <div style={{
            width: '100%',
            maxWidth: '100%',
            background: '#23272b',
            borderTop: '1px solid #353a40',
            padding: '10px',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
            gap: 0,
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (
                  e.key === 'Enter' &&
                  !isDrawer &&
                  !disabledGuess &&
                  phase === 'drawing' &&
                  input.trim()
                ) {
                  handleSend(input.trim());
                  setInput('');
                }
              }}
              disabled={isDrawer || disabledGuess || phase !== 'drawing'}
              placeholder={isDrawer || disabledGuess || phase !== 'drawing' ? 'Muted...' : 'Type your guess here...'}
              style={{
                flex: 1,
                borderRadius: 6,
                border: '1px solid #444',
                outline: 'none',
                padding: '12px 14px',
                background: '#181a1d',
                color: '#f3f3fa',
                fontSize: 15,
                boxShadow: 'none',
                height: 40,
                marginRight: 8,
                transition: 'border 0.2s',
                minWidth: 0,
                maxWidth: '100%',
              }}
            />
            <button
              onClick={() => { if (!isDrawer && !disabledGuess && phase === 'drawing' && input.trim()) { handleSend(input.trim()); setInput(''); } }}
              disabled={isDrawer || disabledGuess || phase !== 'drawing' || !input.trim()}
              style={{
                borderRadius: 6,
                background: '#6e44ff',
                color: '#fff',
                border: 'none',
                padding: '0 22px',
                height: 40,
                fontSize: 15,
                fontWeight: 600,
                cursor: isDrawer || disabledGuess || phase !== 'drawing' || !input.trim() ? 'not-allowed' : 'pointer',
                boxShadow: 'none',
                transition: 'background 0.2s',
                flex: 'none',
                whiteSpace: 'nowrap',
                minWidth: 0,
                maxWidth: 120,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasControls({ color, setColor, width, setWidth, tool, setTool, isEraser, setIsEraser, disabled, onUndo, canUndo }) {
  const COLORS = [
    '#7c2323', '#000', '#fff', '#e53935', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#00bcd4', '#ff9800', '#795548', '#c0c0c0'
  ];
  const SIZES = [2, 4, 8, 16];
  return (
    <div style={{
      background: 'linear-gradient(135deg, #23272b 60%, #3a3f5a 100%)',
      borderRadius: 14,
      boxShadow: '0 2px 16px #0006',
      padding: '12px 18px',
      marginBottom: 18,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      minWidth: 320,
      maxWidth: 700,
      width: '100%',
    }}>
      {/* Color buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <button
            key={c}
            className="btn btn-sm"
            style={{ background: c, border: color === c ? '2px solid #a7bfff' : '2px solid #fff', width: 24, height: 24, margin: 0, padding: 0, borderRadius: 4, boxShadow: color === c ? '0 0 6px #a7bfff' : 'none' }}
            onClick={() => { setColor(c); setTool('pen'); setIsEraser(false); }}
            disabled={disabled}
          />
        ))}
      </div>
      {/* Tool buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button className={`btn btn-sm ${tool === 'pen' ? 'btn-primary' : ''}`} style={{ background: tool === 'pen' ? '#b39ddb' : '#fff', border: '1px solid #888' }} onClick={() => { setTool('pen'); setIsEraser(false); }} disabled={disabled} title="Pen">✏️</button>
        <button className={`btn btn-sm ${tool === 'eraser' ? 'btn-warning' : ''}`} onClick={() => { setTool('eraser'); setIsEraser(true); }} disabled={disabled} title="Eraser">🧽</button>
        <button className={`btn btn-sm ${tool === 'fill' ? 'btn-info' : ''}`} onClick={() => { setTool('fill'); setIsEraser(false); }} disabled={disabled} title="Fill">🪣</button>
        <button className="btn btn-sm btn-light" onClick={onUndo} disabled={disabled || !canUndo} title="Undo" style={{ opacity: (disabled || !canUndo) ? 0.5 : 1, background: (disabled || !canUndo) ? '#444' : '#fff', color: '#23272b', fontWeight: 700, border: '1px solid #888' }}>↩️</button>
      </div>
      {/* Size buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {SIZES.map(s => (
          <button
            key={s}
            className="btn btn-sm btn-light"
            style={{ width: 28, height: 28, border: width === s ? '2px solid #a7bfff' : '1px solid #888', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: width === s ? '0 0 6px #a7bfff' : 'none' }}
            onClick={() => setWidth(s)}
            disabled={disabled}
          >
            <span style={{ display: 'inline-block', background: '#222', borderRadius: '50%', width: s, height: s }} />
          </button>
        ))}
      </div>
    </div>
  );
}