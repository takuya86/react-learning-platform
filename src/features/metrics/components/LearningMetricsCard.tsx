import { Card, CardContent } from '@/components/ui';
import type { LearningMetrics } from '../services/metricsService';
import styles from './LearningMetricsCard.module.css';

interface LearningMetricsCardProps {
  metrics: LearningMetrics;
  isLoading?: boolean;
  className?: string;
}

export function LearningMetricsCard({
  metrics,
  isLoading = false,
  className = '',
}: LearningMetricsCardProps) {
  const { streak, weeklyGoal } = metrics;
  const progressPercent = Math.min(100, (weeklyGoal.progress / weeklyGoal.target) * 100);
  const isGoalMet = weeklyGoal.progress >= weeklyGoal.target;

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
            <div className={styles.metricIcon}>🔥</div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue} data-testid="streak-value">
                {streak}
              </span>
              <span className={styles.metricLabel}>日連続</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Weekly Goal */}
          <div className={styles.metricItem} data-testid="weekly-goal-display">
            <div className={styles.metricIcon}>{isGoalMet ? '🎉' : '📅'}</div>
            <div className={styles.metricContent}>
              <div className={styles.weeklyProgress}>
                <span className={styles.metricValue} data-testid="weekly-progress-value">
                  {weeklyGoal.progress}
                </span>
                <span className={styles.goalTarget}>/ {weeklyGoal.target}</span>
              </div>
              <span className={styles.metricLabel}>今週の学習日</span>
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
