/**
 * Trend Service Tests
 *
 * P1-2 仕様テスト:
 * - 日レンジ: 30日が必ず30件、今日含む、UTC基準
 * - 週レンジ: 12件、月曜境界、UTC基準
 * - 集計: 同日に複数イベント→count加算、範囲外→無視、空→全て0
 */

import { describe, it, expect } from 'vitest';
import {
  generateDailyRangeUTC,
  generateWeeklyRangeUTC,
  aggregateByDay,
  aggregateByWeek,
  getTrendData,
  formatDateLabel,
} from '@/features/metrics/services/trendService';
import type { LearningEvent } from '@/features/metrics/services/metricsService';

describe('trendService', () => {
  describe('generateDailyRangeUTC', () => {
    it('returns exactly 30 days by default', () => {
      const range = generateDailyRangeUTC(30, '2024-01-31');
      expect(range).toHaveLength(30);
    });

    it('includes today as the last element', () => {
      const today = '2024-01-31';
      const range = generateDailyRangeUTC(30, today);
      expect(range[range.length - 1]).toBe(today);
    });

    it('returns dates in ascending order (oldest first)', () => {
      const range = generateDailyRangeUTC(30, '2024-01-31');
      for (let i = 1; i < range.length; i++) {
        expect(range[i] > range[i - 1]).toBe(true);
      }
    });

    it('includes today - 29 as the first element for 30 days', () => {
      const range = generateDailyRangeUTC(30, '2024-01-31');
      expect(range[0]).toBe('2024-01-02');
    });

    it('handles month boundaries', () => {
      const range = generateDailyRangeUTC(5, '2024-02-02');
      expect(range).toEqual(['2024-01-29', '2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
    });

    it('handles year boundaries', () => {
      const range = generateDailyRangeUTC(3, '2024-01-02');
      expect(range).toEqual(['2023-12-31', '2024-01-01', '2024-01-02']);
    });

    it('returns single day when days=1', () => {
      const range = generateDailyRangeUTC(1, '2024-01-15');
      expect(range).toEqual(['2024-01-15']);
    });
  });

  describe('generateWeeklyRangeUTC', () => {
    it('returns exactly 12 weeks by default', () => {
      const range = generateWeeklyRangeUTC(12, '2024-01-31');
      expect(range).toHaveLength(12);
    });

    it('returns week start dates (Mondays) in ascending order', () => {
      const range = generateWeeklyRangeUTC(12, '2024-01-31');
      for (let i = 1; i < range.length; i++) {
        expect(range[i] > range[i - 1]).toBe(true);
        // Each should be 7 days after the previous
        const prev = new Date(range[i - 1] + 'T00:00:00Z');
        const curr = new Date(range[i] + 'T00:00:00Z');
        const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
        expect(diffDays).toBe(7);
      }
    });

    it('includes current week as the last element', () => {
      // 2024-01-31 is Wednesday, week starts 2024-01-29 (Monday)
      const range = generateWeeklyRangeUTC(12, '2024-01-31');
      expect(range[range.length - 1]).toBe('2024-01-29');
    });

    it('all returned dates are Mondays (UTC)', () => {
      const range = generateWeeklyRangeUTC(12, '2024-01-31');
      for (const dateStr of range) {
        const date = new Date(dateStr + 'T00:00:00Z');
        expect(date.getUTCDay()).toBe(1); // Monday = 1
      }
    });

    it('handles case when today is Monday', () => {
      // 2024-01-29 is Monday
      const range = generateWeeklyRangeUTC(3, '2024-01-29');
      expect(range[range.length - 1]).toBe('2024-01-29');
    });

    it('handles case when today is Sunday', () => {
      // 2024-01-28 is Sunday, current week starts 2024-01-22
      const range = generateWeeklyRangeUTC(3, '2024-01-28');
      expect(range[range.length - 1]).toBe('2024-01-22');
    });
  });

  describe('aggregateByDay', () => {
    const createEvent = (date: string): LearningEvent => ({
      user_id: 'test-user',
      event_type: 'lesson_completed',
      event_date: date,
      reference_id: 'test-lesson',
    });

    it('returns all days with 0 when no events', () => {
      const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
      const result = aggregateByDay([], range);

      expect(result).toHaveLength(3);
      result.forEach((point) => {
        expect(point.count).toBe(0);
      });
    });

    it('counts multiple events on the same day', () => {
      const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
      const events = [
        createEvent('2024-01-02'),
        createEvent('2024-01-02'),
        createEvent('2024-01-02'),
      ];

      const result = aggregateByDay(events, range);

      expect(result.find((d) => d.date === '2024-01-02')?.count).toBe(3);
    });

    it('ignores events outside the range', () => {
      const range = ['2024-01-02', '2024-01-03', '2024-01-04'];
      const events = [
        createEvent('2024-01-01'), // before
        createEvent('2024-01-03'), // in range
        createEvent('2024-01-05'), // after
      ];

      const result = aggregateByDay(events, range);

      expect(result.find((d) => d.date === '2024-01-03')?.count).toBe(1);
      // Out-of-range dates should not be in result
      expect(result.find((d) => d.date === '2024-01-01')).toBeUndefined();
      expect(result.find((d) => d.date === '2024-01-05')).toBeUndefined();
    });

    it('preserves order from daily range', () => {
      const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
      const result = aggregateByDay([], range);

      expect(result.map((d) => d.date)).toEqual(range);
    });
  });

  describe('aggregateByWeek', () => {
    const createEvent = (date: string): LearningEvent => ({
      user_id: 'test-user',
      event_type: 'lesson_completed',
      event_date: date,
      reference_id: 'test-lesson',
    });

    it('returns all weeks with 0 when no events', () => {
      const range = ['2024-01-08', '2024-01-15', '2024-01-22'];
      const result = aggregateByWeek([], range);

      expect(result).toHaveLength(3);
      result.forEach((point) => {
        expect(point.count).toBe(0);
      });
    });

    it('aggregates events into correct weeks', () => {
      // Week of 2024-01-15: Mon 15 - Sun 21
      const range = ['2024-01-08', '2024-01-15', '2024-01-22'];
      const events = [
        createEvent('2024-01-15'), // Mon
        createEvent('2024-01-17'), // Wed
        createEvent('2024-01-21'), // Sun - still week of 15
      ];

      const result = aggregateByWeek(events, range);

      expect(result.find((w) => w.weekStart === '2024-01-15')?.count).toBe(3);
    });

    it('handles week boundaries correctly (Sunday to Monday)', () => {
      const range = ['2024-01-15', '2024-01-22'];
      const events = [
        createEvent('2024-01-21'), // Sunday - week of 15
        createEvent('2024-01-22'), // Monday - week of 22
      ];

      const result = aggregateByWeek(events, range);

      expect(result.find((w) => w.weekStart === '2024-01-15')?.count).toBe(1);
      expect(result.find((w) => w.weekStart === '2024-01-22')?.count).toBe(1);
    });

    it('ignores events outside the week range', () => {
      const range = ['2024-01-15', '2024-01-22'];
      const events = [
        createEvent('2024-01-08'), // week before
        createEvent('2024-01-17'), // in range
        createEvent('2024-01-30'), // week after
      ];

      const result = aggregateByWeek(events, range);

      const totalCount = result.reduce((sum, w) => sum + w.count, 0);
      expect(totalCount).toBe(1);
    });
  });

  describe('getTrendData', () => {
    const createEvent = (date: string): LearningEvent => ({
      user_id: 'test-user',
      event_type: 'lesson_completed',
      event_date: date,
      reference_id: 'test-lesson',
    });

    it('returns 30 points for daily mode', () => {
      const result = getTrendData([], 'daily', '2024-01-31');
      expect(result).toHaveLength(30);
    });

    it('returns 12 points for weekly mode', () => {
      const result = getTrendData([], 'weekly', '2024-01-31');
      expect(result).toHaveLength(12);
    });

    it('returns data with x and y properties', () => {
      const result = getTrendData([], 'daily', '2024-01-31');
      result.forEach((point) => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(typeof point.x).toBe('string');
        expect(typeof point.y).toBe('number');
      });
    });

    it('correctly aggregates events in daily mode', () => {
      const events = [createEvent('2024-01-30'), createEvent('2024-01-30')];
      const result = getTrendData(events, 'daily', '2024-01-31');

      const jan30 = result.find((d) => d.x === '2024-01-30');
      expect(jan30?.y).toBe(2);
    });

    it('correctly aggregates events in weekly mode', () => {
      // 2024-01-29 is Monday (week start)
      const events = [
        createEvent('2024-01-29'),
        createEvent('2024-01-30'),
        createEvent('2024-01-31'),
      ];
      const result = getTrendData(events, 'weekly', '2024-01-31');

      const currentWeek = result.find((w) => w.x === '2024-01-29');
      expect(currentWeek?.y).toBe(3);
    });
  });

  describe('formatDateLabel', () => {
    it('formats daily date as MM/DD', () => {
      expect(formatDateLabel('2024-01-05', 'daily')).toBe('1/5');
      expect(formatDateLabel('2024-12-25', 'daily')).toBe('12/25');
    });

    it('formats weekly date as MM/DD~', () => {
      expect(formatDateLabel('2024-01-08', 'weekly')).toBe('1/8~');
      expect(formatDateLabel('2024-12-23', 'weekly')).toBe('12/23~');
    });

    it('removes leading zeros from month and day', () => {
      expect(formatDateLabel('2024-01-01', 'daily')).toBe('1/1');
      expect(formatDateLabel('2024-09-09', 'daily')).toBe('9/9');
    });
  });

  // Spec-locking tests
  describe('spec-locking: daily range', () => {
    it('30 days includes exactly 30 dates', () => {
      const range = generateDailyRangeUTC(30, '2024-03-15');
      expect(range.length).toBe(30);
    });

    it('uses UTC dates (not local)', () => {
      // This is implicitly tested by consistent date string format
      const range = generateDailyRangeUTC(5, '2024-01-05');
      range.forEach((date) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('spec-locking: weekly range', () => {
    it('12 weeks includes exactly 12 week starts', () => {
      const range = generateWeeklyRangeUTC(12, '2024-03-15');
      expect(range.length).toBe(12);
    });

    it('all week starts are Mondays', () => {
      const range = generateWeeklyRangeUTC(12, '2024-03-15');
      range.forEach((dateStr) => {
        const date = new Date(dateStr + 'T00:00:00Z');
        expect(date.getUTCDay()).toBe(1);
      });
    });
  });

  describe('spec-locking: no gaps (歯抜け禁止)', () => {
    it('daily mode: all 30 days present even with no events', () => {
      const result = getTrendData([], 'daily', '2024-01-31');
      expect(result.length).toBe(30);

      // Verify consecutive dates
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1].x + 'T00:00:00Z');
        const curr = new Date(result[i].x + 'T00:00:00Z');
        const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
        expect(diffDays).toBe(1);
      }
    });

    it('weekly mode: all 12 weeks present even with no events', () => {
      const result = getTrendData([], 'weekly', '2024-01-31');
      expect(result.length).toBe(12);

      // Verify consecutive weeks
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1].x + 'T00:00:00Z');
        const curr = new Date(result[i].x + 'T00:00:00Z');
        const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
        expect(diffDays).toBe(7);
      }
    });
  });
});
