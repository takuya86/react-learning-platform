import { useState, useCallback } from 'react';
import { Flame, PartyPopper, Calendar, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import type { LearningMetrics } from '../services/metricsService';
import type { StreakExplain, WeeklyGoalExplain } from '../services/metricsExplainService';
import styles from './LearningMetricsCard.module.css';

interface LearningMetricsCardProps {
  metrics: LearningMetrics;
  streakExplain?: StreakExplain;
  weeklyExplain?: WeeklyGoalExplain;
  isLoading?: boolean;
  className?: string;
}

export function LearningMetricsCard({
  metrics,
  streakExplain,
  weeklyExplain,
  isLoading = false,
  className = '',
}: LearningMetricsCardProps) {
  const { streak, weeklyGoal } = metrics;
  const progressPercent = Math.min(100, (weeklyGoal.progress / weeklyGoal.target) * 100);
  const isGoalMet = weeklyGoal.progress >= weeklyGoal.target;

  const [streakPopoverOpen, setStreakPopoverOpen] = useState(false);
  const [weeklyPopoverOpen, setWeeklyPopoverOpen] = useState(false);

  const toggleStreakPopover = useCallback(() => {
    setStreakPopoverOpen((prev) => !prev);
    setWeeklyPopoverOpen(false);
  }, []);

  const toggleWeeklyPopover = useCallback(() => {
    setWeeklyPopoverOpen((prev) => !prev);
    setStreakPopoverOpen(false);
  }, []);

  if (isLoading) {
    return (
      <Card className={`${styles.card} ${className}`} data-testid="learning-metrics-loading">
        <CardContent>
          <div className={styles.metricsRow}>
            <div className={styles.metricItem}>
              <div className={styles.skeleton} />
            </div>
            <div className={styles.metricItem}>
              <div className={styles.skeleton} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${styles.card} ${className}`} data-testid="learning-metrics-card">
      <CardContent>
        <div className={styles.metricsRow}>
          {/* Streak */}
          <div className={styles.metricItem} data-testid="streak-display">
            <div className={styles.metricIcon}>
              <Flame size={24} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricHeader}>
                <span className={styles.metricValue} data-testid="streak-value">
                  {streak}
                </span>
                <span className={styles.metricLabel}>日連続</span>
                {streakExplain && (
                  <div className={styles.explainWrapper}>
                    <button
                      type="button"
                      className={styles.explainButton}
                      onClick={toggleStreakPopover}
                      aria-label="連続記録の説明を表示"
                      data-testid="streak-explain-button"
                    >
                      <Info size={14} />
                    </button>
                    {streakPopoverOpen && (
                      <div className={styles.popover} data-testid="streak-explain-popover">
                        <p className={styles.popoverMessage}>{streakExplain.message}</p>
                        <ul className={styles.popoverDetails}>
                          {streakExplain.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Weekly Goal */}
          <div className={styles.metricItem} data-testid="weekly-goal-display">
            <div className={styles.metricIcon}>
              {isGoalMet ? <PartyPopper size={24} /> : <Calendar size={24} />}
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricHeader}>
                <div className={styles.weeklyProgress}>
                  <span className={styles.metricValue} data-testid="weekly-progress-value">
                    {weeklyGoal.progress}
                  </span>
                  <span className={styles.goalTarget}>/ {weeklyGoal.target}</span>
                </div>
                <span className={styles.metricLabel}>今週の学習日</span>
                {weeklyExplain && (
                  <div className={styles.explainWrapper}>
                    <button
                      type="button"
                      className={styles.explainButton}
                      onClick={toggleWeeklyPopover}
                      aria-label="週間目標の説明を表示"
                      data-testid="weekly-explain-button"
                    >
                      <Info size={14} />
                    </button>
                    {weeklyPopoverOpen && (
                      <div className={styles.popover} data-testid="weekly-explain-popover">
                        <p className={styles.popoverMessage}>{weeklyExplain.message}</p>
                        <ul className={styles.popoverDetails}>
                          {weeklyExplain.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${isGoalMet ? styles.goalMet : ''}`}
                  style={{ width: `${progressPercent}%` }}
                  data-testid="weekly-progress-bar"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
