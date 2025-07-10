import React, { useRef, useEffect, useState } from 'react';

export default function ChatBox({ messages, onSend, disabled }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div style={{ background: '#23272b', borderRadius: 10, padding: 0, color: '#f3f3fa', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 240, border: 'none', boxShadow: '0 2px 16px #0006', position: 'relative', justifyContent: 'flex-end' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 0 10px', marginBottom: 0 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ color: msg.system ? '#a7a7b3' : msg.correct ? '#1aff7c' : '#f3f3fa', fontWeight: msg.system ? 500 : 600, fontSize: 15, marginBottom: 2, wordBreak: 'break-word' }}>
            <span style={{ fontWeight: 700 }}>{msg.name}:</span> <span style={{ fontWeight: 500 }}>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        background: '#23272b',
        borderTop: '1px solid #353a40',
        padding: '10px 10px 10px 10px',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        gap: 0,
        // Remove sticky/absolute/positioning here
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          placeholder={disabled ? 'Muted...' : 'Type your guess here...'}
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
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          style={{
            borderRadius: 6,
            background: '#6e44ff',
            color: '#fff',
            border: 'none',
            padding: '0 22px',
            height: 40,
            fontSize: 15,
            fontWeight: 600,
            cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
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
  );
} 