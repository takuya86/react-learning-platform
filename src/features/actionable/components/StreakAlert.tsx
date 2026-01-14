/**
 * Streak Alert Component
 *
 * streak維持のための強調表示
 */

import { useMemo } from 'react';
import type { StreakExplain } from '@/features/metrics/services/metricsExplainService';
import { buildStreakAlert } from '../services/streakAlertService';
import styles from './StreakAlert.module.css';

interface StreakAlertProps {
  streakExplain: StreakExplain;
  className?: string;
}

export function StreakAlert({ streakExplain, className = '' }: StreakAlertProps) {
  const alert = useMemo(
    () => buildStreakAlert(streakExplain.reasonCode, streakExplain.currentStreak),
    [streakExplain.reasonCode, streakExplain.currentStreak]
  );

  if (!alert.show) {
    return null;
  }

  const alertClass = alert.type === 'warning' ? styles.warning : styles.success;

  return (
    <div
      className={`${styles.container} ${alertClass} ${className}`}
      data-testid="streak-alert"
      data-alert-type={alert.type}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon}>{alert.icon}</span>
      <div className={styles.content}>
        <span className={styles.message}>{alert.message}</span>
        {alert.subMessage && <span className={styles.subMessage}>{alert.subMessage}</span>}
      </div>
    </div>
  );
}
