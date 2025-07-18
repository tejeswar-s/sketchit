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
import DrawerBanner from '../components/DrawerBanner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

function TopBar({ round, maxRounds, timeLeft, onLeave, selectedWordOrBlanks, leaveBtnStyle }) {
  return (
    <div className="topbar-responsive" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#1a2a3a',
      width: window.innerWidth <= 400 ? '100vw' : '100%',
      maxWidth: window.innerWidth <= 400 ? '100vw' : '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      borderRadius: window.innerWidth <= 400 ? 12 : 0,
      padding: window.innerWidth <= 400 ? '2px 0px' : '8px 16px',
      marginBottom: 8,
      minHeight: 0,
      height: 'auto',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      color: '#fff',
      boxShadow: '0 2px 16px #232c5b22',
      flexWrap: 'nowrap',
      gap: window.innerWidth <= 400 ? 0 : '6px',
    }}>
      {/* Left: Timer + Round */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: window.innerWidth <= 400 ? 4 : 10,
        flexWrap: 'nowrap',
        fontWeight: 700,
        minWidth: 0,
        flexShrink: 1,
        overflowX: 'hidden',
      }}>
        <span className="topbar-timer" style={{
          background: '#fff',
          color: '#222',
          borderRadius: '50%',
          width: window.innerWidth <= 400 ? 22 : 40,
          height: window.innerWidth <= 400 ? 22 : 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: window.innerWidth <= 400 ? 13 : 22,
          minWidth: 0,
          flexShrink: 1,
          overflowX: 'hidden',
        }}>{timeLeft}</span>
        <span className="topbar-round" style={{ fontSize: window.innerWidth <= 400 ? 10 : 18, minWidth: 0, flexShrink: 1, overflowX: 'hidden' }}>
          Round {round} of {maxRounds}
        </span>
      </div>
      {/* Center: Word or Blanks */}
      <div style={{
        flex: 1,
        textAlign: 'center',
        fontWeight: 700,
        fontSize: window.innerWidth <= 400 ? 12 : 32, // Much larger for desktop
        letterSpacing: 1,
        color: '#a7bfff',
        fontFamily: 'inherit',
        minWidth: 0,
        flexShrink: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
          {selectedWordOrBlanks}
      </div>
      {/* Right: Leave Button ONLY, nothing else */}
      <div className="topbar-actions" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 0,
        flexShrink: 1,
        overflowX: 'hidden',
        height: window.innerWidth <= 400 ? 21 : 'auto',
      }}>
        <button className="btn btn-outline-danger btn-sm"
          onClick={onLeave}
          style={{
            fontWeight: 700,
            fontSize: window.innerWidth <= 400 ? '0.6rem' : 14,
            borderRadius: 6,
            padding: window.innerWidth <= 400 ? '1px 3px' : '10px 32px',
            height: window.innerWidth <= 400 ? 16 : 40,
            minHeight: window.innerWidth <= 400 ? 16 : 40,
            minWidth: window.innerWidth <= 400 ? 0 : 180,
            maxWidth: window.innerWidth <= 400 ? 36 : 220,
            width: window.innerWidth <= 400 ? 36 : 200,
            boxSizing: 'border-box',
            margin: 0,
            overflowX: 'hidden',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Leave Room
        </button>
      </div>
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
  const [showRoundRestart, setShowRoundRestart] = useState(false);
  const [roundRestartMsg, setRoundRestartMsg] = useState('');
  // Drawing tool state (hoisted from Canvas)
  const [color, setColor] = useState('#fff'); // default to white
  const [width, setWidth] = useState(4);
  const [tool, setTool] = useState('pen'); // default to pen
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
  // Remove mic/voice state: isMicOn, setIsMicOn, micStatus, globalMuted
  // Remove useVoiceChat, speakingUsers, onToggleMic, onMute, and related socket logic
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [waitingMsg, setWaitingMsg] = useState('');
  const [wordSelectTimer, setWordSelectTimer] = useState(10);

  // Derived variables - must be defined before hooks that use them
  const isDrawer = gameState && user ? gameState.drawingPlayerId === user.userId : false;
  const isMuted = room && user ? room.players.find(p => p.userId === user.userId)?.isMuted : false;
  const isHost = room && user ? room.players.find(p => p.userId === user.userId)?.isHost : false;
  const isHostUser = !!room?.players?.find(p => p.userId === user?.userId && p.isHost);
  const isPending = room && user ? room.players.find(p => p.userId === user.userId)?.pending : false;

  // Remove useVoiceChat hook
  // Remove mic/voice related useEffects

  // Undo last action
  const handleUndo = () => {
    if (isDrawer && drawingData.length > 0) {
      // Find the last index of a stroke or fill
      let idx = drawingData.length - 1;
      while (idx >= 0 && !drawingData[idx].type) idx--;
      if (idx < 0) return; // No stroke/fill found
      const newData = drawingData.slice(0, idx);
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

  // Derived variables (already defined above)

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
    'guess-result': ({ userId, guess, correct, isClose, score, showCloseToUser }) => {
      const playerName = room?.players.find(p => p.userId === userId)?.name || 'Player';
      const isMyGuess = userId === user.userId;
      
      // Show close status only to the user who made the guess
      const showClose = isMyGuess && isClose && !correct;
      
      setMessages(msgs => [...msgs, { 
        name: playerName, 
        message: guess, 
        correct,
        isClose: showClose // Only show close status to the guesser
      }]);
      
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
      setRoundRestartMsg('Round restarted. New drawer selected.');
      setShowRoundRestart(true);
      setTimeout(() => setShowRoundRestart(false), 3000);
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
  const isSelectingWord =
    gameState &&
    gameState.phase === 'selecting-word' &&
    Array.isArray(gameState.wordChoices) &&
    gameState.wordChoices.length > 0;

  const shouldShowWordPopup = isSelectingWord && isDrawer;
  const shouldShowWaitingForDrawer = isSelectingWord && !isDrawer;

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
      // Auto-close after 2 seconds
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
  
  // Listen for round-start to start the word select timer
  useEffect(() => {
    if (phase === 'selecting-word') {
      setWordSelectTimer(10);
      const interval = setInterval(() => {
        setWordSelectTimer(t => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Show a message if the user is pending (joining next round)
  if (isPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'rgba(24,26,27,0.98)' }}>
        <div style={{ background: '#23272b', color: '#a777e3', borderRadius: 16, padding: '32px 48px', fontSize: 28, fontWeight: 700, boxShadow: '0 2px 16px #6e44ff22', marginBottom: 16 }}>
          You'll join next round!
        </div>
        <div style={{ color: '#fff', fontSize: 18, opacity: 0.7 }}>Please wait for the current round to finish.</div>
      </div>
    );
  }

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

  // Ensure handleDraw does not push to drawingData, only for real-time updates
  const handleDraw = (line) => {
    if (line.type === 'fill') {
      // Add fill to drawingData as a grouped object
      const newData = [...drawingData, line];
      setDrawingData(newData);
      socket.emit('draw-data', { code: room.code, data: { type: 'set', stack: newData } });
    } else {
      // Only add to tempStroke for pen/eraser
      setTempStroke(stroke => [...stroke, line]);
      socket.emit('draw-data', { code: room.code, data: line });
    }
  };
  // Replace handleStrokeEnd implementation
  const handleStrokeEnd = (stroke) => {
    // stroke should be { type: 'stroke', lines: [...] }
    if (!stroke || !stroke.lines || stroke.lines.length === 0) return;
    const newData = [...drawingData, { type: 'stroke', lines: stroke.lines }];
    setDrawingData(newData);
    setTempStroke([]); // Clear tempStroke after stroke ends
    socket.emit('draw-data', { code: room.code, data: { type: 'set', stack: newData } });
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
        toast.success('Settings saved successfully!');
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
    <div style={{ background: '#23272b', minHeight: '100vh' }}>
      {/* --- Heading Bar --- */}
      <div className="game-header-row" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center everything horizontally
        width: '100%',
        marginBottom: 8,
        gap: 0,
        position: 'relative',
        background: 'linear-gradient(90deg, #a777e3 0%, #6e44ff 100%)',
        padding: window.innerWidth <= 400 ? '2px 4px' : '12px 32px',
        height: window.innerWidth <= 400 ? 38 : 72,
        minHeight: 0,
        boxSizing: 'border-box',
      }}>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', fontSize: window.innerWidth <= 400 ? 22 : 32, color: '#23272b', cursor: 'pointer', borderRadius: 8, marginRight: 0, flex: '0 0 54px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 12, position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} title="Settings">
          <svg width={window.innerWidth <= 400 ? 22 : 32} height={window.innerWidth <= 400 ? 22 : 32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <circle cx="16" cy="16" r="4" fill="#fff"/>
              <path d="M28 18.1v-4.2l-3.1-.5c-.2-.7-.4-1.3-.7-1.9l1.8-2.6-3-3-2.6 1.8c-.6-.3-1.2-.5-1.9-.7l-.5-3.1h-4.2l-.5 3.1c-.7.2-1.3.4-1.9.7L7.6 5.9l-3 3 1.8 2.6c-.3.6-.5 1.2-.7 1.9l-3.1.5v4.2l3.1.5c.2.7.4 1.3.7 1.9l-1.8 2.6 3 3 2.6-1.8c.6.3 1.2.5 1.9.7l.5 3.1h4.2l.5-3.1c.7-.2 1.3-.4 1.9-.7l2.6 1.8 3-3-1.8-2.6c.3-.6.5-1.2.7-1.9l3.1-.5zM16 21a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="#183153"/>
            </g>
          </svg>
        </button>
        <div style={{
          flex: 1,
          textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        }}>
          <span className="homepage-title" style={{
            fontSize: window.innerWidth <= 400 ? '1.2rem' : '3.2rem', // Larger for desktop
            fontWeight: 900,
            letterSpacing: 2,
            color: '#fff',
            textShadow: '0 2px 8px #6e44ff33',
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
            margin: 0,
        padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
      }}>
          🎨 SketchIt 🖌️
        </span>
        </div>
        {(
          <button
            onClick={isHost ? handleCloseRoom : undefined}
            className="close-room-btn"
            style={{
              background: '#e53935',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: window.innerWidth <= 400 ? '0.65rem' : '0.9rem',
              padding: window.innerWidth <= 400 ? '2px 6px' : '10px 32px',
              minWidth: window.innerWidth <= 400 ? 'auto' : 180,
              width: window.innerWidth <= 400 ? 'fit-content' : 200,
              maxWidth: window.innerWidth <= 400 ? '100px' : 220,
              height: window.innerWidth <= 400 ? '22px' : '40px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px #e5393533',
              flex: '0 0 130px',
              paddingRight: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              right: window.innerWidth <= 400 ? '2vw' : 16,
              top: '50%',
              transform: 'translateY(-50%)',
              visibility: isHost ? 'visible' : 'hidden',
              pointerEvents: isHost ? 'auto' : 'none',
            }}
            disabled={!isHost}
          >
            Close Room
          </button>
        )}
      </div>
      {/* --- Sub-Heading Bar (TopBar) --- */}
      <TopBar
        round={gameState?.round || 1}
        maxRounds={gameState?.maxRounds || 1}
        timeLeft={timeLeft}
        onLeave={handleLeaveRoom}
        selectedWordOrBlanks={isDrawer ? (gameState?.currentWord || '') : (maskedWord || wordBlanks)}
        leaveBtnStyle={window.innerWidth <= 400 ? {
          fontSize: '0.7rem',
          padding: '2px 6px',
          height: '22px',
          minWidth: 0,
          maxWidth: '70px',
          borderRadius: 6,
        } : { fontSize: '2.2rem', fontWeight: 800 }}
      />
      <style>{`
@media (max-width: 400px) {
  body, html {
    overflow-x: hidden !important;
  }
  .game-header-row {
    height: 38px !important;
    padding: 1px 4px !important;
    gap: 4px !important;
  }
  .homepage-title {
    font-size: 1.1rem !important;
    text-align: center !important;
    flex: 1 1 0 !important;
    margin: 0 !important;
    letter-spacing: 0.5px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    padding: 0 !important;
  }
  .close-room-btn {
    font-size: 0.7rem !important;
    padding: 2px 8px !important;
    max-height: 22px !important;
    border-radius: 6px !important;
    min-width: 0 !important;
    width: auto !important;
    max-width: none !important;
    flex: none !important;
    align-self: center !important;
    margin-left: 4px !important;
    margin-right: 2px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
  }
  .topbar-responsive {
    height: 38px !important;
    padding: 4px 2px !important;
    border-radius: 8px !important;
    align-items: center !important;
    gap: 0 !important;
    font-size: 0.8rem !important;
    flex-wrap: nowrap !important;
    overflow-x: hidden !important;
    overflow-y: hidden !important;
    white-space: nowrap !important;
    box-sizing: border-box !important;
  }
  .topbar-timer {
    font-size: 0.9rem !important;
    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
    min-height: 22px !important;
    margin-right: 4px !important;
    border-radius: 50% !important;
    background: #fff !important;
    color: #232c5b !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 700 !important;
    box-shadow: 0 1px 4px #232c5b22 !important;
  }
  .topbar-round {
    font-size: 0.7rem !important;
    font-weight: 700 !important;
    margin-right: 2px !important;
    white-space: nowrap !important;
  }
  .topbar-word {
    font-size: 0.7rem !important;
    letter-spacing: 1px !important;
    font-weight: 800 !important;
    color: #a7bfff !important;
    text-shadow: 0 1px 4px #232c5b44 !important;
    text-align: center !important;
    flex: 1 1 0 !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    margin: 0 2px !important;
  }
  .topbar-actions {
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
    min-width: 0 !important;
    margin-left: 0 !important;
    height: 100% !important;
    overflow: hidden !important;
  }
  .topbar-actions button, .topbar-actions .btn {
    height: 19px !important;
    font-size: 0.75rem !important;
    padding: 2px 5px !important;
    border-radius: 6px !important;
    min-width: 38px !important;
    max-width: 70px !important;
    box-sizing: border-box !important;
    margin: 0 !important;
  }
  .game-room-bottom-row {
    flex-direction: row !important;
    display: flex !important;
    width: 100% !important;
    gap: 8px !important;
  }
  .game-room-left, .game-room-right {
    width: 47.5% !important;
    min-width: 0 !important;
    max-width: 47.5% !important;
    flex: 1 1 47.5% !important;
    box-sizing: border-box !important;
    font-size: 0.68rem !important;
    line-height: 1.1rem !important;
    padding: 2px 2px 2px 2px !important;
    margin: 0 !important;
  }
  .game-room-left {
    padding: 2px 2px 2px 2px !important;
    margin: 0 !important;
  }
  .game-room-right {
    padding: 2px 2px 2px 2px !important;
    margin: 0 !important;
    font-size: 0.6rem !important;
    border-radius: 10px !important;
  }
  .game-room-left h4,
  .game-room-right h4 {
    font-size: 0.75rem !important;
    margin-bottom: 6px !important;
  }
  .game-room-left li,
  .game-room-right li,
  .game-room-right p,
  .game-room-right span {
    font-size: 0.65rem !important;
  }
  .game-room-right .chat-message,
  .game-room-right .chat-input,
  .game-room-right input[type="text"],
  .game-room-right button {
    font-size: 0.6rem !important;
    height: 18px !important;
    padding: 2px 4px !important;
    margin: 0 !important;
    border-radius: 4px !important;
  }
  .game-room-right > div:last-child {
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    height: 22px !important;
  }
  .game-room-right > div:last-child input[type="text"] {
    width: 65% !important;
    min-width: 0 !important;
    max-width: 65% !important;
    flex: 0 1 65% !important;
    height: 18px !important;
    padding: 2px 4px !important;
    font-size: 0.6rem !important;
    border-radius: 4px !important;
    margin: 0 !important;
  }
  .game-room-right > div:last-child button {
    width: 35% !important;
    min-width: 0 !important;
    max-width: 35% !important;
    flex: 0 1 35% !important;
    margin-left: 2px !important;
    height: 18px !important;
    padding: 2px 4px !important;
    font-size: 0.6rem !important;
    border-radius: 4px !important;
  }
  .chat-message {
    font-size: 0.65rem !important;
    padding: 3px 6px !important;
  }
  .chat-input,
  .chat-input input,
  .chat-input button {
    font-size: 0.65rem !important;
    height: 26px !important;
  }
  /* Drawing tool section (CanvasControls) tweaks for 400px */
  .canvas-controls {
    min-width: 0 !important;
    max-width: 100vw !important;
    width: 100vw !important;
    height: 40px !important;
    min-height: 40px !important;
    padding: 1px 0 !important;
    margin-top: 2px !important;
    margin-bottom: 8px !important;
    border-radius: 8px !important;
    gap: 1px !important;
  }
  .canvas-controls > div {
    gap: 1px !important;
    padding: 0 !important;
  }
  .canvas-controls button, .canvas-controls .btn, .canvas-controls .btn-sm {
    width: 13px !important;
    height: 13px !important;
    min-width: 10px !important;
    min-height: 10px !important;
    max-width: 16px !important;
    max-height: 16px !important;
    font-size: 0.6rem !important;
    border-radius: 3px !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
  }
  .canvas-controls span[style*='inline-block'] {
    width: 7px !important;
    height: 7px !important;
    min-width: 7px !important;
    min-height: 7px !important;
    max-width: 9px !important;
    max-height: 9px !important;
  }
  /* Chat input row: input 65%, button 35% */
  .game-room-right > div:last-child {
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
  }
  .game-room-right > div:last-child input[type="text"] {
    width: 65% !important;
    min-width: 0 !important;
    max-width: 65% !important;
    flex: 0 1 65% !important;
  }
  .game-room-right > div:last-child button {
    width: 35% !important;
    min-width: 0 !important;
    max-width: 35% !important;
    flex: 0 1 35% !important;
    margin-left: 2px !important;
  }
}
@media (max-width: 600px) {
  .topbar-responsive {
    font-size: 9px !important;
    height: 24px !important;
    min-height: 0 !important;
    padding: 1px 1px !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100vw !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    gap: 0 !important;
  }
  .topbar-timer {
    font-size: 8px !important;
    width: 12px !important;
    height: 12px !important;
    margin-right: 1px !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
  }
  .topbar-round {
    font-size: 8px !important;
    flex-shrink: 1 !important;
    min-width: 0 !important;
    margin-right: 1px !important;
  }
  .topbar-word {
    font-size: 8px !important;
    letter-spacing: 0.5px !important;
    flex: 1 1 0 !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    text-align: center !important;
    margin: 0 1px !important;
  }
  .topbar-actions {
    gap: 1px !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
    margin-left: 1px !important;
  }
  .topbar-actions button, .topbar-actions svg {
    font-size: 8px !important;
    min-width: 8px !important;
    padding: 0 2px !important;
  }
  .btn, .form-control, input, button {
    font-size: 1.08rem !important;
    padding: 14px 0 !important;
    /* min-height: 48px !important; */
    width: 95% !important;
    border-radius: 10px !important;
  }
}
@media (max-width: 900px) {
  .game-room-flex-row { display: none !important; }
  .game-room-flex-responsive { display: flex !important; }
  .topbar-responsive {
    font-size: 12px !important;
    height: 38px !important;
    min-height: 0 !important;
    padding: 4px 4px !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 97vw !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    gap: 0 !important;
  }
  .topbar-timer {
    font-size: 12px !important;
    width: 18px !important;
    height: 18px !important;
    margin-right: 3px !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
  }
  .topbar-round {
    font-size: 10px !important;
    flex-shrink: 1 !important;
    min-width: 0 !important;
    margin-right: 2px !important;
  }
  .topbar-word {
    font-size: 13px !important;
    letter-spacing: 1px !important;
    flex: 1 1 0 !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    text-align: center !important;
    margin: 0 2px !important;
  }
  .topbar-actions {
    gap: 2px !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
    margin-left: 2px !important;
  }
  .topbar-actions button, .topbar-actions svg {
    font-size: 12px !important;
    min-width: 14px !important;
    padding: 1px 3px !important;
  }
  @media (min-width: 900px) {
  .topbar-actions button, .topbar-actions .btn {
    height: 30px !important;
    font-size: 14px !important;
    padding: 6px 8px !important;
    border-radius: 8px !important;
    min-width: 54px !important;
    max-width: 100px !important;
  }
}
@media (max-width: 400px) {
  .topbar-actions button, .topbar-actions .btn {
    height: 21px !important;
    font-size: 0.75rem !important;
    padding: 3px 6px !important;
    border-radius: 6px !important;
    min-width: 44px !important;
    max-width: 80px !important;
  }
}
}
@media (min-width: 768px) {
  .topbar-responsive {
    justify-content: center !important;
    gap: 24px !important;
  }
  .topbar-word {
    order: 2 !important;
    font-size: 1.5rem !important;
    text-align: center !important;
    flex: 1 !important;
  }
  .topbar-round {
    order: 1 !important;
  }
  .topbar-actions {
    order: 3 !important;
  }
}
@media (max-width: 400px) {
  // ... existing code ...
  .word-popup-responsive,
  .modal-content, /* for round summary popup */
  .modal-dialog {
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    left: 0 !important;
    right: 0 !important;
    margin: 0 auto !important;
    border-radius: 8px !important;
    padding: 8px 4px !important;
    font-size: 0.9rem !important;
  }
  .word-popup-responsive {
    padding: 8px 4px !important;
    font-size: 0.9rem !important;
    border-radius: 8px !important;
    max-width: 100vw !important;
    min-width: 0 !important;
  }
  .modal-content, .modal-dialog {
    padding: 8px 4px !important;
    font-size: 0.9rem !important;
    border-radius: 8px !important;
    max-width: 100vw !important;
    min-width: 0 !important;
  }
  .game-room-left {
    background: transparent !important;
    position: static !important;
    z-index: auto !important;
    width: 47.5% !important;
    max-width: 47.5% !important;
    min-width: 0 !important;
    flex: 1 1 47.5% !important;
    box-sizing: border-box !important;
  }
  .game-room-right {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-end !important;
    height: 180px !important;
    min-height: 120px !important;
    background: #23272b !important;
    border-radius: 10px !important;
    overflow: hidden !important;
  }
  .chat-message-area {
    flex: 1 1 auto !important;
    overflow-y: auto !important;
    padding: 4px 2px 0 2px !important;
    margin-bottom: 0 !important;
    background: transparent !important;
    border-radius: 0 !important;
    min-height: 40px !important;
    max-height: calc(100% - 28px) !important;
    box-sizing: border-box !important;
  }
  .game-room-right > div:last-child {
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    background: #23272b !important;
    border-top: 1px solid #353a40 !important;
    padding: 4px 2px !important;
    margin: 0 !important;
    z-index: 3 !important;
    display: flex !important;
    align-items: center !important;
    gap: 0 !important;
    border-radius: 0 0 10px 10px !important;
    height: 28px !important;
    box-sizing: border-box !important;
  }
  .game-room-right > div:last-child input[type="text"] {
    height: 20px !important;
    padding: 2px 4px !important;
    font-size: 0.6rem !important;
    border-radius: 4px !important;
    margin: 0 !important;
  }
  .game-room-right > div:last-child button {
    height: 20px !important;
    padding: 2px 8px !important;
    font-size: 0.6rem !important;
    border-radius: 4px !important;
    margin-left: 2px !important;
  }
  .player-list-container {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 4px 2px !important;
    border-radius: 6px !important;
    box-sizing: border-box !important;
  }
  .player-list-container > div,
  .player-list-container ul > div {
    padding: 4px 4px !important;
    border-radius: 6px !important;
    margin-bottom: 3px !important;
  }
  .player-list-container span,
  .player-list-container button {
    font-size: 0.7rem !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .player-list-container span[style*='width: 32px'] {
    width: 22px !important;
    height: 22px !important;
    font-size: 16px !important;
    border-radius: 5px !important;
  }
  .game-room-bottom-row {
    height: 220px !important;
    min-height: 120px !important;
    max-height: 60vh !important;
    align-items: stretch !important;
  }
  .game-room-left, .game-room-right {
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
  }
  .game-room-right {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-end !important;
    background: #23272b !important;
    border-radius: 10px !important;
    overflow: hidden !important;
  }
}
`}</style>
      {/* Responsive layout for small screens */}
      <div className="game-room-flex-responsive" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 1400, margin: '0 auto', padding: '0 2vw', boxSizing: 'border-box' }}>
        {/* Canvas Row (always on top) */}
        <div className="game-room-canvas-row" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', boxShadow: 'none', padding: 0, marginBottom: 18, position: 'relative' }}>
          {/* Show WordPopup as overlay over drawing section during word selection */}
          {shouldShowWordPopup && (
            <div className="word-popup-responsive" style={{ position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 4px 32px #000a, 0 0 16px #a777e344', border: '2.5px solid #a777e3', maxWidth: '95vw', width: 'auto', fontSize: '1.1rem', color: '#fff' }}>
              <WordPopup words={gameState.wordChoices} onSelect={handleWordSelect} timer={wordSelectTimer} />
            </div>
          )}
          {/* In the responsive layout, in the Canvas Row, add this overlay for non-drawers during word selection */}
          {shouldShowWaitingForDrawer && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)',
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: 'clamp(18px, 5vw, 28px)',
                  fontWeight: 700,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #23272b 80%, #3a3f5a 100%)',
                  borderRadius: 20,
                  padding: 'clamp(18px, 6vw, 40px) clamp(16px, 8vw, 60px)',
                  boxShadow: '0 4px 32px #000a, 0 0 16px #a777e344',
                  border: '2.5px solid #a777e3',
                  letterSpacing: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 18,
                  maxWidth: 420,
                  margin: '0 auto',
                  position: 'relative',
                  animation: 'fadeInDown 0.7s',
                }}
              >
                <span style={{ fontSize: 'clamp(28px, 7vw, 38px)', marginBottom: 10 }}>⏳</span>
                Waiting for drawer to select the word...
                <span style={{ fontSize: 'clamp(13px, 3vw, 16px)', color: '#a7bfff', fontWeight: 400, marginTop: 8 }}>Get ready to guess!</span>
              </div>
            </div>
          )}
          <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
            <Canvas
              isDrawing={isDrawer && phase === 'drawing'}
              onDraw={handleDraw}
              onStrokeEnd={handleStrokeEnd}
              drawingData={drawingData}
              disabled={!(isDrawer && phase === 'drawing')}
              tool={tool}
              isEraser={isEraser}
              color={color}
              width={width}
              tempStroke={tempStroke}
              style={{
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                aspectRatio: '4/3',
              }}
            />
            {isDrawer && phase === 'drawing' && (
              <CanvasControls
                color={color}
                setColor={setColor}
                width={width}
                setWidth={setWidth}
                tool={tool}
                setTool={setTool}
                isEraser={isEraser}
                setIsEraser={setIsEraser}
                disabled={false}
                onUndo={handleUndo}
                canUndo={drawingData.some(item => item.type)}
                onClear={() => {
                  setDrawingData([]);
                  socket.emit('draw-data', { code: room.code, data: { type: 'clear' } });
                }}
              />
            )}
          </div>
        </div>
        {/* Bottom Row: Player List (left) and Chat (right) */}
        <div className="game-room-bottom-row" style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 0, background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}>
          <div className="game-room-left" style={{ minWidth: 160, maxWidth: 320, width: '50%', /* display: 'flex', */ flexDirection: 'column', gap: 20, minHeight: 220, background: '#222', borderRadius: '0 0 0 16px', boxShadow: '0 2px 16px #0006', padding: '10px 0', justifyContent: 'flex-start', boxSizing: 'border-box' }}>
            <h4 style={{ color: '#a7bfff', fontWeight: 700, fontSize: 18, margin: '12px 0 0 18px', letterSpacing: 1 }}>Players</h4>
            <PlayerList
              players={mergedPlayers}
              hostId={room?.players?.find(p => p.isHost)?.userId}
              drawerId={gameState?.drawingPlayerId}
              myUserId={user?.userId}
              onKick={userId => {
                socket.emit('room:kick', { code: roomCode, userId });
              }}
            />
          </div>
          <div className="game-room-right" style={{ minWidth: 220, maxWidth: 440, width: '50%', display: 'flex', flexDirection: 'column', minHeight: 220, height: '100%', background: '#23272b', borderRadius: '0 0 16px 0', boxShadow: '0 2px 16px #0006', padding: '0', justifyContent: 'flex-end', alignSelf: 'stretch', boxSizing: 'border-box' }}>
            {/* Messages area */}
            <div style={{ flex: '1 1 0', maxHeight: 320, overflowY: 'auto', padding: '12px 10px 0 10px', marginBottom: 0 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    background: msg.system ? 'transparent' : msg.correct ? 'rgba(26,255,124,0.08)' : msg.isClose ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                    color: msg.system ? '#a7a7b3' : msg.correct ? '#1aff7c' : msg.isClose ? '#ffd700' : '#f3f3fa',
                    fontWeight: msg.system ? 500 : 600,
                    fontSize: 15,
                    marginBottom: 6,
                    borderRadius: 8,
                    padding: msg.system ? '2px 0' : '7px 12px',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    boxShadow: msg.correct ? '0 0 6px #1aff7c33' : msg.isClose ? '0 0 6px #ffd70033' : 'none',
                    border: msg.correct ? '1px solid #1aff7c55' : msg.isClose ? '1px solid #ffd70055' : 'none',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: msg.system ? 'default' : 'pointer',
                    position: 'relative',
                    flexWrap: 'wrap',
                  }}
                  onMouseOver={e => { if (!msg.system) e.currentTarget.style.background = 'rgba(167,123,255,0.10)'; }}
                  onMouseOut={e => { if (!msg.system) e.currentTarget.style.background = msg.correct ? 'rgba(26,255,124,0.08)' : msg.isClose ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)'; }}
                >
                  {!msg.system && (
                    <span style={{ fontWeight: 700, color: '#a7bfff', marginRight: 6 }}>{msg.name}:</span>
                  )}
                  {msg.correct && !msg.system ? (
                    <span style={{ fontWeight: 500 }}>
                      correct guess
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
      {/* Original layout for large screens */}
      <div className="game-room-flex-row" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 8, // Reduced gap for closer sections
        width: '100%',
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 1vw', // Slightly reduced horizontal padding
        boxSizing: 'border-box',
      }}>
        {/* Left: Players/Scores */}
        <div className="game-room-left" style={{ flex: '1 1 0', minWidth: 160, maxWidth: 320, /* display: 'flex', */ flexDirection: 'column', gap: 20, minHeight: 420, background: '#222', borderRadius: 16, boxShadow: '0 2px 16px #0006', padding: '10px 0', justifyContent: 'flex-start', boxSizing: 'border-box' }}>
          <h4 style={{ color: '#a7bfff', fontWeight: 700, fontSize: 18, margin: '12px 0 0 18px', letterSpacing: 1 }}>Players</h4>
          <PlayerList
            players={mergedPlayers}
            hostId={room?.players?.find(p => p.isHost)?.userId}
            drawerId={gameState?.drawingPlayerId}
            myUserId={user?.userId}
            onKick={userId => {
              socket.emit('room:kick', { code: roomCode, userId });
            }}
          />
        </div>
        {/* Center: Canvas */}
        <div className="game-room-center" style={{ flex: '2 1 0', minWidth: 320, maxWidth: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', gap: 8, width: '100%', background: 'none' }}>
          {/* Always reserve space for the canvas/overlay to prevent layout jump */}
          {/* TODO: For canvas precision, ensure Canvas uses ref/clientWidth/clientHeight for drawing calculations */}
          {/* Show WordPopup as overlay over drawing section during word selection */}
          {shouldShowWordPopup && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
              <WordPopup words={gameState.wordChoices} onSelect={handleWordSelect} timer={wordSelectTimer} />
            </div>
          )}
          {/* In both large and small screen canvas overlays, use the same waiting overlay for shouldShowWaitingForDrawer */}
          {shouldShowWaitingForDrawer && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)',
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: 'clamp(18px, 5vw, 28px)',
                  fontWeight: 700,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #23272b 80%, #3a3f5a 100%)',
                  borderRadius: 20,
                  padding: 'clamp(18px, 6vw, 40px) clamp(16px, 8vw, 60px)',
                  boxShadow: '0 4px 32px #000a, 0 0 16px #a777e344',
                  border: '2.5px solid #a777e3',
                  letterSpacing: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 18,
                  maxWidth: 420,
                  margin: '0 auto',
                  position: 'relative',
                  animation: 'fadeInDown 0.7s',
                }}
              >
                <span style={{ fontSize: 'clamp(28px, 7vw, 38px)', marginBottom: 10 }}>⏳</span>
                Waiting for drawer to select the word...
                <span style={{ fontSize: 'clamp(13px, 3vw, 16px)', color: '#a7bfff', fontWeight: 400, marginTop: 8 }}>Get ready to guess!</span>
              </div>
            </div>
          )}
          <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <Canvas
              isDrawing={isDrawer && phase === 'drawing'}
              onDraw={handleDraw}
              onStrokeEnd={handleStrokeEnd}
              drawingData={drawingData}
              disabled={!(isDrawer && phase === 'drawing')}
              tool={tool}
              isEraser={isEraser}
              color={color}
              width={width}
              tempStroke={tempStroke}
              style={{
                width: '100%',
                maxWidth: '100%',
                height: 'auto',
                aspectRatio: '4/3',
              }}
            />
            {isDrawer && phase === 'drawing' && (
              <CanvasControls
                color={color}
                setColor={setColor}
                width={width}
                setWidth={setWidth}
                tool={tool}
                setTool={setTool}
                isEraser={isEraser}
                setIsEraser={setIsEraser}
                disabled={false}
                onUndo={handleUndo}
                canUndo={drawingData.some(item => item.type)}
                onClear={() => {
                  setDrawingData([]);
                  socket.emit('draw-data', { code: room.code, data: { type: 'clear' } });
                }}
              />
            )}
          </div>
        </div>
        {/* Right: Chat */}
        <div className="game-room-right" style={{ flex: '1 1 0', minWidth: 220, maxWidth: 440, display: 'flex', flexDirection: 'column', minHeight: 420, height: '100%', background: '#23272b', borderRadius: 16, boxShadow: '0 2px 16px #0006', padding: '0', justifyContent: 'flex-end', alignSelf: 'stretch', boxSizing: 'border-box' }}>
          {/* Messages area */}
          <div style={{ flex: '1 1 0', maxHeight: 320, overflowY: 'auto', padding: '12px 10px 0 10px', marginBottom: 0 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  background: msg.system ? 'transparent' : msg.correct ? 'rgba(26,255,124,0.08)' : msg.isClose ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                  color: msg.system ? '#a7a7b3' : msg.correct ? '#1aff7c' : msg.isClose ? '#ffd700' : '#f3f3fa',
                  fontWeight: msg.system ? 500 : 600,
                  fontSize: 15,
                  marginBottom: 6,
                  borderRadius: 8,
                  padding: msg.system ? '2px 0' : '7px 12px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  boxShadow: msg.correct ? '0 0 6px #1aff7c33' : msg.isClose ? '0 0 6px #ffd70033' : 'none',
                  border: msg.correct ? '1px solid #1aff7c55' : msg.isClose ? '1px solid #ffd70055' : 'none',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: msg.system ? 'default' : 'pointer',
                  position: 'relative',
                  flexWrap: 'wrap',
                }}
                onMouseOver={e => { if (!msg.system) e.currentTarget.style.background = 'rgba(167,123,255,0.10)'; }}
                onMouseOut={e => { if (!msg.system) e.currentTarget.style.background = msg.correct ? 'rgba(26,255,124,0.08)' : msg.isClose ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)'; }}
              >
                {!msg.system && (
                  <span style={{ fontWeight: 700, color: '#a7bfff', marginRight: 6 }}>{msg.name}:</span>
                )}
                {msg.correct && !msg.system ? (
                  <span style={{ fontWeight: 500 }}>
                    correct guess
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
      {/* Waiting for Players Modal */}
      <Modal open={showWaitingModal} onClose={() => {}} title="Waiting for Players">
        <div style={{ marginBottom: 16 }}>{waitingMsg}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-danger" onClick={() => {
            socket.emit('room:leave', { code: roomCode, userId: user.userId }, () => {
              navigate('/');
            });
          }}>Exit Room</button>
        </div>
      </Modal>
      {/* Host Changed Modal */}
      <Modal open={showHostChange} onClose={() => setShowHostChange(false)} title="Host Changed">
        <div>{hostChangeMsg}</div>
      </Modal>
      {/* Drawer Changed Modal */}
      <Modal open={showDrawerChange} onClose={() => setShowDrawerChange(false)} title="Drawer Changed">
        <div>{drawerChangeMsg}</div>
      </Modal>
      {/* Round Summary Modal */}
      <Modal open={showRoundSummary} title={null} className="round-summary-modal">
        {roundSummaryData && (
          <div style={{
            background: 'linear-gradient(135deg, #23272b 80%, #3a3f5a 100%)',
            borderRadius: 20,
            padding: 'clamp(18px, 6vw, 40px) clamp(16px, 8vw, 60px)',
            boxShadow: '0 4px 32px #000a, 0 0 16px #a777e344',
            border: '2.5px solid #a777e3',
            maxWidth: 420,
            margin: '0 auto',
            position: 'relative',
            animation: 'fadeInDown 0.7s',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <h2 style={{ color: '#a777e3', margin: '0 0 18px 0', fontWeight: 900, fontSize: 28, textAlign: 'center', letterSpacing: 1 }}>Round Summary</h2>
              <h4 style={{ color: '#a7bfff', marginBottom: 8 }}>The word was: {roundSummaryData.word}</h4>
              <div style={{ fontSize: 14, color: '#aaa', marginBottom: 16 }}>
                Drawer: {roundSummaryData.players.find(p => p.userId === roundSummaryData.drawerId)?.name || 'Unknown'}
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ color: '#fff', marginBottom: 8 }}>Round Scores:</h5>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {roundSummaryData.players.map(player => {
                  const guess = roundSummaryData.guesses.find(g => g.userId === player.userId);
                  const isDrawer = player.userId === roundSummaryData.drawerId;
                  const isCorrect = guess?.correct;
                  const isClose = guess?.isClose;
                  const isDrawerGuess = guess?.isDrawer;
                  
                  return (
                    <div
                      key={player.userId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        marginBottom: 4,
                        borderRadius: 6,
                        background: isDrawer ? 'rgba(167,123,255,0.1)' : isCorrect ? 'rgba(26,255,124,0.1)' : isClose ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
                        border: isDrawer ? '1px solid #a777e3' : isCorrect ? '1px solid #1aff7c' : isClose ? '1px solid #ffd700' : '1px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{player.avatar?.emoji || '👤'}</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{player.name}</span>
                        {isClose && !isCorrect && <span style={{ color: '#ffd700', fontSize: 12 }}>~ Close</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {guess && !isDrawer && !isDrawerGuess && (
                          null // Remove guessed word display
                        )}
                        <span style={{ color: '#ffd700', fontWeight: 'bold', marginLeft: 16 }}>
                          {guess?.score || 0} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Round Restarted Modal */}
      <Modal open={showRoundRestart} onClose={() => setShowRoundRestart(false)} title="Round Restarted">
        <div>{roundRestartMsg}</div>
      </Modal>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      {/* Settings Modal: Full-page, view-only overlay */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title={null} className="settings-fullscreen-modal" showClose={false} backdropStyle={{ background: 'rgba(30,32,40,0.98)', zIndex: 99999 }}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          padding: 0,
          margin: 0,
          boxSizing: 'border-box',
          zIndex: 99999,
        }}>
          <div style={{
            width: 'min(98vw, 480px)',
            maxWidth: '98vw',
            minWidth: 0,
            background: 'linear-gradient(135deg, #23272b 60%, #3a3f5a 100%)',
            borderRadius: 18,
            boxShadow: '0 4px 32px #000a, 0 0 16px #a777e344',
            padding: 'clamp(12px, 4vw, 32px)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            position: 'relative',
            margin: 'auto',
          }}>
            {/* Heading row with X close button to the right */}
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              gap: 0,
            }}>
              <span style={{ color: '#a777e3', fontWeight: 800, fontSize: window.innerWidth <= 400 ? '1.1rem' : '1.3rem', letterSpacing: 1, margin: 0, whiteSpace: 'nowrap', lineHeight: 1 }}>Room Settings</span>
              <button onClick={() => setShowSettings(false)} style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: window.innerWidth <= 400 ? 20 : 24,
                fontWeight: 700,
                cursor: 'pointer',
                zIndex: 2,
                lineHeight: 1,
                padding: 0,
                opacity: 0.7,
                transition: 'opacity 0.2s',
                marginLeft: 12,
                alignSelf: 'center',
              }} title="Close settings">×</button>
            </div>
            <SettingsPanel settings={room?.settings} isHost={false} onSave={() => {}} viewOnly />
          </div>
        </div>
      </Modal>
    </div>
  );
}
function CanvasControls({ color, setColor, width, setWidth, tool, setTool, isEraser, setIsEraser, disabled, onUndo, canUndo, onClear }) {
  const COLORS = [
    '#000', '#222', '#fff', '#e53935', '#fbc02d', '#43a047', '#1e88e5',
    '#8e24aa', '#00bcd4', '#ff9800', '#795548', '#c0c0c0', '#ffb6c1',
    '#ffd700', '#90ee90', '#00ced1', '#4682b4', '#dda0dd', '#ff6347', '#40e0d0', '#a0522d'
  ];
  // Remove the largest pen size (24), and increase eraser size (32)
  const SIZES = [2, 4, 8, 16];
  const ERASER_SIZE = 32;
  // Reorder tool buttons: fill (bucket) far left, then undo, pen, clear, sizes..., eraser far right
  const toolButtons = [
    { key: 'fill', icon: '🪣', onClick: () => { setTool('fill'); setIsEraser(false); }, disabled, title: 'Fill', style: { background: tool === 'fill' ? '#b2ebf2' : '#fff', border: '1px solid #888' } },
    { key: 'undo', icon: '↩️', onClick: onUndo, disabled: disabled || !canUndo, title: 'Undo', style: { background: (disabled || !canUndo) ? '#444' : '#fff', color: '#23272b', fontWeight: 700, border: '1px solid #888' } },
    { key: 'pen', icon: '✏️', onClick: () => { setTool('pen'); setIsEraser(false); }, disabled, title: 'Pen', style: { background: tool === 'pen' ? '#b39ddb' : '#fff', border: '1px solid #888' } },
    { key: 'clear', icon: '🗑️', onClick: onClear, disabled, title: 'Clear All', style: { background: '#fff', border: '1px solid #888', color: '#e53935', fontWeight: 700 } },
    ...SIZES.map((s) => ({
      key: `size${s}`,
      icon: <span style={{ display: 'inline-block', background: '#fff', borderRadius: '50%', width: s, height: s, border: '1.5px solid #888' }} />,
      onClick: () => { setWidth(s); setIsEraser(false); setTool('pen'); },
      disabled,
      title: `Pen size ${s}`,
      style: { border: width === s && !isEraser ? '2.5px solid #a7bfff' : '1px solid #888', background: '#23272b', boxShadow: width === s && !isEraser ? '0 0 8px #a7bfff' : 'none' }
    })),
    { key: 'eraser', icon: '🧽', onClick: () => { setTool('eraser'); setIsEraser(true); setWidth(ERASER_SIZE); }, disabled, title: 'Eraser', style: { background: tool === 'eraser' ? '#ffe082' : '#fff', border: '1px solid #888' } },
  ];

  // Split toolButtons into a 3x3 grid (first 9 tools)
  const toolGrid = [];
  for (let i = 0; i < 3; i++) {
    toolGrid.push(toolButtons.slice(i * 3, i * 3 + 3));
  }

  // Split COLORS into a 3x7 grid
  const colorGrid = [];
  for (let i = 0; i < 3; i++) {
    colorGrid.push(COLORS.slice(i * 7, i * 7 + 7));
  }

  return (
    <div className="canvas-controls" style={{
      background: 'linear-gradient(135deg, #23272b 60%, #3a3f5a 100%)',
      borderRadius: 14,
      boxShadow: '0 2px 16px #0006',
      padding: '12px 0px',
      marginTop: 18,
      marginBottom: 24,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      minWidth: 0,
      maxWidth: 700,
      width: 700,
      height: 108, // increased height for more vertical space
      boxSizing: 'border-box',
      border: '4px solid #444',
      position: 'relative',
      overflow: 'hidden',
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      {/* Color grid: 3 rows x 7 columns */}
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, padding: '0 8px', alignItems: 'center', justifyItems: 'center', height: '100%' }}>
        {colorGrid.flat().map((c, idx) => (
          <button
            key={c + idx}
            className="btn btn-sm"
            style={{ background: c, border: color === c ? '2px solid #a7bfff' : '1.5px solid #fff', width: 22, height: 22, margin: 0, padding: 0, borderRadius: 5, boxShadow: color === c ? '0 0 6px #a7bfff' : 'none', transition: 'border 0.2s, box-shadow 0.2s' }}
            onClick={() => { setColor(c); setTool('pen'); setIsEraser(false); }}
            disabled={disabled}
            title={c}
          />
        ))}
      </div>
      {/* Vertical divider */}
      <div style={{ width: 2, height: '80%', background: '#353a40', borderRadius: 2, margin: '0 8px' }} />
      {/* Tool grid: 3 rows x 3 columns */}
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, padding: '0 8px', alignItems: 'center', justifyItems: 'center', height: '100%' }}>
        {toolGrid.flat().map((btn, idx) => (
          <button
            key={btn.key + idx}
            className="btn btn-sm btn-light"
            onClick={btn.onClick}
            disabled={btn.disabled}
            title={btn.title}
            style={{ width: 22, height: 22, borderRadius: 5, margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, ...btn.style }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

