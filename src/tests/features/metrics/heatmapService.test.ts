/**
 * Heatmap Service Tests
 *
 * P1-1 仕様テスト:
 * - 全日0件でも days 分返る
 * - 1日複数イベント → 正しい level
 * - 日付が UTC 基準で並ぶ
 * - 境界値（2→3→5）
 */

import { describe, it, expect } from 'vitest';
import {
  getHeatmapLevel,
  generateDateRange,
  getHeatmapData,
  groupByWeek,
  type HeatmapDay,
} from '@/features/metrics/services/heatmapService';
import type { LearningEvent } from '@/features/metrics/services/metricsService';

describe('heatmapService', () => {
  describe('getHeatmapLevel', () => {
    it('returns level 0 for 0 events', () => {
      expect(getHeatmapLevel(0)).toBe(0);
    });

    it('returns level 1 for 1-2 events', () => {
      expect(getHeatmapLevel(1)).toBe(1);
      expect(getHeatmapLevel(2)).toBe(1);
    });

    it('returns level 2 for 3-4 events', () => {
      expect(getHeatmapLevel(3)).toBe(2);
      expect(getHeatmapLevel(4)).toBe(2);
    });

    it('returns level 3 for 5+ events', () => {
      expect(getHeatmapLevel(5)).toBe(3);
      expect(getHeatmapLevel(10)).toBe(3);
      expect(getHeatmapLevel(100)).toBe(3);
    });

    // 境界値テスト（2→3→5）
    describe('boundary values', () => {
      it('boundary at 2-3: 2 is level 1, 3 is level 2', () => {
        expect(getHeatmapLevel(2)).toBe(1);
        expect(getHeatmapLevel(3)).toBe(2);
      });

      it('boundary at 4-5: 4 is level 2, 5 is level 3', () => {
        expect(getHeatmapLevel(4)).toBe(2);
        expect(getHeatmapLevel(5)).toBe(3);
      });
    });
  });

  describe('generateDateRange', () => {
    it('generates dates from start to end (inclusive)', () => {
      const dates = generateDateRange('2024-01-01', '2024-01-03');
      expect(dates).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
    });

    it('returns single date when start equals end', () => {
      const dates = generateDateRange('2024-01-15', '2024-01-15');
      expect(dates).toEqual(['2024-01-15']);
    });

    it('handles month boundaries', () => {
      const dates = generateDateRange('2024-01-30', '2024-02-02');
      expect(dates).toEqual(['2024-01-30', '2024-01-31', '2024-02-01', '2024-02-02']);
    });

    it('handles year boundaries', () => {
      const dates = generateDateRange('2023-12-30', '2024-01-02');
      expect(dates).toEqual(['2023-12-30', '2023-12-31', '2024-01-01', '2024-01-02']);
    });

    it('returns dates in ascending order (oldest first)', () => {
      const dates = generateDateRange('2024-01-01', '2024-01-07');
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] > dates[i - 1]).toBe(true);
      }
    });
  });

  describe('getHeatmapData', () => {
    const createEvent = (date: string): LearningEvent => ({
      user_id: 'test-user',
      event_type: 'lesson_completed',
      event_date: date,
      reference_id: 'test-lesson',
    });

    // 全日0件でも days 分返る
    it('returns exactly N days when no events exist', () => {
      const result = getHeatmapData([], 84, '2024-03-31');
      expect(result).toHaveLength(84);
      result.forEach((day) => {
        expect(day.count).toBe(0);
        expect(day.level).toBe(0);
      });
    });

    it('returns exactly 7 days when days=7', () => {
      const result = getHeatmapData([], 7, '2024-01-07');
      expect(result).toHaveLength(7);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[6].date).toBe('2024-01-07');
    });

    // 日付が UTC 基準で並ぶ
    it('returns dates in ascending order (UTC)', () => {
      const result = getHeatmapData([], 30, '2024-01-30');
      expect(result[0].date).toBe('2024-01-01');
      expect(result[result.length - 1].date).toBe('2024-01-30');

      for (let i = 1; i < result.length; i++) {
        expect(result[i].date > result[i - 1].date).toBe(true);
      }
    });

    // 1日複数イベント → 正しい level
    it('counts multiple events on same day correctly', () => {
      const events: LearningEvent[] = [
        createEvent('2024-01-15'),
        createEvent('2024-01-15'),
        createEvent('2024-01-15'),
        createEvent('2024-01-15'),
        createEvent('2024-01-15'),
      ];

      const result = getHeatmapData(events, 7, '2024-01-15');
      const jan15 = result.find((d) => d.date === '2024-01-15');

      expect(jan15).toBeDefined();
      expect(jan15!.count).toBe(5);
      expect(jan15!.level).toBe(3); // 5件以上 = level 3
    });

    it('calculates correct levels for different counts', () => {
      const events: LearningEvent[] = [
        // 1件 → level 1
        createEvent('2024-01-10'),
        // 2件 → level 1
        createEvent('2024-01-11'),
        createEvent('2024-01-11'),
        // 3件 → level 2
        createEvent('2024-01-12'),
        createEvent('2024-01-12'),
        createEvent('2024-01-12'),
        // 4件 → level 2
        createEvent('2024-01-13'),
        createEvent('2024-01-13'),
        createEvent('2024-01-13'),
        createEvent('2024-01-13'),
        // 5件 → level 3
        createEvent('2024-01-14'),
        createEvent('2024-01-14'),
        createEvent('2024-01-14'),
        createEvent('2024-01-14'),
        createEvent('2024-01-14'),
      ];

      const result = getHeatmapData(events, 7, '2024-01-15');

      const getDay = (date: string) => result.find((d) => d.date === date);

      expect(getDay('2024-01-09')?.level).toBe(0); // 0件
      expect(getDay('2024-01-10')?.level).toBe(1); // 1件
      expect(getDay('2024-01-11')?.level).toBe(1); // 2件
      expect(getDay('2024-01-12')?.level).toBe(2); // 3件
      expect(getDay('2024-01-13')?.level).toBe(2); // 4件
      expect(getDay('2024-01-14')?.level).toBe(3); // 5件
    });

    it('ignores events outside the date range', () => {
      const events: LearningEvent[] = [
        createEvent('2023-12-31'), // before range
        createEvent('2024-01-01'), // in range
        createEvent('2024-01-08'), // after range
      ];

      const result = getHeatmapData(events, 7, '2024-01-07');

      expect(result.find((d) => d.date === '2024-01-01')?.count).toBe(1);
      expect(result.find((d) => d.date === '2024-01-07')?.count).toBe(0);
      // 2023-12-31 and 2024-01-08 should not be in the result
      expect(result.find((d) => d.date === '2023-12-31')).toBeUndefined();
      expect(result.find((d) => d.date === '2024-01-08')).toBeUndefined();
    });

    it('handles events with different types but same date', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'test-user',
          event_type: 'lesson_completed',
          event_date: '2024-01-15',
          reference_id: 'lesson-1',
        },
        {
          user_id: 'test-user',
          event_type: 'quiz_completed',
          event_date: '2024-01-15',
          reference_id: 'quiz-1',
        },
        {
          user_id: 'test-user',
          event_type: 'note_updated',
          event_date: '2024-01-15',
          reference_id: 'note-1',
        },
      ];

      const result = getHeatmapData(events, 7, '2024-01-15');
      const jan15 = result.find((d) => d.date === '2024-01-15');

      expect(jan15!.count).toBe(3);
      expect(jan15!.level).toBe(2);
    });
  });

  describe('groupByWeek', () => {
    const createHeatmapDay = (date: string, count = 0): HeatmapDay => ({
      date,
      count,
      level: getHeatmapLevel(count),
    });

    it('returns empty array for empty input', () => {
      expect(groupByWeek([])).toEqual([]);
    });

    it('groups consecutive days into weeks correctly', () => {
      // 2024-01-01 is Monday, 2024-01-07 is Sunday (starts new week)
      // groupByWeek splits on Sunday, so Mon-Sat is one week, Sun starts new week
      const days: HeatmapDay[] = [
        createHeatmapDay('2024-01-01'), // Mon
        createHeatmapDay('2024-01-02'), // Tue
        createHeatmapDay('2024-01-03'), // Wed
        createHeatmapDay('2024-01-04'), // Thu
        createHeatmapDay('2024-01-05'), // Fri
        createHeatmapDay('2024-01-06'), // Sat
        createHeatmapDay('2024-01-07'), // Sun (new week)
        createHeatmapDay('2024-01-08'), // Mon
      ];

      const weeks = groupByWeek(days);

      expect(weeks).toHaveLength(2);
      expect(weeks[0]).toHaveLength(6); // Mon-Sat
      expect(weeks[1]).toHaveLength(2); // Sun-Mon
    });

    it('starts new week on Sunday', () => {
      // Sunday should start a new week
      const days: HeatmapDay[] = [
        createHeatmapDay('2024-01-06'), // Sat
        createHeatmapDay('2024-01-07'), // Sun
      ];

      const weeks = groupByWeek(days);

      expect(weeks).toHaveLength(2);
      expect(weeks[0]).toHaveLength(1); // Sat
      expect(weeks[0][0].date).toBe('2024-01-06');
      expect(weeks[1]).toHaveLength(1); // Sun
      expect(weeks[1][0].date).toBe('2024-01-07');
    });

    it('handles partial weeks', () => {
      // Start mid-week
      const days: HeatmapDay[] = [
        createHeatmapDay('2024-01-03'), // Wed
        createHeatmapDay('2024-01-04'), // Thu
        createHeatmapDay('2024-01-05'), // Fri
      ];

      const weeks = groupByWeek(days);

      expect(weeks).toHaveLength(1);
      expect(weeks[0]).toHaveLength(3);
    });

    it('handles 84 days (12 weeks) correctly', () => {
      // Create 84 consecutive days starting from Monday 2024-01-01
      const days: HeatmapDay[] = [];
      const start = new Date('2024-01-01T00:00:00Z');

      for (let i = 0; i < 84; i++) {
        const date = new Date(start);
        date.setUTCDate(date.getUTCDate() + i);
        const dateStr = date.toISOString().slice(0, 10);
        days.push(createHeatmapDay(dateStr));
      }

      const weeks = groupByWeek(days);

      // 2024-01-01 (Mon) to 2024-03-24 (Sun) = 12 weeks
      expect(weeks.length).toBeGreaterThanOrEqual(12);
    });
  });

  // Spec-locking tests
  describe('spec-locking: heatmap levels', () => {
    it('level boundaries are exactly as specified', () => {
      // 仕様: 0件→0, 1-2件→1, 3-4件→2, 5件以上→3
      const testCases = [
        { count: 0, expected: 0 },
        { count: 1, expected: 1 },
        { count: 2, expected: 1 },
        { count: 3, expected: 2 },
        { count: 4, expected: 2 },
        { count: 5, expected: 3 },
        { count: 6, expected: 3 },
        { count: 100, expected: 3 },
      ];

      testCases.forEach(({ count, expected }) => {
        expect(getHeatmapLevel(count)).toBe(expected);
      });
    });
  });

  describe('spec-locking: date range', () => {
    it('default days is 84 (12 weeks)', () => {
      const result = getHeatmapData([], undefined, '2024-03-31');
      expect(result).toHaveLength(84);
    });

    it('includes today as the last day', () => {
      const today = '2024-03-31';
      const result = getHeatmapData([], 7, today);
      expect(result[result.length - 1].date).toBe(today);
    });

    it('includes exactly days-1 days before today', () => {
      const today = '2024-01-07';
      const result = getHeatmapData([], 7, today);
      expect(result[0].date).toBe('2024-01-01');
    });
  });
});
