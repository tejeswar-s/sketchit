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

function TopBar({ round, maxRounds, timeLeft, wordBlanks, onSettings }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#1a2a3a', borderRadius: 8, padding: '8px 16px', marginBottom: 16, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: 18 }}>
        <span style={{ background: '#fff', color: '#222', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>{timeLeft}</span>
        <span>Round {round} of {maxRounds}</span>
      </div>
      <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 'bold', color: '#fff' }}>{wordBlanks}</div>
      <button onClick={onSettings} style={{ background: 'none', border: 'none', fontSize: 28, color: '#fff', cursor: 'pointer' }} title="Settings">⚙️</button>
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
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, room, setRoom, gameState, setGameState, leaderboard, setLeaderboard } = useGame();
  const socket = useSocket();
  const [drawingData, setDrawingData] = useState([]);
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

  // Derived variables
  const isDrawer = gameState && user ? gameState.drawingPlayerId === user.userId : false;
  const isMuted = room && user ? room.players.find(p => p.userId === user.userId)?.isMuted : false;
  const isHost = room && user ? room.players.find(p => p.userId === user.userId)?.isHost : false;

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
    'draw-data': (line) => setDrawingData(data => [...data, line]),
    'guess-result': ({ userId, guess, correct, score }) => {
      setMessages(msgs => [...msgs, { name: room?.players.find(p => p.userId === userId)?.name || 'Player', message: guess, correct }]);
      if (userId === user.userId && correct) setDisabledGuess(true);
    },
    'hint-update': ({ hint }) => setMaskedWord(hint.replace(/[a-zA-Z]/g, '_').replace(/ /g, ' ')),
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
    setDrawingData(data => [...data, line]);
    socket.emit('draw-data', { code: room.code, data: line });
  };

  // Save settings handler
  const handleSaveSettings = (newSettings) => {
    // Emit to backend (add a new socket event 'room:updateSettings')
    socket.emit('room:updateSettings', { code: room.code, settings: newSettings }, (updatedRoom) => {
      setRoom(updatedRoom);
      setShowSettings(false);
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
    <div className="container" style={{ maxWidth: 1400, margin: '32px auto', background: '#23272b', borderRadius: 16, padding: 24, boxShadow: '0 4px 32px #0008' }}>
      <TopBar
        round={gameState?.round || 1}
        maxRounds={room?.settings?.maxRounds || 3}
        timeLeft={timeLeft}
        wordBlanks={isDrawer ? '' : wordBlanks}
        onSettings={() => setShowSettings(true)}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn btn-outline-danger btn-sm me-2" onClick={() => setShowLeaveModal(true)}>Leave Room</button>
        {isHost && <button className="btn btn-danger btn-sm" onClick={() => setShowLeaveModal(true)}>Close Room</button>}
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left: Players/Scores */}
        <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PlayerList
            players={mergedPlayers}
            hostId={room?.players?.find(p => p.isHost)?.userId}
            drawerId={gameState?.drawingPlayerId}
            myUserId={user?.userId}
            onMute={() => {}}
            onKick={() => {}}
          />
          {/* <ScoreBoard players={mergedPlayers} /> Removed: redundant with PlayerList */}
        </div>
        {/* Center: Canvas */}
        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Canvas isDrawing={isDrawer && phase === 'drawing'} onDraw={handleDraw} drawingData={drawingData} disabled={!(isDrawer && phase === 'drawing')} />
          {phase === 'selecting-word' && !shouldShowWordPopup && (
            <div style={{ marginTop: 32, color: '#fff', fontSize: 20, background: '#333', padding: 24, borderRadius: 12, textAlign: 'center' }}>
              Waiting for the drawer to choose a word...
            </div>
          )}
          {/* Masked word display for guessers, actual word for drawer during drawing phase */}
          {phase === 'drawing' && (
            <div style={{ marginTop: 24, fontSize: 28, letterSpacing: 6, fontWeight: 'bold', display: 'flex', justifyContent: 'center' }}>
              {isDrawer
                ? gameState.currentWord
                : maskedWord.split('').map((c, i) => (
                    <span
                      key={i}
                      style={{
                        color: justRevealed.includes(i) && c !== '_' ? 'yellow' : '#fff',
                        transition: 'color 0.3s',
                        width: c === ' ' ? 16 : 24,
                        display: 'inline-block',
                        textAlign: 'center',
                      }}
                    >
                      {c}
                    </span>
                  ))}
            </div>
          )}
          {/* Animated round summary modal */}
          <Modal open={showRoundSummary} onClose={() => setShowRoundSummary(false)} title="Round Over!">
            {roundSummaryData && (
              <div className="animate__animated animate__fadeInDown" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>
                  The word was: <span style={{ fontWeight: 'bold', color: '#0af' }}>{roundSummaryData.word}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>Guesses:</strong>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {roundSummaryData.players.map(p => {
                      const guess = roundSummaryData.guesses.find(g => g.userId === p.userId);
                      return (
                        <li key={p.userId} style={{ color: guess?.correct ? '#0f0' : '#fff', fontWeight: guess?.correct ? 'bold' : 'normal' }}>
                          {p.name}: {guess ? guess.guess : <em>No guess</em>} {guess?.correct ? '✔️' : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </Modal>
        </div>
        {/* Right: Chat */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ChatBox
            messages={messages}
            onSend={handleSend}
            disabled={isDrawer || disabledGuess || phase !== 'drawing'}
          />
        </div>
      </div>
      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          settings={room.settings}
          isHost={isHost}
          showAsModal
          onSave={handleSaveSettings}
          onCancel={() => setShowSettings(false)}
        />
      )}
      {/* Render WordPopup if shouldShowWordPopup */}
      {shouldShowWordPopup && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, zIndex: 9999, display: 'flex', justifyContent: 'center' }}>
          <WordPopup words={gameState.wordChoices} onSelect={handleWordSelect} />
        </div>
      )}
      {/* Leave/Close Room Modal */}
      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title={isHost ? 'Close Room?' : 'Leave Room?'}>
        <div style={{ marginBottom: 16 }}>
          {isHost
            ? 'Are you sure you want to close the room for everyone?'
            : 'Are you sure you want to leave the room?'}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={isHost ? handleCloseRoom : handleLeaveRoom}>{isHost ? 'Close Room' : 'Leave Room'}</button>
        </div>
      </Modal>
      {/* Host/Drawer Change Notifications */}
      <Modal open={showHostChange} onClose={() => setShowHostChange(false)} title="Host Changed">
        <div>{hostChangeMsg}</div>
      </Modal>
      <Modal open={showDrawerChange} onClose={() => setShowDrawerChange(false)} title="Drawer Changed">
        <div>{drawerChangeMsg}</div>
      </Modal>
      <Modal open={!!redirectMsg} onClose={() => { setRedirectMsg(''); navigate('/'); }} title="Notice">
        <div>{redirectMsg}</div>
      </Modal>
    </div>
  );
} 