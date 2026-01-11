import { describe, it, expect } from 'vitest';
import {
  buildHabitScore,
  buildHabitScoreDetailed,
  getHabitState,
  countRecentActiveDays,
} from '@/features/metrics/services/habitScoreService';
import {
  HABIT_SCORE_WEIGHTS,
  HABIT_SCORE_THRESHOLDS,
  HABIT_SCORE_NORMALIZATION,
} from '@/features/metrics/constants';

describe('habitScoreService', () => {
  describe('buildHabitScore', () => {
    it('returns 100 for perfect metrics', () => {
      const score = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      expect(score).toBe(100);
    });

    it('returns 0 for no activity', () => {
      const score = buildHabitScore({
        recentActiveDays: 0,
        currentStreak: 0,
        weeklyProgress: 0,
        weeklyGoalTarget: 5,
      });

      expect(score).toBe(0);
    });

    it('calculates score from formula correctly', () => {
      // Formula: (recentActiveDays/7)*40 + (min(streak,7)/7)*40 + (min(progress/goal,1))*20
      // (3/7)*40 + (2/7)*40 + (2/5)*20 = 17.14 + 11.43 + 8 = 36.57
      const score = buildHabitScore({
        recentActiveDays: 3,
        currentStreak: 2,
        weeklyProgress: 2,
        weeklyGoalTarget: 5,
      });

      expect(score).toBeCloseTo(36.57, 1);
    });

    it('caps streak at 7 days for scoring', () => {
      const scoreWith7 = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      const scoreWith14 = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 14,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      // Streak capped at 7, so scores should be equal
      expect(scoreWith7).toBe(scoreWith14);
    });

    it('caps weekly progress ratio at 1', () => {
      const scoreExact = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      const scoreOver = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 10,
        weeklyGoalTarget: 5,
      });

      // Ratio capped at 1, so scores should be equal
      expect(scoreExact).toBe(scoreOver);
    });

    it('handles zero weekly goal gracefully', () => {
      const score = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 0,
        weeklyGoalTarget: 0,
      });

      // Weekly component = 0 when goal is 0
      // (7/7)*40 + (7/7)*40 + 0 = 80
      expect(score).toBe(80);
    });
  });

  describe('buildHabitScoreDetailed', () => {
    it('returns score and state with component breakdown', () => {
      const result = buildHabitScoreDetailed({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      expect(result.score).toBe(100);
      expect(result.state).toBe('stable');
      expect(result.components.recentActivityScore).toBe(40);
      expect(result.components.streakScore).toBe(40);
      expect(result.components.weeklyScore).toBe(20);
    });
  });

  describe('getHabitState', () => {
    it('returns stable for score >= 80', () => {
      expect(getHabitState(80)).toBe('stable');
      expect(getHabitState(100)).toBe('stable');
      expect(getHabitState(90)).toBe('stable');
    });

    it('returns warning for score 50-79', () => {
      expect(getHabitState(50)).toBe('warning');
      expect(getHabitState(79)).toBe('warning');
      expect(getHabitState(65)).toBe('warning');
    });

    it('returns danger for score < 50', () => {
      expect(getHabitState(0)).toBe('danger');
      expect(getHabitState(49)).toBe('danger');
      expect(getHabitState(30)).toBe('danger');
    });
  });

  describe('countRecentActiveDays', () => {
    it('counts unique days in last 7 days', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const eventDates = [todayStr, todayStr, yesterdayStr]; // 2 unique days

      const count = countRecentActiveDays(eventDates, 7);
      expect(count).toBe(2);
    });

    it('ignores events older than specified days', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const oldDate = new Date(today);
      oldDate.setDate(oldDate.getDate() - 10);
      const oldStr = oldDate.toISOString().split('T')[0];

      const eventDates = [todayStr, oldStr];

      const count = countRecentActiveDays(eventDates, 7);
      expect(count).toBe(1);
    });

    it('returns 0 for empty array', () => {
      const count = countRecentActiveDays([], 7);
      expect(count).toBe(0);
    });
  });

  describe('spec-locking', () => {
    it('[spec-lock] 7日連続 + weekly達成 → stable', () => {
      const score = buildHabitScore({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      expect(score).toBe(100);
      expect(getHabitState(score)).toBe('stable');
    });

    it('[spec-lock] 2日未学習 → warning', () => {
      // 5 days active (missed 2), streak 5, weekly on track
      const score = buildHabitScore({
        recentActiveDays: 5,
        currentStreak: 5,
        weeklyProgress: 3,
        weeklyGoalTarget: 5,
      });

      // (5/7)*40 + (5/7)*40 + (3/5)*20 = 28.57 + 28.57 + 12 = 69.14
      expect(getHabitState(score)).toBe('warning');
    });

    it('[spec-lock] streak切断 + weekly未達 → danger', () => {
      // Streak broken (0), low weekly progress
      const score = buildHabitScore({
        recentActiveDays: 1,
        currentStreak: 0,
        weeklyProgress: 1,
        weeklyGoalTarget: 5,
      });

      // (1/7)*40 + (0/7)*40 + (1/5)*20 = 5.71 + 0 + 4 = 9.71
      expect(getHabitState(score)).toBe('danger');
    });

    it('[spec-lock] state thresholds are exact: 80, 50', () => {
      expect(getHabitState(79.99)).toBe('warning');
      expect(getHabitState(80)).toBe('stable');
      expect(getHabitState(49.99)).toBe('danger');
      expect(getHabitState(50)).toBe('warning');
    });

    it('[spec-lock] formula component weights: 40 + 40 + 20 = 100', () => {
      // Each component at max
      const result = buildHabitScoreDetailed({
        recentActiveDays: 7,
        currentStreak: 7,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      expect(result.components.recentActivityScore).toBe(40);
      expect(result.components.streakScore).toBe(40);
      expect(result.components.weeklyScore).toBe(20);
    });
  });

  describe('constants integration', () => {
    it('weights sum to 100', () => {
      const { RECENT_DAYS, STREAK, WEEKLY_PROGRESS } = HABIT_SCORE_WEIGHTS;
      expect(RECENT_DAYS + STREAK + WEEKLY_PROGRESS).toBe(100);
    });

    it('service uses HABIT_SCORE_WEIGHTS for component scores', () => {
      const result = buildHabitScoreDetailed({
        recentActiveDays: HABIT_SCORE_NORMALIZATION.RECENT_DAYS_PERIOD,
        currentStreak: HABIT_SCORE_NORMALIZATION.MAX_STREAK_DAYS,
        weeklyProgress: 5,
        weeklyGoalTarget: 5,
      });

      expect(result.components.recentActivityScore).toBe(HABIT_SCORE_WEIGHTS.RECENT_DAYS);
      expect(result.components.streakScore).toBe(HABIT_SCORE_WEIGHTS.STREAK);
      expect(result.components.weeklyScore).toBe(HABIT_SCORE_WEIGHTS.WEEKLY_PROGRESS);
    });

    it('getHabitState uses HABIT_SCORE_THRESHOLDS', () => {
      const { STABLE, WARNING } = HABIT_SCORE_THRESHOLDS;

      expect(getHabitState(STABLE)).toBe('stable');
      expect(getHabitState(STABLE - 0.01)).toBe('warning');
      expect(getHabitState(WARNING)).toBe('warning');
      expect(getHabitState(WARNING - 0.01)).toBe('danger');
    });

    it('MAX_STREAK_DAYS caps streak contribution', () => {
      const { MAX_STREAK_DAYS } = HABIT_SCORE_NORMALIZATION;

      const scoreAtMax = buildHabitScore({
        recentActiveDays: 0,
        currentStreak: MAX_STREAK_DAYS,
        weeklyProgress: 0,
        weeklyGoalTarget: 5,
      });

      const scoreAboveMax = buildHabitScore({
        recentActiveDays: 0,
        currentStreak: MAX_STREAK_DAYS + 10,
        weeklyProgress: 0,
        weeklyGoalTarget: 5,
      });

      expect(scoreAtMax).toBe(scoreAboveMax);
    });

    it('RECENT_DAYS_PERIOD defines the counting window', () => {
      const { RECENT_DAYS_PERIOD } = HABIT_SCORE_NORMALIZATION;
      expect(RECENT_DAYS_PERIOD).toBe(7);
    });
  });
});
