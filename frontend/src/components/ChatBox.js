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
    <div style={{ background: '#23272b', borderRadius: 10, padding: 0, color: '#f3f3fa', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 240, border: 'none', boxShadow: '0 2px 16px #0006', position: 'relative', justifyContent: 'flex-end', width: '100%', minWidth: 0, boxSizing: 'border-box', maxWidth: '100vw' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px 0 10px', marginBottom: 0, minWidth: 0, boxSizing: 'border-box' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            color: msg.system ? '#a7a7b3' : msg.correct ? '#1aff7c' : msg.isClose ? '#ffd700' : '#f3f3fa', 
            fontWeight: msg.system ? 500 : 600, 
            fontSize: 15, 
            marginBottom: 2, 
            wordBreak: 'break-word',
            padding: '3px 8px',
            borderRadius: 6,
            minWidth: 0,
            boxSizing: 'border-box',
            ...(window.innerWidth <= 400 ? {
              fontSize: '0.7rem',
              padding: '2px 4px',
              marginBottom: 1,
              borderRadius: 4,
              lineHeight: '1.1',
            } : {})
          }}>
            <span style={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.name}:</span> <span style={{ fontWeight: 500 }}>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        background: '#23272b',
        borderTop: '1px solid #353a40',
        padding: window.innerWidth <= 400 ? '0 1px' : '10px 10px 10px 10px',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        gap: 0,
        position: 'relative',
        height: window.innerWidth <= 400 ? 22 : 40,
        minHeight: window.innerWidth <= 400 ? 22 : 40,
        marginTop: 0,
        minWidth: 0,
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
            borderRadius: 5,
            border: '1px solid #444',
            outline: 'none',
            padding: window.innerWidth <= 400 ? '2px 6px' : '12px 14px',
            background: '#181a1d',
            color: '#f3f3fa',
            fontSize: window.innerWidth <= 400 ? '0.7rem' : 15,
            boxShadow: 'none',
            height: window.innerWidth <= 400 ? 18 : 40,
            marginRight: 4,
            transition: 'border 0.2s',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          style={{
            borderRadius: 5,
            background: '#a777e3',
            color: '#fff',
            border: 'none',
            padding: window.innerWidth <= 400 ? '0 8px' : '0 22px',
            height: window.innerWidth <= 400 ? 18 : 40,
            fontSize: window.innerWidth <= 400 ? '0.7rem' : 15,
            fontWeight: 600,
            cursor: disabled || !input.trim() ? 'not-allowed' : 'pointer',
            boxShadow: 'none',
            transition: 'background 0.2s',
            flex: 'none',
            whiteSpace: 'nowrap',
            minWidth: 0,
            maxWidth: 80,
            boxSizing: 'border-box',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
} 