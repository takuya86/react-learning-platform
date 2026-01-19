import { useEffect, useRef, useCallback } from 'react';
import { Timer } from 'lucide-react';
import {
  TIMER_INTERVAL_MS,
  LOW_TIME_THRESHOLD_SEC,
  CRITICAL_TIME_THRESHOLD_SEC,
} from '../constants';
import styles from './QuizTimer.module.css';

interface QuizTimerProps {
  timeRemainingSec: number | null;
  onTick: () => void;
  isRunning: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function QuizTimer({ timeRemainingSec, onTick, isRunning }: QuizTimerProps) {
  const intervalRef = useRef<number | null>(null);
  // Use ref to always access the latest onTick without re-creating interval
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Don't start timer if not running or no time limit
    if (!isRunning || timeRemainingSec === null) {
      clearTimer();
      return;
    }

    // Don't start if already at 0
    if (timeRemainingSec <= 0) {
      clearTimer();
      return;
    }

    // Only start interval if not already running
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(() => {
        onTickRef.current();
      }, TIMER_INTERVAL_MS);
    }

    return clearTimer;
    // Only depend on isRunning - timeRemainingSec changes should NOT restart interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, clearTimer]);

  // Separate effect to stop timer when time reaches 0
  useEffect(() => {
    if (timeRemainingSec !== null && timeRemainingSec <= 0) {
      clearTimer();
    }
  }, [timeRemainingSec, clearTimer]);

  if (timeRemainingSec === null) {
    return null;
  }

  const isLowTime = timeRemainingSec <= LOW_TIME_THRESHOLD_SEC;
  const isCritical = timeRemainingSec <= CRITICAL_TIME_THRESHOLD_SEC;

  return (
    <div
      className={`${styles.timer} ${isLowTime ? styles.lowTime : ''} ${isCritical ? styles.critical : ''}`}
    >
      <span className={styles.icon}>
        <Timer size={18} />
      </span>
      <span className={styles.time}>{formatTime(timeRemainingSec)}</span>
    </div>
  );
}
