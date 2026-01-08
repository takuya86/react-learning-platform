import { useEffect, useRef } from 'react';
import styles from './QuizTimer.module.css';

interface QuizTimerProps {
  timeRemainingSec: number | null;
  onTick: () => void;
  onTimeout: () => void;
  isRunning: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function QuizTimer({
  timeRemainingSec,
  onTick,
  onTimeout,
  isRunning,
}: QuizTimerProps) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning || timeRemainingSec === null) {
      return;
    }

    if (timeRemainingSec <= 0) {
      onTimeout();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      onTick();
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeRemainingSec, onTick, onTimeout]);

  useEffect(() => {
    if (timeRemainingSec !== null && timeRemainingSec <= 0 && isRunning) {
      onTimeout();
    }
  }, [timeRemainingSec, isRunning, onTimeout]);

  if (timeRemainingSec === null) {
    return null;
  }

  const isLowTime = timeRemainingSec <= 30;
  const isCritical = timeRemainingSec <= 10;

  return (
    <div
      className={`${styles.timer} ${isLowTime ? styles.lowTime : ''} ${isCritical ? styles.critical : ''}`}
    >
      <span className={styles.icon}>⏱</span>
      <span className={styles.time}>{formatTime(timeRemainingSec)}</span>
    </div>
  );
}
