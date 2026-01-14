import { describe, it, expect } from 'vitest';
import {
  getUTCDateString,
  getWeekStartUTC,
  isSameDay,
  isYesterday,
  calculateStreak,
  calculateWeeklyProgress,
  updateMetricsOnEvent,
  createInitialMetrics,
  recalculateMetrics,
  DEFAULT_WEEKLY_TARGET,
} from '@/features/metrics/services/metricsService';

describe('metricsService', () => {
  describe('getUTCDateString', () => {
    it('should return YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(getUTCDateString(date)).toBe('2024-01-15');
    });

    it('should use UTC timezone', () => {
      // 2024-01-15 23:00 UTC = 2024-01-16 in JST, but should return 2024-01-15
      const date = new Date('2024-01-15T23:00:00Z');
      expect(getUTCDateString(date)).toBe('2024-01-15');
    });
  });

  describe('getWeekStartUTC', () => {
    it('should return Monday for a Wednesday', () => {
      // 2024-01-17 is Wednesday
      const date = new Date('2024-01-17T10:00:00Z');
      expect(getWeekStartUTC(date)).toBe('2024-01-15'); // Monday
    });

    it('should return same Monday for a Monday', () => {
      // 2024-01-15 is Monday
      const date = new Date('2024-01-15T10:00:00Z');
      expect(getWeekStartUTC(date)).toBe('2024-01-15');
    });

    it('should return previous Monday for a Sunday', () => {
      // 2024-01-21 is Sunday
      const date = new Date('2024-01-21T10:00:00Z');
      expect(getWeekStartUTC(date)).toBe('2024-01-15');
    });

    it('should return Monday for a Saturday', () => {
      // 2024-01-20 is Saturday
      const date = new Date('2024-01-20T10:00:00Z');
      expect(getWeekStartUTC(date)).toBe('2024-01-15');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same dates', () => {
      expect(isSameDay('2024-01-15', '2024-01-15')).toBe(true);
    });

    it('should return false for different dates', () => {
      expect(isSameDay('2024-01-15', '2024-01-16')).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true when date1 is yesterday of date2', () => {
      expect(isYesterday('2024-01-14', '2024-01-15')).toBe(true);
    });

    it('should return false when dates are same', () => {
      expect(isYesterday('2024-01-15', '2024-01-15')).toBe(false);
    });

    it('should return false when date1 is more than 1 day before', () => {
      expect(isYesterday('2024-01-13', '2024-01-15')).toBe(false);
    });

    it('should return false when date1 is after date2', () => {
      expect(isYesterday('2024-01-16', '2024-01-15')).toBe(false);
    });

    it('should handle month boundaries', () => {
      expect(isYesterday('2024-01-31', '2024-02-01')).toBe(true);
    });

    it('should handle year boundaries', () => {
      expect(isYesterday('2023-12-31', '2024-01-01')).toBe(true);
    });
  });

  describe('calculateStreak', () => {
    it('[仕様固定] last_date == today: streakは変化しない', () => {
      expect(calculateStreak(5, '2024-01-15', '2024-01-15')).toBe(5);
      expect(calculateStreak(0, '2024-01-15', '2024-01-15')).toBe(0);
    });

    it('[仕様固定] last_date == yesterday: streak + 1', () => {
      expect(calculateStreak(5, '2024-01-14', '2024-01-15')).toBe(6);
      expect(calculateStreak(0, '2024-01-14', '2024-01-15')).toBe(1);
    });

    it('[仕様固定] last_date が null: streak = 1', () => {
      expect(calculateStreak(0, null, '2024-01-15')).toBe(1);
    });

    it('[仕様固定] last_date が2日以上前: streak = 1にリセット', () => {
      expect(calculateStreak(10, '2024-01-13', '2024-01-15')).toBe(1);
      expect(calculateStreak(100, '2024-01-01', '2024-01-15')).toBe(1);
    });

    it('should handle edge case: last_date is in future (reset)', () => {
      expect(calculateStreak(5, '2024-01-20', '2024-01-15')).toBe(1);
    });
  });

  describe('calculateWeeklyProgress', () => {
    it('should count unique days within the week', () => {
      const weekStart = '2024-01-15'; // Monday
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17'];
      expect(calculateWeeklyProgress(dates, weekStart)).toBe(3);
    });

    it('should not count duplicate days', () => {
      const weekStart = '2024-01-15';
      const dates = ['2024-01-15', '2024-01-15', '2024-01-16'];
      expect(calculateWeeklyProgress(dates, weekStart)).toBe(2);
    });

    it('should not count dates from previous week', () => {
      const weekStart = '2024-01-15';
      const dates = ['2024-01-14', '2024-01-15', '2024-01-16'];
      expect(calculateWeeklyProgress(dates, weekStart)).toBe(2);
    });

    it('should not count dates from next week', () => {
      const weekStart = '2024-01-15';
      const dates = ['2024-01-15', '2024-01-22', '2024-01-23'];
      expect(calculateWeeklyProgress(dates, weekStart)).toBe(1);
    });

    it('should return 0 for empty dates', () => {
      expect(calculateWeeklyProgress([], '2024-01-15')).toBe(0);
    });

    it('should handle full week', () => {
      const weekStart = '2024-01-15';
      const dates = [
        '2024-01-15',
        '2024-01-16',
        '2024-01-17',
        '2024-01-18',
        '2024-01-19',
        '2024-01-20',
        '2024-01-21',
      ];
      expect(calculateWeeklyProgress(dates, weekStart)).toBe(7);
    });
  });

  describe('updateMetricsOnEvent', () => {
    it('should update streak on new day', () => {
      const current = createInitialMetrics();
      const updated = updateMetricsOnEvent(current, '2024-01-15', '2024-01-15');

      expect(updated.streak).toBe(1);
      expect(updated.lastActivityDate).toBe('2024-01-15');
    });

    it('should maintain streak on same day', () => {
      const current = {
        streak: 5,
        lastActivityDate: '2024-01-15',
        weeklyGoal: {
          type: 'days' as const,
          target: DEFAULT_WEEKLY_TARGET,
          progress: 3,
          weekStartDate: '2024-01-15',
        },
      };
      const updated = updateMetricsOnEvent(current, '2024-01-15', '2024-01-15');

      expect(updated.streak).toBe(5);
      expect(updated.weeklyGoal.progress).toBe(3); // unchanged
    });

    it('should reset weekly progress on new week', () => {
      const current = {
        streak: 5,
        lastActivityDate: '2024-01-14',
        weeklyGoal: {
          type: 'days' as const,
          target: DEFAULT_WEEKLY_TARGET,
          progress: 7,
          weekStartDate: '2024-01-08', // previous week
        },
      };
      const updated = updateMetricsOnEvent(current, '2024-01-15', '2024-01-15');

      expect(updated.weeklyGoal.progress).toBe(1); // reset to 1
      expect(updated.weeklyGoal.weekStartDate).toBe('2024-01-15');
    });
  });

  describe('createInitialMetrics', () => {
    it('should return zero values', () => {
      const metrics = createInitialMetrics();

      expect(metrics.streak).toBe(0);
      expect(metrics.lastActivityDate).toBeNull();
      expect(metrics.weeklyGoal.type).toBe('days');
      expect(metrics.weeklyGoal.target).toBe(DEFAULT_WEEKLY_TARGET);
      expect(metrics.weeklyGoal.progress).toBe(0);
    });
  });

  describe('recalculateMetrics', () => {
    it('should calculate streak from consecutive days ending today', () => {
      const today = '2024-01-15';
      const dates = ['2024-01-13', '2024-01-14', '2024-01-15'];
      const metrics = recalculateMetrics(dates, today);

      expect(metrics.streak).toBe(3);
    });

    it('should calculate streak from consecutive days ending yesterday', () => {
      const today = '2024-01-15';
      const dates = ['2024-01-12', '2024-01-13', '2024-01-14'];
      const metrics = recalculateMetrics(dates, today);

      expect(metrics.streak).toBe(3);
    });

    it('should return 0 streak if last activity was more than 1 day ago', () => {
      const today = '2024-01-15';
      const dates = ['2024-01-10', '2024-01-11', '2024-01-12'];
      const metrics = recalculateMetrics(dates, today);

      expect(metrics.streak).toBe(0);
    });

    it('should handle gaps in dates', () => {
      const today = '2024-01-15';
      const dates = ['2024-01-10', '2024-01-14', '2024-01-15'];
      const metrics = recalculateMetrics(dates, today);

      expect(metrics.streak).toBe(2); // only 14-15 are consecutive
    });

    it('should return initial metrics for empty dates', () => {
      const metrics = recalculateMetrics([]);

      expect(metrics.streak).toBe(0);
      expect(metrics.lastActivityDate).toBeNull();
    });

    it('should calculate weekly progress correctly', () => {
      const today = '2024-01-17'; // Wednesday
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17'];
      const metrics = recalculateMetrics(dates, today);

      expect(metrics.weeklyGoal.progress).toBe(3);
      expect(metrics.weeklyGoal.weekStartDate).toBe('2024-01-15');
    });
  });

  describe('冪等性・重複排除仕様', () => {
    it('[仕様固定] getUTCDateString は UTC 基準で日付を返す（タイムゾーン非依存）', () => {
      // 日本時間 2024-01-16 08:00 = UTC 2024-01-15 23:00
      // UTC基準なので 2024-01-15 を返すべき
      const date = new Date('2024-01-15T23:59:59Z');
      expect(getUTCDateString(date)).toBe('2024-01-15');

      // UTC 2024-01-16 00:00:00 は 2024-01-16 を返すべき
      const nextDay = new Date('2024-01-16T00:00:00Z');
      expect(getUTCDateString(nextDay)).toBe('2024-01-16');
    });

    it('[仕様固定] updateMetricsOnEvent は同日複数回呼んでも metrics が変わらない', () => {
      const initial = createInitialMetrics();
      const today = '2024-01-15';

      // 1回目
      const after1st = updateMetricsOnEvent(initial, today, today);
      expect(after1st.streak).toBe(1);
      expect(after1st.weeklyGoal.progress).toBe(1);

      // 2回目（同日）- 変化なし
      const after2nd = updateMetricsOnEvent(after1st, today, today);
      expect(after2nd.streak).toBe(1);
      expect(after2nd.weeklyGoal.progress).toBe(1);

      // 3回目（同日）- 変化なし
      const after3rd = updateMetricsOnEvent(after2nd, today, today);
      expect(after3rd.streak).toBe(1);
      expect(after3rd.weeklyGoal.progress).toBe(1);
    });

    it('[仕様固定] recalculateMetrics は重複日付を1日としてカウント', () => {
      const today = '2024-01-15';
      // 同日が複数回含まれている
      const dates = ['2024-01-15', '2024-01-15', '2024-01-15'];
      const metrics = recalculateMetrics(dates, today);

      // 重複は排除され、1日としてカウント
      expect(metrics.streak).toBe(1);
      expect(metrics.weeklyGoal.progress).toBe(1);
    });
  });
});
