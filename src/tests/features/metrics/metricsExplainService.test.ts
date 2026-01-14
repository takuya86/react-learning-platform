/**
 * Metrics Explain Service Tests
 *
 * P1-3 仕様固定テスト:
 * - Streak: ACTIVE_TODAY, ACTIVE_YESTERDAY, NO_ACTIVITY_YET, BROKEN, RECOVERED
 * - Weekly: ACHIEVED, ON_TRACK, BEHIND, NO_GOAL
 */

import { describe, it, expect } from 'vitest';
import {
  buildStreakExplain,
  buildWeeklyGoalExplain,
  buildMetricsExplain,
  type StreakReasonCode,
  type WeeklyReasonCode,
} from '@/features/metrics/services/metricsExplainService';

describe('metricsExplainService', () => {
  describe('buildStreakExplain', () => {
    // [仕様固定] today == last_date → ACTIVE_TODAY
    it('returns ACTIVE_TODAY when lastActivityDate equals today', () => {
      const result = buildStreakExplain({
        currentStreak: 5,
        lastActivityDate: '2024-01-15',
        todayCount: 2,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('ACTIVE_TODAY');
      expect(result.message).toContain('今日はすでに学習済み');
      expect(result.details).toContain('本日の学習回数: 2');
      expect(result.details).toContain('最終学習日(UTC): 2024-01-15');
      expect(result.details).toContain('判定: ACTIVE_TODAY');
    });

    // [仕様固定] yesterday == last_date → ACTIVE_YESTERDAY
    it('returns ACTIVE_YESTERDAY when lastActivityDate equals yesterday', () => {
      const result = buildStreakExplain({
        currentStreak: 3,
        lastActivityDate: '2024-01-14',
        todayCount: 0,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('ACTIVE_YESTERDAY');
      expect(result.message).toContain('昨日学習しました');
      expect(result.message).toContain('今日も学習して');
    });

    it('returns ACTIVE_YESTERDAY with different message when today has activity', () => {
      const result = buildStreakExplain({
        currentStreak: 4,
        lastActivityDate: '2024-01-14',
        todayCount: 1,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('ACTIVE_YESTERDAY');
      expect(result.message).toContain('昨日に続き今日も学習');
    });

    // [仕様固定] last_date null & todayCount 0 → NO_ACTIVITY_YET
    it('returns NO_ACTIVITY_YET when no activity ever', () => {
      const result = buildStreakExplain({
        currentStreak: 0,
        lastActivityDate: null,
        todayCount: 0,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('NO_ACTIVITY_YET');
      expect(result.message).toContain('まだ学習を始めていません');
      expect(result.details).toContain('最終学習日(UTC): なし');
    });

    // [仕様固定] last_date <= 2日前 → BROKEN
    it('returns BROKEN when lastActivityDate is 2 or more days ago', () => {
      const result = buildStreakExplain({
        currentStreak: 0,
        lastActivityDate: '2024-01-10',
        todayCount: 0,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('BROKEN');
      expect(result.message).toContain('5日間学習がありませんでした');
      expect(result.details).toContain('経過日数: 5日');
    });

    // RECOVERED: streak restarted today after break
    it('returns RECOVERED when streak restarted after break', () => {
      const result = buildStreakExplain({
        currentStreak: 1,
        lastActivityDate: '2024-01-10',
        todayCount: 1,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('RECOVERED');
      expect(result.message).toContain('5日ぶりに学習を再開');
    });

    it('returns RECOVERED when first activity with null lastActivityDate and todayCount > 0', () => {
      const result = buildStreakExplain({
        currentStreak: 1,
        lastActivityDate: null,
        todayCount: 1,
        todayUTC: '2024-01-15',
      });

      expect(result.reasonCode).toBe<StreakReasonCode>('RECOVERED');
      expect(result.message).toContain('学習を始めました');
    });

    // Verify details array structure
    it('includes all required details', () => {
      const result = buildStreakExplain({
        currentStreak: 5,
        lastActivityDate: '2024-01-15',
        todayCount: 3,
        todayUTC: '2024-01-15',
      });

      expect(result.details.length).toBeGreaterThanOrEqual(3);
      expect(result.details.some((d) => d.startsWith('本日の学習回数:'))).toBe(true);
      expect(result.details.some((d) => d.startsWith('最終学習日(UTC):'))).toBe(true);
      expect(result.details.some((d) => d.startsWith('判定:'))).toBe(true);
    });
  });

  describe('buildWeeklyGoalExplain', () => {
    // [仕様固定] completedDaysThisWeek >= goalPerWeek → ACHIEVED
    it('returns ACHIEVED when goal is met', () => {
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 5,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-12',
      });

      expect(result.reasonCode).toBe<WeeklyReasonCode>('ACHIEVED');
      expect(result.message).toContain('目標を達成');
    });

    it('returns ACHIEVED when goal is exceeded', () => {
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 7,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-14',
      });

      expect(result.reasonCode).toBe<WeeklyReasonCode>('ACHIEVED');
    });

    // ON_TRACK: on pace to achieve goal
    it('returns ON_TRACK when progress is ahead of expected', () => {
      // Day 3 of week, 3/5 completed = ahead of (3/7)*5 = 2.14
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 3,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-10', // Wed = day 3
      });

      expect(result.reasonCode).toBe<WeeklyReasonCode>('ON_TRACK');
      expect(result.message).toContain('順調');
    });

    // BEHIND: behind pace
    it('returns BEHIND when progress is behind expected', () => {
      // Day 5 of week, 1/5 completed = behind (5/7)*5 = 3.57
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 1,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-12', // Fri = day 5
      });

      expect(result.reasonCode).toBe<WeeklyReasonCode>('BEHIND');
      expect(result.message).toContain('学習が必要');
    });

    // [仕様固定] completedDaysThisWeek == 0 → BEHIND
    it('returns BEHIND when no activity this week', () => {
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 0,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-10',
      });

      expect(result.reasonCode).toBe<WeeklyReasonCode>('BEHIND');
      expect(result.message).toContain('まだ学習していません');
    });

    // NO_GOAL: goalPerWeek == 0
    it('returns NO_GOAL when goal is not set', () => {
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 0,
        completedDaysThisWeek: 3,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-10',
      });

      expect(result.reasonCode).toBe<WeeklyReasonCode>('NO_GOAL');
      expect(result.message).toContain('目標が設定されていません');
    });

    // Verify weekEndUTC calculation
    it('calculates weekEndUTC correctly (6 days after start)', () => {
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 3,
        weekStartUTC: '2024-01-08', // Monday
        todayUTC: '2024-01-10',
      });

      expect(result.weekStartUTC).toBe('2024-01-08');
      expect(result.weekEndUTC).toBe('2024-01-14'); // Sunday
    });

    // Verify details array structure
    it('includes all required details', () => {
      const result = buildWeeklyGoalExplain({
        goalPerWeek: 5,
        completedDaysThisWeek: 3,
        weekStartUTC: '2024-01-08',
        todayUTC: '2024-01-10',
      });

      expect(result.details.length).toBeGreaterThanOrEqual(4);
      expect(result.details.some((d) => d.includes('週の範囲'))).toBe(true);
      expect(result.details.some((d) => d.includes('学習日数:'))).toBe(true);
      expect(result.details.some((d) => d.includes('週の経過日数:'))).toBe(true);
      expect(result.details.some((d) => d.startsWith('判定:'))).toBe(true);
    });
  });

  describe('buildMetricsExplain', () => {
    it('builds both streak and weekly explanations', () => {
      const result = buildMetricsExplain({
        metrics: {
          streak: 5,
          lastActivityDate: '2024-01-15',
          weeklyGoal: {
            type: 'days',
            target: 5,
            progress: 3,
            weekStartDate: '2024-01-08',
          },
        },
        todayCount: 1,
        todayUTC: '2024-01-15',
      });

      expect(result.streak).toBeDefined();
      expect(result.weekly).toBeDefined();
      expect(result.streak.reasonCode).toBe('ACTIVE_TODAY');
      expect(result.weekly.reasonCode).toBeDefined();
    });

    it('uses current date as default for todayUTC', () => {
      const result = buildMetricsExplain({
        metrics: {
          streak: 0,
          lastActivityDate: null,
          weeklyGoal: {
            type: 'days',
            target: 5,
            progress: 0,
            weekStartDate: '2024-01-08',
          },
        },
        todayCount: 0,
      });

      // Should not throw and should return valid structure
      expect(result.streak).toBeDefined();
      expect(result.weekly).toBeDefined();
    });
  });

  // Spec-locking tests
  describe('spec-locking: streak reason codes', () => {
    const testCases: Array<{
      name: string;
      input: {
        currentStreak: number;
        lastActivityDate: string | null;
        todayCount: number;
        todayUTC: string;
      };
      expected: StreakReasonCode;
    }> = [
      {
        name: 'ACTIVE_TODAY: last_date == today',
        input: {
          currentStreak: 3,
          lastActivityDate: '2024-01-15',
          todayCount: 1,
          todayUTC: '2024-01-15',
        },
        expected: 'ACTIVE_TODAY',
      },
      {
        name: 'ACTIVE_YESTERDAY: last_date == yesterday',
        input: {
          currentStreak: 3,
          lastActivityDate: '2024-01-14',
          todayCount: 0,
          todayUTC: '2024-01-15',
        },
        expected: 'ACTIVE_YESTERDAY',
      },
      {
        name: 'NO_ACTIVITY_YET: null last_date, no today count',
        input: { currentStreak: 0, lastActivityDate: null, todayCount: 0, todayUTC: '2024-01-15' },
        expected: 'NO_ACTIVITY_YET',
      },
      {
        name: 'BROKEN: last_date 3 days ago, no activity today',
        input: {
          currentStreak: 0,
          lastActivityDate: '2024-01-12',
          todayCount: 0,
          todayUTC: '2024-01-15',
        },
        expected: 'BROKEN',
      },
      {
        name: 'RECOVERED: last_date 3 days ago, activity today, streak=1',
        input: {
          currentStreak: 1,
          lastActivityDate: '2024-01-12',
          todayCount: 1,
          todayUTC: '2024-01-15',
        },
        expected: 'RECOVERED',
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        const result = buildStreakExplain(input);
        expect(result.reasonCode).toBe(expected);
      });
    });
  });

  describe('spec-locking: weekly reason codes', () => {
    const testCases: Array<{
      name: string;
      input: {
        goalPerWeek: number;
        completedDaysThisWeek: number;
        weekStartUTC: string;
        todayUTC: string;
      };
      expected: WeeklyReasonCode;
    }> = [
      {
        name: 'ACHIEVED: progress >= goal',
        input: {
          goalPerWeek: 5,
          completedDaysThisWeek: 5,
          weekStartUTC: '2024-01-08',
          todayUTC: '2024-01-12',
        },
        expected: 'ACHIEVED',
      },
      {
        name: 'ON_TRACK: ahead of pace',
        input: {
          goalPerWeek: 5,
          completedDaysThisWeek: 3,
          weekStartUTC: '2024-01-08',
          todayUTC: '2024-01-10',
        },
        expected: 'ON_TRACK',
      },
      {
        name: 'BEHIND: behind pace',
        input: {
          goalPerWeek: 5,
          completedDaysThisWeek: 1,
          weekStartUTC: '2024-01-08',
          todayUTC: '2024-01-12',
        },
        expected: 'BEHIND',
      },
      {
        name: 'BEHIND: zero progress',
        input: {
          goalPerWeek: 5,
          completedDaysThisWeek: 0,
          weekStartUTC: '2024-01-08',
          todayUTC: '2024-01-10',
        },
        expected: 'BEHIND',
      },
      {
        name: 'NO_GOAL: goal is zero',
        input: {
          goalPerWeek: 0,
          completedDaysThisWeek: 3,
          weekStartUTC: '2024-01-08',
          todayUTC: '2024-01-10',
        },
        expected: 'NO_GOAL',
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        const result = buildWeeklyGoalExplain(input);
        expect(result.reasonCode).toBe(expected);
      });
    });
  });
});
