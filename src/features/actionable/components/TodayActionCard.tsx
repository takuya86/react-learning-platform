/**
 * Today Action Card Component
 *
 * 今日のおすすめアクションを表示するカード
 * ストリーク/週目標と連動した説明付き
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { Card, CardContent, Badge } from '@/components/ui';
import type { LoadedLesson } from '@/lib/lessons';
import type {
  StreakExplain,
  WeeklyGoalExplain,
} from '@/features/metrics/services/metricsExplainService';
import { buildTodayActionRecommendation } from '../services/actionRecommendationService';
import styles from './TodayActionCard.module.css';

interface TodayActionCardProps {
  recommendations: LoadedLesson[];
  streakExplain: StreakExplain;
  weeklyExplain: WeeklyGoalExplain;
  className?: string;
}

export function TodayActionCard({
  recommendations,
  streakExplain,
  weeklyExplain,
  className = '',
}: TodayActionCardProps) {
  const action = useMemo(() => {
    const remainingEvents = Math.max(
      0,
      weeklyExplain.goalPerWeek - weeklyExplain.completedDaysThisWeek
    );

    return buildTodayActionRecommendation({
      recommendations,
      streakReasonCode: streakExplain.reasonCode,
      weeklyReasonCode: weeklyExplain.reasonCode,
      currentStreak: streakExplain.currentStreak,
      remainingWeeklyEvents: remainingEvents,
    });
  }, [recommendations, streakExplain, weeklyExplain]);

  if (!action.hasAction) {
    return (
      <Card
        className={`${styles.card} ${styles.completed} ${className}`}
        data-testid="today-action-card"
      >
        <CardContent>
          <div className={styles.completedContent}>
            <span className={styles.completedIcon}>🎊</span>
            <div className={styles.completedText}>
              <h3 className={styles.headline}>{action.headline}</h3>
              <p className={styles.reason}>{action.reason}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { lesson } = action;
  const urgencyClass = styles[action.urgency] || '';

  return (
    <Card
      className={`${styles.card} ${urgencyClass} ${className}`}
      data-testid="today-action-card"
      data-urgency={action.urgency}
    >
      <CardContent>
        <div className={styles.header}>
          <h3 className={styles.headline}>{action.headline}</h3>
          <Badge variant={action.urgency === 'high' ? 'warning' : 'primary'}>
            {lesson?.difficulty || 'beginner'}
          </Badge>
        </div>

        <div className={styles.lessonInfo}>
          <h4 className={styles.lessonTitle}>{lesson?.title}</h4>
          <p className={styles.lessonDescription}>{lesson?.description}</p>
        </div>

        <div className={styles.reason}>
          <span className={styles.reasonIcon}>
            <Lightbulb size={16} />
          </span>
          <span>{action.reason}</span>
        </div>

        <Link
          to={`/lessons/${lesson?.id}`}
          className={styles.ctaButton}
          data-testid="today-action-cta"
        >
          {action.ctaText}
        </Link>
      </CardContent>
    </Card>
  );
}
