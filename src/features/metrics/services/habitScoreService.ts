/**
 * Habit Score Service
 *
 * 「最近どれくらい安定して学習しているか」を 0〜100 点で表す
 *
 * ## 算出ルール（仕様固定）
 * habitScore =
 *   (recentActiveDays / 7) * RECENT_DAYS_WEIGHT +
 *   (streakNormalized) * STREAK_WEIGHT +
 *   (weeklyProgressRatio) * WEEKLY_PROGRESS_WEIGHT
 *
 * ⚠️ 数値は constants.ts で一元管理
 */

import {
  HABIT_SCORE_WEIGHTS,
  HABIT_SCORE_THRESHOLDS,
  HABIT_SCORE_NORMALIZATION,
} from '../constants';

export type HabitState = 'stable' | 'warning' | 'danger';

export interface HabitScoreInput {
  recentActiveDays: number; // 過去7日で学習した日数 (0-7)
  currentStreak: number; // 現在の連続日数
  weeklyProgress: number; // 今週の進捗数
  weeklyGoalTarget: number; // 今週の目標数
}

export interface HabitScoreResult {
  score: number; // 0-100
  state: HabitState;
  components: {
    recentActivityScore: number; // 0-40
    streakScore: number; // 0-40
    weeklyScore: number; // 0-20
  };
}

/**
 * Calculate habit score from metrics
 *
 * @spec-lock Formula weights are defined in constants.ts
 */
export function buildHabitScore(input: HabitScoreInput): number {
  const { recentActiveDays, currentStreak, weeklyProgress, weeklyGoalTarget } = input;

  const { MAX_STREAK_DAYS, RECENT_DAYS_PERIOD } = HABIT_SCORE_NORMALIZATION;
  const { RECENT_DAYS, STREAK, WEEKLY_PROGRESS } = HABIT_SCORE_WEIGHTS;

  // Component 1: Recent activity
  const recentActivityScore =
    (Math.min(recentActiveDays, RECENT_DAYS_PERIOD) / RECENT_DAYS_PERIOD) * RECENT_DAYS;

  // Component 2: Streak
  const streakNormalized = Math.min(currentStreak, MAX_STREAK_DAYS) / MAX_STREAK_DAYS;
  const streakScore = streakNormalized * STREAK;

  // Component 3: Weekly progress
  const weeklyProgressRatio =
    weeklyGoalTarget > 0 ? Math.min(weeklyProgress / weeklyGoalTarget, 1) : 0;
  const weeklyScore = weeklyProgressRatio * WEEKLY_PROGRESS;

  // Total score
  const score = recentActivityScore + streakScore + weeklyScore;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Build habit score with detailed breakdown
 */
export function buildHabitScoreDetailed(input: HabitScoreInput): HabitScoreResult {
  const { recentActiveDays, currentStreak, weeklyProgress, weeklyGoalTarget } = input;

  const { MAX_STREAK_DAYS, RECENT_DAYS_PERIOD } = HABIT_SCORE_NORMALIZATION;
  const { RECENT_DAYS, STREAK, WEEKLY_PROGRESS } = HABIT_SCORE_WEIGHTS;

  // Component calculations
  const recentActivityScore =
    (Math.min(recentActiveDays, RECENT_DAYS_PERIOD) / RECENT_DAYS_PERIOD) * RECENT_DAYS;
  const streakNormalized = Math.min(currentStreak, MAX_STREAK_DAYS) / MAX_STREAK_DAYS;
  const streakScore = streakNormalized * STREAK;
  const weeklyProgressRatio =
    weeklyGoalTarget > 0 ? Math.min(weeklyProgress / weeklyGoalTarget, 1) : 0;
  const weeklyScore = weeklyProgressRatio * WEEKLY_PROGRESS;

  const score = recentActivityScore + streakScore + weeklyScore;
  const roundedScore = Math.round(score * 100) / 100;

  return {
    score: roundedScore,
    state: getHabitState(roundedScore),
    components: {
      recentActivityScore: Math.round(recentActivityScore * 100) / 100,
      streakScore: Math.round(streakScore * 100) / 100,
      weeklyScore: Math.round(weeklyScore * 100) / 100,
    },
  };
}

/**
 * Get habit state from score
 *
 * @spec-lock State thresholds are defined in constants.ts
 */
export function getHabitState(score: number): HabitState {
  const { STABLE, WARNING } = HABIT_SCORE_THRESHOLDS;

  if (score >= STABLE) {
    return 'stable';
  }
  if (score >= WARNING) {
    return 'warning';
  }
  return 'danger';
}

/**
 * Count active days in the last N days from event dates
 */
export function countRecentActiveDays(
  eventDates: string[],
  days: number = HABIT_SCORE_NORMALIZATION.RECENT_DAYS_PERIOD
): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const uniqueDates = new Set<string>();

  for (const dateStr of eventDates) {
    const date = new Date(dateStr + 'T00:00:00Z');
    const diffMs = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    // Include today and the past (days-1) days
    if (diffDays >= 0 && diffDays < days) {
      uniqueDates.add(dateStr);
    }
  }

  return uniqueDates.size;
}
