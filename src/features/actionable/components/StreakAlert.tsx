/**
 * Streak Alert Component
 *
 * streak維持のための強調表示
 */

import { useMemo } from 'react';
import { Check, AlertTriangle, Flame } from 'lucide-react';
import type { StreakExplain } from '@/features/metrics/services/metricsExplainService';
import { buildStreakAlert, type StreakAlertIcon } from '../services/streakAlertService';
import styles from './StreakAlert.module.css';

const iconMap: Record<StreakAlertIcon, React.ReactNode> = {
  check: <Check size={18} />,
  'alert-triangle': <AlertTriangle size={18} />,
  flame: <Flame size={18} />,
  '': null,
};

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
      <span className={styles.icon}>{iconMap[alert.iconName]}</span>
      <div className={styles.content}>
        <span className={styles.message}>{alert.message}</span>
        {alert.subMessage && <span className={styles.subMessage}>{alert.subMessage}</span>}
      </div>
    </div>
  );
}
