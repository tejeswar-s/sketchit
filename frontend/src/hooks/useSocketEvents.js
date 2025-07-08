import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function useSocketEvents(eventHandlers) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler) socket.on(event, handler);
    });
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        if (handler) socket.off(event, handler);
      });
    };
    // eslint-disable-next-line
  }, [socket, ...Object.values(eventHandlers)]);
} 