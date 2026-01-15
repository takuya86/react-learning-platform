/**
 * Weekly Countdown Component
 *
 * 週間目標の残り量表示
 */

import { useMemo } from 'react';
import { PartyPopper } from 'lucide-react';
import type { WeeklyGoalExplain } from '@/features/metrics/services/metricsExplainService';
import { buildWeeklyCountdown } from '../services/weeklyCountdownService';
import styles from './WeeklyCountdown.module.css';

interface WeeklyCountdownProps {
  weeklyExplain: WeeklyGoalExplain;
  className?: string;
}

export function WeeklyCountdown({ weeklyExplain, className = '' }: WeeklyCountdownProps) {
  const countdown = useMemo(
    () =>
      buildWeeklyCountdown({
        goalTarget: weeklyExplain.goalPerWeek,
        progress: weeklyExplain.completedDaysThisWeek,
        weekStartUTC: weeklyExplain.weekStartUTC,
        reasonCode: weeklyExplain.reasonCode,
      }),
    [
      weeklyExplain.goalPerWeek,
      weeklyExplain.completedDaysThisWeek,
      weeklyExplain.weekStartUTC,
      weeklyExplain.reasonCode,
    ]
  );

  if (!countdown.show) {
    return null;
  }

  const typeClass = styles[countdown.type] || '';

  return (
    <div
      className={`${styles.container} ${typeClass} ${className}`}
      data-testid="weekly-countdown"
      data-countdown-type={countdown.type}
      role="status"
      aria-live="polite"
    >
      <div className={styles.content}>
        <span className={styles.message}>{countdown.message}</span>
        {countdown.subMessage && <span className={styles.subMessage}>{countdown.subMessage}</span>}
      </div>

      {countdown.type !== 'achieved' && (
        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(100, (countdown.progress / countdown.goalTarget) * 100)}%`,
              }}
            />
          </div>
          <span className={styles.progressText}>
            {countdown.progress}/{countdown.goalTarget}
          </span>
        </div>
      )}

      {countdown.type === 'achieved' && (
        <span className={styles.achievedIcon}>
          <PartyPopper size={20} />
        </span>
      )}
    </div>
  );
}
