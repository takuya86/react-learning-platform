/**
 * Action Recommendation Service
 *
 * 「今日のおすすめ」アクションを決定するロジック
 *
 * ## 仕様
 * - 未完了 + unlocked + 最短時間のレッスンを推薦
 * - streak/weekly goalの状態に応じた説明文を生成
 */

import type { LoadedLesson } from '@/lib/lessons';
import type {
  StreakReasonCode,
  WeeklyReasonCode,
} from '@/features/metrics/services/metricsExplainService';

export interface TodayActionRecommendation {
  lesson: LoadedLesson | null;
  hasAction: boolean;
  headline: string;
  reason: string;
  ctaText: string;
  urgency: 'high' | 'medium' | 'low' | 'none';
}

interface BuildRecommendationParams {
  recommendations: LoadedLesson[];
  streakReasonCode: StreakReasonCode;
  weeklyReasonCode: WeeklyReasonCode;
  currentStreak: number;
  remainingWeeklyEvents: number;
}

/**
 * Select the best lesson for today
 * Priority: shortest estimated time among unlocked lessons
 */
export function selectBestLesson(lessons: LoadedLesson[]): LoadedLesson | null {
  if (lessons.length === 0) return null;

  // Sort by estimated time (shortest first)
  const sorted = [...lessons].sort((a, b) => {
    const timeA = a.estimatedMinutes || 999;
    const timeB = b.estimatedMinutes || 999;
    return timeA - timeB;
  });

  return sorted[0];
}

/**
 * Determine urgency level based on streak and weekly status
 */
export function determineUrgency(
  streakReasonCode: StreakReasonCode,
  weeklyReasonCode: WeeklyReasonCode,
  currentStreak: number
): TodayActionRecommendation['urgency'] {
  // High urgency: streak at risk or behind on weekly
  if (streakReasonCode === 'ACTIVE_YESTERDAY' && currentStreak > 0) {
    return 'high';
  }

  if (weeklyReasonCode === 'BEHIND') {
    return 'high';
  }

  // Medium urgency: active but could do more
  if (streakReasonCode === 'ACTIVE_TODAY' || weeklyReasonCode === 'ON_TRACK') {
    return 'medium';
  }

  // Low: no streak to maintain or achieved
  if (
    streakReasonCode === 'NO_ACTIVITY_YET' ||
    streakReasonCode === 'BROKEN' ||
    weeklyReasonCode === 'ACHIEVED'
  ) {
    return 'low';
  }

  return 'none';
}

/**
 * Generate headline based on urgency and status
 */
export function generateHeadline(
  urgency: TodayActionRecommendation['urgency'],
  streakReasonCode: StreakReasonCode,
  weeklyReasonCode: WeeklyReasonCode,
  currentStreak: number
): string {
  switch (urgency) {
    case 'high':
      if (streakReasonCode === 'ACTIVE_YESTERDAY') {
        return `${currentStreak}日連続を守ろう！`;
      }
      return '今週の目標達成まであと少し！';
    case 'medium':
      if (streakReasonCode === 'ACTIVE_TODAY') {
        return 'もう少し学習を続けよう！';
      }
      return '今日のおすすめレッスン';
    case 'low':
      if (weeklyReasonCode === 'ACHIEVED') {
        return '目標達成！さらに学習を進めよう';
      }
      return '今日から学習を始めよう！';
    default:
      return '次のステップ';
  }
}

/**
 * Generate reason text explaining why this action matters
 */
export function generateReason(
  lesson: LoadedLesson,
  streakReasonCode: StreakReasonCode,
  weeklyReasonCode: WeeklyReasonCode,
  currentStreak: number,
  remainingWeeklyEvents: number
): string {
  const parts: string[] = [];

  // Streak reason
  if (streakReasonCode === 'ACTIVE_YESTERDAY' && currentStreak > 0) {
    parts.push(`今日学習すると${currentStreak + 1}日連続になります`);
  } else if (streakReasonCode === 'ACTIVE_TODAY') {
    parts.push('連続記録継続中');
  }

  // Weekly reason
  if (weeklyReasonCode === 'BEHIND' && remainingWeeklyEvents > 0) {
    parts.push(`週目標まであと${remainingWeeklyEvents}回`);
  } else if (weeklyReasonCode === 'ON_TRACK' && remainingWeeklyEvents > 0) {
    parts.push(`目標まであと${remainingWeeklyEvents}回`);
  } else if (weeklyReasonCode === 'ACHIEVED') {
    parts.push('今週の目標達成済み');
  }

  // Lesson info
  if (lesson.estimatedMinutes) {
    parts.push(`約${lesson.estimatedMinutes}分で完了`);
  }

  return parts.join(' • ') || 'このレッスンを完了しましょう';
}

/**
 * Build today's action recommendation
 */
export function buildTodayActionRecommendation(
  params: BuildRecommendationParams
): TodayActionRecommendation {
  const {
    recommendations,
    streakReasonCode,
    weeklyReasonCode,
    currentStreak,
    remainingWeeklyEvents,
  } = params;

  const lesson = selectBestLesson(recommendations);

  if (!lesson) {
    return {
      lesson: null,
      hasAction: false,
      headline: 'すべてのレッスンを完了しました！',
      reason: 'おめでとうございます！',
      ctaText: '',
      urgency: 'none',
    };
  }

  const urgency = determineUrgency(streakReasonCode, weeklyReasonCode, currentStreak);
  const headline = generateHeadline(urgency, streakReasonCode, weeklyReasonCode, currentStreak);
  const reason = generateReason(
    lesson,
    streakReasonCode,
    weeklyReasonCode,
    currentStreak,
    remainingWeeklyEvents
  );

  return {
    lesson,
    hasAction: true,
    headline,
    reason,
    ctaText: '今すぐ始める',
    urgency,
  };
}
