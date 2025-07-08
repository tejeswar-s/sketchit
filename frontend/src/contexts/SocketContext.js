import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use LAN IP if not localhost
    const backendHost = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    const s = io(`http://${backendHost}:5000`, {
      transports: ['websocket'],
      reconnection: true,
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
} 