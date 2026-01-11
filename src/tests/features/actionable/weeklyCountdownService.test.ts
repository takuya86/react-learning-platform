import { describe, it, expect } from 'vitest';
import {
  getRemainingDaysInWeek,
  determineCountdownType,
  buildWeeklyCountdown,
} from '@/features/actionable/services/weeklyCountdownService';

describe('weeklyCountdownService', () => {
  describe('getRemainingDaysInWeek', () => {
    // Week starts on Monday 2024-01-15, ends on Sunday 2024-01-21
    const weekStart = '2024-01-15';

    it('returns 6 days on Monday', () => {
      expect(getRemainingDaysInWeek(weekStart, '2024-01-15')).toBe(6);
    });

    it('returns 3 days on Thursday', () => {
      expect(getRemainingDaysInWeek(weekStart, '2024-01-18')).toBe(3);
    });

    it('returns 0 days on Sunday', () => {
      expect(getRemainingDaysInWeek(weekStart, '2024-01-21')).toBe(0);
    });

    it('returns 0 after week ends', () => {
      expect(getRemainingDaysInWeek(weekStart, '2024-01-22')).toBe(0);
    });
  });

  describe('determineCountdownType', () => {
    it('returns achieved when remainingEvents <= 0', () => {
      expect(determineCountdownType(0, 3, 'ON_TRACK')).toBe('achieved');
    });

    it('returns achieved for ACHIEVED reason code', () => {
      expect(determineCountdownType(0, 3, 'ACHIEVED')).toBe('achieved');
    });

    it('returns none for NO_GOAL', () => {
      expect(determineCountdownType(3, 3, 'NO_GOAL')).toBe('none');
    });

    it('returns critical when no time left and not achieved', () => {
      expect(determineCountdownType(2, 0, 'BEHIND')).toBe('critical');
    });

    it('returns warning when remainingEvents > remainingDays', () => {
      expect(determineCountdownType(4, 2, 'BEHIND')).toBe('warning');
    });

    it('returns on_track when pace is good', () => {
      expect(determineCountdownType(2, 3, 'ON_TRACK')).toBe('on_track');
    });
  });

  describe('buildWeeklyCountdown', () => {
    const weekStart = '2024-01-15';

    it('builds achieved countdown', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 5,
        progress: 5,
        weekStartUTC: weekStart,
        reasonCode: 'ACHIEVED',
        todayUTC: '2024-01-18',
      });

      expect(result.type).toBe('achieved');
      expect(result.show).toBe(true);
      expect(result.message).toBe('今週の目標達成！');
    });

    it('builds on_track countdown', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 5,
        progress: 3,
        weekStartUTC: weekStart,
        reasonCode: 'ON_TRACK',
        todayUTC: '2024-01-18',
      });

      expect(result.type).toBe('on_track');
      expect(result.show).toBe(true);
      expect(result.remainingEvents).toBe(2);
      expect(result.message).toContain('あと2回');
    });

    it('builds warning countdown', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 5,
        progress: 1,
        weekStartUTC: weekStart,
        reasonCode: 'BEHIND',
        todayUTC: '2024-01-19', // Friday, 2 days left
      });

      expect(result.type).toBe('warning');
      expect(result.show).toBe(true);
      expect(result.remainingEvents).toBe(4);
      expect(result.remainingDays).toBe(2);
    });

    it('builds critical countdown on last day', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 5,
        progress: 3,
        weekStartUTC: weekStart,
        reasonCode: 'BEHIND',
        todayUTC: '2024-01-21', // Sunday, 0 days left
      });

      expect(result.type).toBe('critical');
      expect(result.show).toBe(true);
      expect(result.message).toBe('今日が最終日です');
    });

    it('does not show for NO_GOAL', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 0,
        progress: 0,
        weekStartUTC: weekStart,
        reasonCode: 'NO_GOAL',
        todayUTC: '2024-01-18',
      });

      expect(result.show).toBe(false);
      expect(result.type).toBe('none');
    });
  });

  describe('spec-locking', () => {
    const weekStart = '2024-01-15';

    it('[spec-lock] remainingEvents = goal - progress', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 5,
        progress: 2,
        weekStartUTC: weekStart,
        reasonCode: 'ON_TRACK',
        todayUTC: '2024-01-17',
      });

      expect(result.remainingEvents).toBe(3);
    });

    it('[spec-lock] progress >= goal means achieved', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 5,
        progress: 6,
        weekStartUTC: weekStart,
        reasonCode: 'ACHIEVED',
        todayUTC: '2024-01-18',
      });

      expect(result.type).toBe('achieved');
    });

    it('[spec-lock] goalTarget = 0 means no show', () => {
      const result = buildWeeklyCountdown({
        goalTarget: 0,
        progress: 0,
        weekStartUTC: weekStart,
        reasonCode: 'NO_GOAL',
        todayUTC: '2024-01-18',
      });

      expect(result.show).toBe(false);
    });
  });
});
