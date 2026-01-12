/**
 * Learning Metrics Service
 *
 * Pure functions for calculating learning metrics.
 * All date calculations use UTC to ensure consistency across timezones.
 *
 * ## 仕様（固定）
 *
 * ### 日付計算
 * - UTC基準のYYYY-MM-DD形式を使用
 *
 * ### Streak計算ルール
 * - last_date == today: 変化なし（現在のstreakを維持）
 * - last_date == yesterday: streak + 1
 * - それ以外 or null: streak = 1（リセット）
 *
 * ### Weekly Goal
 * - type: 'days'（学習日数ベース）
 * - progress: 今週のユニーク学習日数
 * - week start: 月曜日 00:00 UTC
 */

export type LearningEventType =
  | 'lesson_completed'
  | 'lesson_viewed'
  | 'quiz_completed'
  | 'quiz_started'
  | 'note_updated'
  | 'note_created'
  | 'review_started'
  | 'next_lesson_opened'
  | 'intervention_shown'
  | 'insights_shown'
  | 'lifecycle_applied';

export interface LearningEvent {
  id?: string;
  user_id: string;
  event_type: LearningEventType;
  event_date: string; // YYYY-MM-DD UTC
  reference_id?: string;
  created_at?: string;
}

export interface LearningMetrics {
  streak: number;
  lastActivityDate: string | null; // YYYY-MM-DD UTC
  weeklyGoal: {
    type: 'days';
    target: number;
    progress: number;
    weekStartDate: string; // YYYY-MM-DD UTC (Monday)
  };
}

export const DEFAULT_WEEKLY_TARGET = 5;

/**
 * Get current UTC date as YYYY-MM-DD string
 */
export function getUTCDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the Monday of the week for a given date (UTC)
 */
export function getWeekStartUTC(date: Date = new Date()): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = utcDate.getUTCDay();
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  // We want Monday as start, so adjust: if Sunday (0), go back 6 days; else go back (day - 1)
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  utcDate.setUTCDate(utcDate.getUTCDate() - daysToSubtract);
  return getUTCDateString(utcDate);
}

/**
 * Check if two dates are the same day (UTC)
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Check if date1 is yesterday relative to date2 (UTC)
 */
export function isYesterday(date1: string, date2: string): boolean {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  const diffMs = d2.getTime() - d1.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return diffMs === oneDayMs;
}

/**
 * Calculate new streak value based on last activity date and today
 *
 * ## Streak計算仕様
 * - last_date == today: 現在のstreakを維持（変化なし）
 * - last_date == yesterday: streak + 1
 * - それ以外 or null: streak = 1（リセット）
 */
export function calculateStreak(
  currentStreak: number,
  lastActivityDate: string | null,
  today: string
): number {
  if (!lastActivityDate) {
    // 初回の学習活動
    return 1;
  }

  if (isSameDay(lastActivityDate, today)) {
    // 今日すでに学習済み - 変化なし
    return currentStreak;
  }

  if (isYesterday(lastActivityDate, today)) {
    // 昨日学習した - streak継続
    return currentStreak + 1;
  }

  // それ以外 - streakリセット
  return 1;
}

/**
 * Calculate weekly progress (unique study days this week)
 */
export function calculateWeeklyProgress(eventDates: string[], weekStart: string): number {
  const weekStartDate = new Date(weekStart + 'T00:00:00Z');
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);

  const uniqueDays = new Set<string>();

  for (const dateStr of eventDates) {
    const eventDate = new Date(dateStr + 'T00:00:00Z');
    if (eventDate >= weekStartDate && eventDate < weekEndDate) {
      uniqueDays.add(dateStr);
    }
  }

  return uniqueDays.size;
}

/**
 * Update metrics based on a new learning event
 */
export function updateMetricsOnEvent(
  currentMetrics: LearningMetrics,
  eventDate: string,
  today: string = getUTCDateString()
): LearningMetrics {
  const weekStart = getWeekStartUTC(new Date(today + 'T00:00:00Z'));

  // Calculate new streak
  const newStreak = calculateStreak(
    currentMetrics.streak,
    currentMetrics.lastActivityDate,
    eventDate
  );

  // Check if we need to reset weekly progress (new week started)
  const isNewWeek = currentMetrics.weeklyGoal.weekStartDate !== weekStart;
  let newWeeklyProgress = currentMetrics.weeklyGoal.progress;

  if (isNewWeek) {
    // New week - start fresh, this event counts as day 1
    newWeeklyProgress = 1;
  } else if (currentMetrics.lastActivityDate !== eventDate) {
    // Same week, but new day - increment progress
    newWeeklyProgress = currentMetrics.weeklyGoal.progress + 1;
  }
  // If same week and same day, progress unchanged

  return {
    streak: newStreak,
    lastActivityDate: eventDate,
    weeklyGoal: {
      type: 'days',
      target: currentMetrics.weeklyGoal.target,
      progress: newWeeklyProgress,
      weekStartDate: weekStart,
    },
  };
}

/**
 * Create initial metrics for a new user
 */
export function createInitialMetrics(): LearningMetrics {
  return {
    streak: 0,
    lastActivityDate: null,
    weeklyGoal: {
      type: 'days',
      target: DEFAULT_WEEKLY_TARGET,
      progress: 0,
      weekStartDate: getWeekStartUTC(),
    },
  };
}

/**
 * Recalculate metrics from scratch given all event dates
 * Used for re-syncing or rebuilding metrics
 */
export function recalculateMetrics(
  eventDates: string[],
  today: string = getUTCDateString(),
  target: number = DEFAULT_WEEKLY_TARGET
): LearningMetrics {
  if (eventDates.length === 0) {
    return createInitialMetrics();
  }

  // Sort dates in ascending order
  const sortedDates = [...new Set(eventDates)].sort();
  const weekStart = getWeekStartUTC(new Date(today + 'T00:00:00Z'));

  // Calculate weekly progress
  const weeklyProgress = calculateWeeklyProgress(sortedDates, weekStart);

  // Calculate streak from the sorted dates
  let streak = 0;
  const lastDate = sortedDates[sortedDates.length - 1];

  // Check if the last activity was today or yesterday
  if (isSameDay(lastDate, today) || isYesterday(lastDate, today)) {
    // Count consecutive days backwards from the most recent activity
    streak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = sortedDates[i + 1];
      const prevDate = sortedDates[i];
      if (isYesterday(prevDate, currentDate)) {
        streak++;
      } else if (!isSameDay(prevDate, currentDate)) {
        break;
      }
    }
  }

  return {
    streak,
    lastActivityDate: lastDate,
    weeklyGoal: {
      type: 'days',
      target,
      progress: weeklyProgress,
      weekStartDate: weekStart,
    },
  };
}
