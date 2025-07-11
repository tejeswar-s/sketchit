import React, { useState, useEffect } from 'react';

export default function SettingsPanel({ settings, onSave, onCancel, isHost, showAsModal, viewOnly }) {
  const [roundTime, setRoundTime] = useState(settings.roundTime || 80);
  const [maxRounds, setMaxRounds] = useState(settings.maxRounds || 3);
  const [hintCount, setHintCount] = useState(settings.hintIntervals ? settings.hintIntervals.length : 2);
  const [hintIntervals, setHintIntervals] = useState(settings.hintIntervals ? settings.hintIntervals.map(f => Math.round(f * 100)) : [33, 66]);
  const [allowUndo, setAllowUndo] = useState(settings.allowUndo ?? true);
  const [allowChat, setAllowChat] = useState(settings.allowChat ?? true);
  const [showTimerBar, setShowTimerBar] = useState(settings.showTimerBar ?? true);
  const [language, setLanguage] = useState(settings.language || 'en');
  const [wordCount, setWordCount] = useState(settings.wordCount || 3);

  useEffect(() => {
    setRoundTime(settings.roundTime || 80);
    setMaxRounds(settings.maxRounds || 3);
    setHintCount(settings.hintIntervals ? settings.hintIntervals.length : 2);
    setHintIntervals(settings.hintIntervals ? settings.hintIntervals.map(f => Math.round(f * 100)) : [33, 66]);
    setAllowUndo(settings.allowUndo ?? true);
    setAllowChat(settings.allowChat ?? true);
    setShowTimerBar(settings.showTimerBar ?? true);
    setLanguage(settings.language || 'en');
    setWordCount(settings.wordCount || 3);
  }, [settings]);

  const handleHintCountChange = (n) => {
    setHintCount(n);
    // Evenly distribute intervals
    setHintIntervals(Array.from({ length: n }, (_, i) => Math.round(((i + 1) / (n + 1)) * 100)));
  };

  const handleHintIntervalChange = (idx, value) => {
    const newIntervals = [...hintIntervals];
    newIntervals[idx] = value;
    setHintIntervals(newIntervals);
  };

  const handleSave = () => {
    console.log('[SettingsPanel] Save button clicked');
    console.log('[SettingsPanel] Current settings:', {
      roundTime: Number(roundTime),
      maxRounds: Number(maxRounds),
      hintIntervals: hintIntervals.map(v => v / 100),
      allowUndo,
      allowChat,
      showTimerBar,
      language,
      wordCount: Number(wordCount),
    });
    
    const newSettings = {
      ...settings,
      roundTime: Number(roundTime),
      maxRounds: Number(maxRounds),
      hintIntervals: hintIntervals.map(v => v / 100),
      allowUndo,
      allowChat,
      showTimerBar,
      language,
      wordCount: Number(wordCount),
    };
    // Remove customWords and maxPlayers if present
    delete newSettings.customWords;
    delete newSettings.maxPlayers;
    
    console.log('[SettingsPanel] Calling onSave with:', newSettings);
    onSave && onSave(newSettings);
  };

  const content = (
    <div style={{ background: showAsModal ? '#23272b' : '#222', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 12, minWidth: 300 }}>
      <h4>Game Settings</h4>
      <div style={{ marginBottom: 8 }}>
        <label>Round Time (sec): </label>
        <input type="number" value={roundTime} min={30} max={180} onChange={e => setRoundTime(e.target.value)} style={{ width: 60, marginLeft: 8 }} disabled={!isHost || viewOnly} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Max Rounds: </label>
        <input type="number" value={maxRounds} min={1} max={10} onChange={e => setMaxRounds(e.target.value)} style={{ width: 40, marginLeft: 8 }} disabled={!isHost || viewOnly} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Number of Hints: </label>
        <input type="number" min={1} max={5} value={hintCount} onChange={e => handleHintCountChange(Number(e.target.value))} style={{ width: 40, marginLeft: 8 }} disabled={!isHost || viewOnly} />
      </div>
      {Array.from({ length: hintCount }).map((_, idx) => (
        <div key={idx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: 8 }}>Hint {idx + 1} timing:</label>
          <input type="range" min={5} max={95} step={1} value={hintIntervals[idx] || 0} onChange={e => handleHintIntervalChange(idx, Number(e.target.value))} disabled={!isHost || viewOnly} style={{ width: 120, marginRight: 8 }} />
          <span>{hintIntervals[idx] || 0}%</span>
        </div>
      ))}
      <div style={{ marginBottom: 8 }}>
        <label>Word Count (choices for drawer): </label>
        <input type="number" value={wordCount} min={2} max={6} onChange={e => setWordCount(e.target.value)} style={{ width: 40, marginLeft: 8 }} disabled={!isHost || viewOnly} />
      </div>
      <div className="form-check form-switch" style={{ marginBottom: 8 }}>
        <input className="form-check-input" type="checkbox" id="allowUndo" checked={allowUndo} onChange={e => setAllowUndo(e.target.checked)} disabled={!isHost || viewOnly} />
        <label className="form-check-label" htmlFor="allowUndo">Allow Drawing Undo</label>
      </div>
      <div className="form-check form-switch" style={{ marginBottom: 8 }}>
        <input className="form-check-input" type="checkbox" id="allowChat" checked={allowChat} onChange={e => setAllowChat(e.target.checked)} disabled={!isHost || viewOnly} />
        <label className="form-check-label" htmlFor="allowChat">Allow Chat</label>
      </div>
      <div className="form-check form-switch" style={{ marginBottom: 8 }}>
        <input className="form-check-input" type="checkbox" id="showTimerBar" checked={showTimerBar} onChange={e => setShowTimerBar(e.target.checked)} disabled={!isHost || viewOnly} />
        <label className="form-check-label" htmlFor="showTimerBar">Show Timer Bar</label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Language: </label>
        <select value={language} onChange={e => setLanguage(e.target.value)} disabled={!isHost || viewOnly} className="form-select form-select-sm" style={{ width: 120, marginLeft: 8 }}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
      </div>
      {!viewOnly && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {onCancel && <button onClick={onCancel} className="btn btn-secondary">Cancel</button>}
          {isHost && <button onClick={handleSave} className="btn btn-primary">Save</button>}
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
    );
  }
  return content;
} 