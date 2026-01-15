import { describe, it, expect } from 'vitest';
import {
  HABIT_SCORE_WEIGHTS,
  HABIT_SCORE_THRESHOLDS,
  HABIT_SCORE_NORMALIZATION,
  INTERVENTION_PRIORITY,
  INTERVENTION_CTA_TEXT,
  INTERVENTION_ICONS,
  POSITIVE_LONG_STREAK_THRESHOLD,
  INTERVENTION_EVENT_TYPE,
  LOGGABLE_INTERVENTION_TYPES,
} from '@/features/metrics/constants';

describe('metrics constants', () => {
  describe('HABIT_SCORE_WEIGHTS', () => {
    it('contains RECENT_DAYS, STREAK, WEEKLY_PROGRESS', () => {
      expect(HABIT_SCORE_WEIGHTS.RECENT_DAYS).toBeDefined();
      expect(HABIT_SCORE_WEIGHTS.STREAK).toBeDefined();
      expect(HABIT_SCORE_WEIGHTS.WEEKLY_PROGRESS).toBeDefined();
    });

    it('weights sum to 100', () => {
      const sum =
        HABIT_SCORE_WEIGHTS.RECENT_DAYS +
        HABIT_SCORE_WEIGHTS.STREAK +
        HABIT_SCORE_WEIGHTS.WEEKLY_PROGRESS;
      expect(sum).toBe(100);
    });

    it('[spec-lock] weights are 40 + 40 + 20', () => {
      expect(HABIT_SCORE_WEIGHTS.RECENT_DAYS).toBe(40);
      expect(HABIT_SCORE_WEIGHTS.STREAK).toBe(40);
      expect(HABIT_SCORE_WEIGHTS.WEEKLY_PROGRESS).toBe(20);
    });
  });

  describe('HABIT_SCORE_THRESHOLDS', () => {
    it('[spec-lock] STABLE is 80', () => {
      expect(HABIT_SCORE_THRESHOLDS.STABLE).toBe(80);
    });

    it('[spec-lock] WARNING is 50', () => {
      expect(HABIT_SCORE_THRESHOLDS.WARNING).toBe(50);
    });
  });

  describe('HABIT_SCORE_NORMALIZATION', () => {
    it('[spec-lock] MAX_STREAK_DAYS is 7', () => {
      expect(HABIT_SCORE_NORMALIZATION.MAX_STREAK_DAYS).toBe(7);
    });

    it('[spec-lock] RECENT_DAYS_PERIOD is 7', () => {
      expect(HABIT_SCORE_NORMALIZATION.RECENT_DAYS_PERIOD).toBe(7);
    });
  });

  describe('INTERVENTION_PRIORITY', () => {
    it('[spec-lock] priority order is STREAK_RESCUE > WEEKLY_CATCHUP > POSITIVE', () => {
      expect(INTERVENTION_PRIORITY[0]).toBe('STREAK_RESCUE');
      expect(INTERVENTION_PRIORITY[1]).toBe('WEEKLY_CATCHUP');
      expect(INTERVENTION_PRIORITY[2]).toBe('POSITIVE');
    });
  });

  describe('INTERVENTION_CTA_TEXT', () => {
    it('[spec-lock] STREAK_RESCUE CTA is 5分だけ学習する', () => {
      expect(INTERVENTION_CTA_TEXT.STREAK_RESCUE).toBe('5分だけ学習する');
    });

    it('[spec-lock] WEEKLY_CATCHUP CTA is 今週分を取り戻す', () => {
      expect(INTERVENTION_CTA_TEXT.WEEKLY_CATCHUP).toBe('今週分を取り戻す');
    });
  });

  describe('INTERVENTION_ICONS', () => {
    it('has icon names for all intervention types', () => {
      expect(INTERVENTION_ICONS.STREAK_RESCUE).toBe('sprout');
      expect(INTERVENTION_ICONS.WEEKLY_CATCHUP).toBe('calendar');
      expect(INTERVENTION_ICONS.POSITIVE).toBe('sparkles');
      expect(INTERVENTION_ICONS.POSITIVE_LONG_STREAK).toBe('target');
    });
  });

  describe('POSITIVE_LONG_STREAK_THRESHOLD', () => {
    it('[spec-lock] threshold is 7 days', () => {
      expect(POSITIVE_LONG_STREAK_THRESHOLD).toBe(7);
    });
  });

  describe('INTERVENTION_EVENT_TYPE', () => {
    it('is intervention_shown', () => {
      expect(INTERVENTION_EVENT_TYPE).toBe('intervention_shown');
    });
  });

  describe('LOGGABLE_INTERVENTION_TYPES', () => {
    it('[spec-lock] includes STREAK_RESCUE and WEEKLY_CATCHUP', () => {
      expect(LOGGABLE_INTERVENTION_TYPES).toContain('STREAK_RESCUE');
      expect(LOGGABLE_INTERVENTION_TYPES).toContain('WEEKLY_CATCHUP');
    });

    it('[spec-lock] does NOT include POSITIVE', () => {
      expect(LOGGABLE_INTERVENTION_TYPES).not.toContain('POSITIVE');
    });

    it('has exactly 2 loggable types', () => {
      expect(LOGGABLE_INTERVENTION_TYPES.length).toBe(2);
    });
  });
});
