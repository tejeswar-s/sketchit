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
  const [theme, setTheme] = useState(settings.theme || 'general');

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
    setTheme(settings.theme || 'general');
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
      theme,
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
      theme,
    };
    // Remove customWords and maxPlayers if present
    delete newSettings.customWords;
    delete newSettings.maxPlayers;
    
    console.log('[SettingsPanel] Calling onSave with:', newSettings);
    onSave && onSave(newSettings);
  };

  const content = (
    <div className="settings-panel">
      <h4 className="settings-title">Game Settings</h4>
      <div className="settings-row">
        <label className="settings-label">Round Time (sec): </label>
        <input type="number" value={roundTime} min={30} max={180} onChange={e => setRoundTime(e.target.value)} className="settings-input" disabled={!isHost || viewOnly} />
      </div>
      <div className="settings-row">
        <label className="settings-label">Max Rounds: </label>
        <input type="number" value={maxRounds} min={1} max={10} onChange={e => setMaxRounds(e.target.value)} className="settings-input" disabled={!isHost || viewOnly} />
      </div>
      <div className="settings-row">
        <label className="settings-label">Number of Hints: </label>
        <input type="number" min={1} max={5} value={hintCount} onChange={e => handleHintCountChange(Number(e.target.value))} className="settings-input" disabled={!isHost || viewOnly} />
      </div>
      {Array.from({ length: hintCount }).map((_, idx) => (
        <div key={idx} className="settings-row settings-slider-row">
          <label className="settings-label">Hint {idx + 1} timing:</label>
          <input type="range" min={5} max={95} step={1} value={hintIntervals[idx] || 0} onChange={e => handleHintIntervalChange(idx, Number(e.target.value))} disabled={!isHost || viewOnly} className="settings-slider" />
          <span className="settings-slider-value">{hintIntervals[idx] || 0}%</span>
        </div>
      ))}
      <div className="settings-row">
        <label className="settings-label">Word Count (choices for drawer): </label>
        <input type="number" value={wordCount} min={2} max={6} onChange={e => setWordCount(e.target.value)} className="settings-input" disabled={!isHost || viewOnly} />
      </div>
      <div className="settings-row settings-switch-row">
        <input className="settings-switch" type="checkbox" id="allowUndo" checked={allowUndo} onChange={e => setAllowUndo(e.target.checked)} disabled={!isHost || viewOnly} />
        <label className="settings-label" htmlFor="allowUndo">Allow Drawing Undo</label>
      </div>
      <div className="settings-row settings-switch-row">
        <input className="settings-switch" type="checkbox" id="allowChat" checked={allowChat} onChange={e => setAllowChat(e.target.checked)} disabled={!isHost || viewOnly} />
        <label className="settings-label" htmlFor="allowChat">Allow Chat</label>
      </div>
      <div className="settings-row settings-switch-row">
        <input className="settings-switch" type="checkbox" id="showTimerBar" checked={showTimerBar} onChange={e => setShowTimerBar(e.target.checked)} disabled={!isHost || viewOnly} />
        <label className="settings-label" htmlFor="showTimerBar">Show Timer Bar</label>
      </div>
      <div className="settings-row">
        <label className="settings-label">Game Theme: </label>
        <select value={theme} onChange={e => setTheme(e.target.value)} disabled={!isHost || viewOnly} className="settings-select">
          <option value="general">General</option>
          <option value="countries">Countries</option>
          <option value="animals">Animals</option>
          <option value="trees">Trees</option>
          <option value="fruits">Fruits</option>
          <option value="food">Food</option>
          <option value="sports">Sports</option>
          <option value="vehicles">Vehicles</option>
          <option value="jobs">Jobs</option>
          <option value="colors">Colors</option>
        </select>
      </div>
      <div className="settings-row">
        <label className="settings-label">Language: </label>
        <select value={language} onChange={e => setLanguage(e.target.value)} disabled={!isHost || viewOnly} className="settings-select">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
      </div>
      {!viewOnly && (
        <div className="settings-btn-row">
          {onCancel && <button onClick={onCancel} className="settings-btn settings-btn-secondary">Cancel</button>}
          {isHost && <button onClick={handleSave} className="settings-btn settings-btn-primary">Save</button>}
        </div>
      )}
      <style>{`
        .settings-panel {
          background: rgba(34,39,43,0.97);
          border-radius: 14px;
          box-shadow: 0 4px 24px #181a1b88, 0 0 12px #a777e322;
          border: 2px solid #a777e355;
          padding: 18px 16px 12px 16px;
          color: #eae6fa;
          min-width: 300px;
          max-width: 380px;
          margin: 0 auto 8px auto;
        }
        .settings-title {
          color: #a777e3;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          margin-bottom: 14px;
          text-shadow: 0 2px 10px #6e44ff33, 0 0 4px #a777e322;
        }
        .settings-row {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .settings-label {
          color: #b9a7e3;
          font-weight: 600;
          font-size: 0.98rem;
          min-width: 140px;
          letter-spacing: 0.3px;
        }
        .settings-input {
          background: #181a1b;
          color: #fff;
          border: 2px solid #a777e3;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 0.98rem;
          font-weight: 600;
          width: 60px;
          margin-left: 8px;
          height: 30px;
          transition: border 0.18s, box-shadow 0.18s;
        }
        .settings-input:focus {
          border-color: #6e44ff;
          box-shadow: 0 0 0 2px #a777e355;
          outline: none;
        }
        .settings-slider-row {
          gap: 8px;
        }
        .settings-slider {
          accent-color: #6e44ff;
          width: 90px;
          margin-right: 6px;
          height: 3px;
        }
        .settings-slider-value {
          color: #a777e3;
          font-weight: 700;
          font-size: 0.95rem;
          min-width: 32px;
        }
        .settings-switch-row {
          gap: 8px;
        }
        .settings-switch {
          accent-color: #6e44ff;
          width: 28px;
          height: 16px;
        }
        .settings-select {
          background: #181a1b;
          color: #fff;
          border: 2px solid #a777e3;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 0.98rem;
          font-weight: 600;
          margin-left: 8px;
          height: 30px;
          transition: border 0.18s, box-shadow 0.18s;
        }
        .settings-select:focus {
          border-color: #6e44ff;
          box-shadow: 0 0 0 2px #a777e355;
          outline: none;
        }
        .settings-btn-row {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 14px;
        }
        .settings-btn {
          background: linear-gradient(90deg, #6e44ff 0%, #a777e3 100%);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: 700;
          font-size: 1rem;
          padding: 6px 18px;
          box-shadow: 0 2px 8px #a777e344;
          letter-spacing: 0.7px;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.12s;
          cursor: pointer;
        }
        .settings-btn-primary:hover, .settings-btn-primary:focus {
          background: linear-gradient(90deg, #a777e3 0%, #6e44ff 100%);
          color: #fff;
          box-shadow: 0 4px 18px #6e44ff44;
          transform: translateY(-2px) scale(1.03);
        }
        .settings-btn-secondary {
          background: #23272b;
          color: #a777e3;
          border: 2px solid #a777e3;
        }
        .settings-btn-secondary:hover, .settings-btn-secondary:focus {
          background: #a777e3;
          color: #fff;
        }
      `}</style>
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