import { useState, useRef, useCallback } from 'react';

export default function useCountdownTimer(initialTime = 0) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef(null);

  const start = useCallback((time) => {
    clearInterval(timerRef.current);
    setTimeLeft(time);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const reset = useCallback((time) => {
    clearInterval(timerRef.current);
    setTimeLeft(time);
  }, []);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  return { timeLeft, start, reset, stop };
} 