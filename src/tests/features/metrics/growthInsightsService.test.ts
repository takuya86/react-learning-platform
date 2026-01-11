import { describe, it, expect } from 'vitest';
import {
  buildGrowthInsights,
  getLastWeekStartUTC,
  countActiveDaysInWeek,
  countEventsInWeek,
  countLifetimeActiveDays,
  calculateTopFocus,
} from '@/features/metrics/services/growthInsightsService';
import { getWeekStartUTC } from '@/features/metrics/services/metricsService';

describe('growthInsightsService', () => {
  describe('getLastWeekStartUTC', () => {
    it('returns Monday of previous week', () => {
      // Wednesday 2024-01-17 -> Last week Monday is 2024-01-08
      const date = new Date('2024-01-17T12:00:00Z');
      const result = getLastWeekStartUTC(date);
      expect(result).toBe('2024-01-08');
    });

    it('handles Sunday correctly', () => {
      // Sunday 2024-01-21 -> Last week Monday is 2024-01-08
      const date = new Date('2024-01-21T12:00:00Z');
      const result = getLastWeekStartUTC(date);
      expect(result).toBe('2024-01-08');
    });
  });

  describe('countActiveDaysInWeek', () => {
    it('counts unique days in week', () => {
      const weekStart = '2024-01-15'; // Monday
      const eventDates = [
        '2024-01-15', // Monday
        '2024-01-15', // Same day
        '2024-01-17', // Wednesday
        '2024-01-20', // Saturday
      ];
      expect(countActiveDaysInWeek(eventDates, weekStart)).toBe(3);
    });

    it('[spec-lock] same day multiple events = 1 active day', () => {
      const weekStart = '2024-01-15';
      const eventDates = ['2024-01-15', '2024-01-15', '2024-01-15'];
      expect(countActiveDaysInWeek(eventDates, weekStart)).toBe(1);
    });

    it('excludes events outside week range', () => {
      const weekStart = '2024-01-15'; // Monday
      const eventDates = [
        '2024-01-14', // Before week
        '2024-01-15', // In week
        '2024-01-22', // After week
      ];
      expect(countActiveDaysInWeek(eventDates, weekStart)).toBe(1);
    });

    it('[spec-lock] UTC boundary handling', () => {
      // Events at edge of week
      const weekStart = '2024-01-15';
      const eventDates = [
        '2024-01-15', // First day of week
        '2024-01-21', // Last day of week (Sunday)
      ];
      expect(countActiveDaysInWeek(eventDates, weekStart)).toBe(2);
    });
  });

  describe('countEventsInWeek', () => {
    it('counts all events in week', () => {
      const weekStart = '2024-01-15';
      const eventDates = ['2024-01-15', '2024-01-15', '2024-01-17'];
      expect(countEventsInWeek(eventDates, weekStart)).toBe(3);
    });
  });

  describe('countLifetimeActiveDays', () => {
    it('counts unique days across all time', () => {
      const eventDates = ['2024-01-01', '2024-01-01', '2024-01-15', '2024-06-15'];
      expect(countLifetimeActiveDays(eventDates)).toBe(3);
    });

    it('returns 0 for empty array', () => {
      expect(countLifetimeActiveDays([])).toBe(0);
    });
  });

  describe('calculateTopFocus', () => {
    it('returns most frequent reference id', () => {
      const referenceIds = ['lesson-1', 'lesson-2', 'lesson-1', 'lesson-1'];
      const result = calculateTopFocus(referenceIds);
      expect(result).toEqual({ label: 'lesson-1', count: 3 });
    });

    it('returns undefined for empty array', () => {
      expect(calculateTopFocus([])).toBeUndefined();
    });

    it('ignores empty strings', () => {
      const referenceIds = ['', '', 'lesson-1'];
      const result = calculateTopFocus(referenceIds);
      expect(result).toEqual({ label: 'lesson-1', count: 1 });
    });
  });

  describe('buildGrowthInsights', () => {
    const TODAY = '2024-01-17'; // Wednesday

    describe('empty state', () => {
      it('[spec-lock] returns non-empty message for 0 events', () => {
        const result = buildGrowthInsights({
          eventDates: [],
          today: TODAY,
        });

        expect(result.message).not.toBe('');
        expect(result.message.length).toBeGreaterThan(0);
        expect(result.subMessage).not.toBe('');
      });

      it('returns 0 for all metrics when no events', () => {
        const result = buildGrowthInsights({
          eventDates: [],
          today: TODAY,
        });

        expect(result.activeDaysThisWeek).toBe(0);
        expect(result.activeDaysLastWeek).toBe(0);
        expect(result.deltaDays).toBe(0);
        expect(result.eventsThisWeek).toBe(0);
        expect(result.lifetimeActiveDays).toBe(0);
      });
    });

    describe('first week', () => {
      it('handles first week with no previous data', () => {
        // This week only: 2024-01-15 (Monday)
        const result = buildGrowthInsights({
          eventDates: ['2024-01-15', '2024-01-16'],
          today: TODAY,
        });

        expect(result.activeDaysThisWeek).toBe(2);
        expect(result.activeDaysLastWeek).toBe(0);
        expect(result.deltaDays).toBe(2);
      });
    });

    describe('week comparison', () => {
      it('[spec-lock] deltaDays > 0 when this week > last week', () => {
        // Last week: 2024-01-08, 2024-01-09 (2 days)
        // This week: 2024-01-15, 2024-01-16, 2024-01-17 (3 days)
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-08',
            '2024-01-09', // Last week
            '2024-01-15',
            '2024-01-16',
            '2024-01-17', // This week
          ],
          today: TODAY,
        });

        expect(result.activeDaysThisWeek).toBe(3);
        expect(result.activeDaysLastWeek).toBe(2);
        expect(result.deltaDays).toBe(1);
        expect(result.deltaDays).toBeGreaterThan(0);
      });

      it('[spec-lock] deltaDays < 0 when this week < last week', () => {
        // Last week: 2024-01-08, 2024-01-09, 2024-01-10, 2024-01-11 (4 days)
        // This week: 2024-01-15 (1 day)
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-08',
            '2024-01-09',
            '2024-01-10',
            '2024-01-11', // Last week
            '2024-01-15', // This week
          ],
          today: TODAY,
        });

        expect(result.activeDaysThisWeek).toBe(1);
        expect(result.activeDaysLastWeek).toBe(4);
        expect(result.deltaDays).toBe(-3);
        expect(result.deltaDays).toBeLessThan(0);
      });

      it('deltaDays = 0 when same activity', () => {
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-08',
            '2024-01-09', // Last week (2 days)
            '2024-01-15',
            '2024-01-16', // This week (2 days)
          ],
          today: TODAY,
        });

        expect(result.deltaDays).toBe(0);
      });
    });

    describe('lifetime calculation', () => {
      it('counts all unique days in lifetime', () => {
        const result = buildGrowthInsights({
          eventDates: [
            '2023-12-01',
            '2024-01-08',
            '2024-01-15',
            '2024-01-15', // Duplicate
          ],
          today: TODAY,
        });

        expect(result.lifetimeActiveDays).toBe(3);
      });
    });

    describe('message generation', () => {
      it('generates positive message for increase', () => {
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-08', // Last week (1 day)
            '2024-01-15',
            '2024-01-16',
            '2024-01-17', // This week (3 days)
          ],
          today: TODAY,
        });

        expect(result.message).toContain('先週より');
      });

      it('generates encouraging message for decrease (no blame)', () => {
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-08',
            '2024-01-09',
            '2024-01-10',
            '2024-01-11', // Last week (4 days)
            '2024-01-15', // This week (1 day)
          ],
          today: TODAY,
        });

        // Should not contain blame words
        expect(result.message).not.toContain('悪い');
        expect(result.message).not.toContain('ダメ');
        expect(result.message).not.toContain('失敗');
        expect(result.message).not.toContain('減った');
      });

      it('generates maintenance message for same pace', () => {
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-08',
            '2024-01-09', // Last week (2 days)
            '2024-01-15',
            '2024-01-16', // This week (2 days)
          ],
          today: TODAY,
        });

        expect(result.message).toContain('キープ');
      });
    });

    describe('edge cases', () => {
      it('[spec-lock] handles UTC date boundary correctly', () => {
        // Events on week boundaries
        const result = buildGrowthInsights({
          eventDates: [
            '2024-01-14', // Sunday (last week)
            '2024-01-15', // Monday (this week start)
          ],
          today: TODAY,
        });

        expect(result.activeDaysThisWeek).toBe(1);
        expect(result.activeDaysLastWeek).toBe(1);
      });

      it('calculates top focus correctly', () => {
        const result = buildGrowthInsights({
          eventDates: ['2024-01-15', '2024-01-16', '2024-01-17'],
          referenceIds: ['lesson-1', 'lesson-2', 'lesson-1'],
          today: TODAY,
        });

        expect(result.topFocus).toEqual({ label: 'lesson-1', count: 2 });
      });
    });
  });

  describe('spec-locking tests', () => {
    it('[spec-lock] empty events have encouraging message', () => {
      const result = buildGrowthInsights({ eventDates: [] });
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.subMessage.length).toBeGreaterThan(0);
    });

    it('[spec-lock] multiple events on same day count as 1 active day', () => {
      const result = buildGrowthInsights({
        eventDates: ['2024-01-15', '2024-01-15', '2024-01-15'],
        today: '2024-01-17',
      });
      expect(result.activeDaysThisWeek).toBe(1);
    });

    it('[spec-lock] delta calculation: this week - last week', () => {
      // 3 this week, 1 last week -> delta = 2
      const result = buildGrowthInsights({
        eventDates: [
          '2024-01-08', // Last week
          '2024-01-15',
          '2024-01-16',
          '2024-01-17', // This week
        ],
        today: '2024-01-17',
      });
      expect(result.deltaDays).toBe(2);
    });

    it('[spec-lock] week starts on Monday UTC', () => {
      // Sunday should be in the previous week
      const thisWeekStart = getWeekStartUTC(new Date('2024-01-17T12:00:00Z'));
      expect(thisWeekStart).toBe('2024-01-15'); // Monday

      const lastWeekStart = getLastWeekStartUTC(new Date('2024-01-17T12:00:00Z'));
      expect(lastWeekStart).toBe('2024-01-08'); // Previous Monday
    });
  });
});
