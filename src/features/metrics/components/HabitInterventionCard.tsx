/**
 * Habit Intervention Card
 *
 * 途切れそうな学習を救うための介入UI
 *
 * ## 設計方針
 * - 責めない・押し付けない・自然に戻す
 * - ❌ 赤・警告アイコン禁止
 * - ❌ 数値の押し付け禁止
 * - ⭕ 行動を1つだけ提示
 * - ⭕ 5秒で理解できる文量
 *
 * ## ログ記録
 * - STREAK_RESCUE / WEEKLY_CATCHUP 表示時にログを記録
 * - POSITIVE は記録しない
 */

import { useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Calendar, Sparkles, Target } from 'lucide-react';
import { Card } from '@/components/ui';
import type { InterventionIconName } from '../constants';
import { useLearningMetrics } from '../hooks/useLearningMetrics';
import { buildHabitScore, getHabitState } from '../services/habitScoreService';
import {
  buildIntervention,
  hasInterventionCta,
  shouldLogIntervention,
} from '../services/interventionService';
import { useRecommendations } from '@/features/insights';
import { selectBestLesson } from '@/features/actionable/services/actionRecommendationService';
import styles from './HabitInterventionCard.module.css';

const iconMap: Record<InterventionIconName, React.ReactNode> = {
  sprout: <Sprout size={20} />,
  calendar: <Calendar size={20} />,
  sparkles: <Sparkles size={20} />,
  target: <Target size={20} />,
};

interface HabitInterventionCardProps {
  recentActiveDays: number; // 過去7日で学習した日数
  className?: string;
}

export function HabitInterventionCard({
  recentActiveDays,
  className = '',
}: HabitInterventionCardProps) {
  const { metrics, streakExplain, weeklyExplain, recordEvent } = useLearningMetrics();
  const { recommendations } = useRecommendations({ limit: 5 });

  // Track if we've already logged this intervention (prevent duplicate logs)
  const loggedInterventionRef = useRef<string | null>(null);

  // Calculate habit score and determine intervention
  const habitScore = useMemo(() => {
    return buildHabitScore({
      recentActiveDays,
      currentStreak: metrics.streak,
      weeklyProgress: metrics.weeklyGoal.progress,
      weeklyGoalTarget: metrics.weeklyGoal.target,
    });
  }, [recentActiveDays, metrics]);

  const habitState = useMemo(() => getHabitState(habitScore), [habitScore]);

  const intervention = useMemo(() => {
    return buildIntervention({
      habitState,
      streakExplain,
      weeklyExplain,
    });
  }, [habitState, streakExplain, weeklyExplain]);

  // Log intervention when displayed (only for STREAK_RESCUE and WEEKLY_CATCHUP)
  useEffect(() => {
    if (!intervention) return;
    if (!shouldLogIntervention(intervention)) return;

    // Prevent duplicate logging for the same intervention type
    if (loggedInterventionRef.current === intervention.type) return;

    // Record the event
    recordEvent('intervention_shown', intervention.type);
    loggedInterventionRef.current = intervention.type;
  }, [intervention, recordEvent]);

  // Get best lesson for CTA
  const bestLesson = useMemo(() => {
    return selectBestLesson(recommendations);
  }, [recommendations]);

  // Don't render if no intervention needed
  if (!intervention) {
    return null;
  }

  const hasCta = hasInterventionCta(intervention);
  const lessonPath = bestLesson ? `/lessons/${bestLesson.id}` : '/roadmap';

  return (
    <Card
      className={`${styles.card} ${styles[intervention.type.toLowerCase()]} ${className}`}
      data-testid="habit-intervention-card"
      data-intervention-type={intervention.type}
    >
      <div className={styles.content}>
        <span className={styles.icon}>{iconMap[intervention.iconName]}</span>
        <div className={styles.textContent}>
          <p className={styles.message}>{intervention.message}</p>
          <p className={styles.subMessage}>{intervention.subMessage}</p>
        </div>
        {hasCta && 'ctaText' in intervention && (
          <Link to={lessonPath} className={styles.cta} data-testid="intervention-cta">
            {intervention.ctaText}
          </Link>
        )}
      </div>
    </Card>
  );
}
