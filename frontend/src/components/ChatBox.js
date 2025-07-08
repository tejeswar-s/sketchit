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
    <div style={{ background: '#222', borderRadius: 8, padding: 8, color: '#fff', display: 'flex', flexDirection: 'column', height: 240 }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ color: msg.system ? '#aaa' : msg.correct ? '#0f0' : '#fff' }}>
            <b>{msg.name}:</b> {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={disabled}
          placeholder={disabled ? 'Muted...' : 'Type your guess or chat...'}
          style={{ flex: 1, borderRadius: 4, border: '1px solid #444', padding: 6, background: '#111', color: '#fff' }}
        />
        <button onClick={handleSend} disabled={disabled || !input.trim()} style={{ marginLeft: 6, borderRadius: 4, background: '#007bff', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>Send</button>
      </div>
    </div>
  );
} 