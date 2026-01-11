import { describe, it, expect } from 'vitest';
import {
  buildIntervention,
  isStreakAtRisk,
  isWeeklyAtRisk,
  hasInterventionCta,
  shouldLogIntervention,
} from '@/features/metrics/services/interventionService';
import { INTERVENTION_CTA_TEXT, LOGGABLE_INTERVENTION_TYPES } from '@/features/metrics/constants';
import type {
  StreakExplain,
  WeeklyGoalExplain,
} from '@/features/metrics/services/metricsExplainService';

// Helper to create mock StreakExplain
function createStreakExplain(
  reasonCode: StreakExplain['reasonCode'],
  currentStreak: number
): StreakExplain {
  return {
    currentStreak,
    todayCount: reasonCode === 'ACTIVE_TODAY' ? 1 : 0,
    lastActiveDateUTC: null,
    reasonCode,
    message: '',
    details: [],
  };
}

// Helper to create mock WeeklyGoalExplain
function createWeeklyExplain(
  reasonCode: WeeklyGoalExplain['reasonCode'],
  goalPerWeek: number = 5,
  completedDaysThisWeek: number = 2
): WeeklyGoalExplain {
  return {
    goalPerWeek,
    completedDaysThisWeek,
    weekStartUTC: '2024-01-15',
    weekEndUTC: '2024-01-21',
    reasonCode,
    message: '',
    details: [],
  };
}

describe('interventionService', () => {
  describe('isStreakAtRisk', () => {
    it('returns true when ACTIVE_YESTERDAY with streak > 0', () => {
      const streakExplain = createStreakExplain('ACTIVE_YESTERDAY', 5);
      expect(isStreakAtRisk(streakExplain)).toBe(true);
    });

    it('returns false when ACTIVE_YESTERDAY with streak = 0', () => {
      const streakExplain = createStreakExplain('ACTIVE_YESTERDAY', 0);
      expect(isStreakAtRisk(streakExplain)).toBe(false);
    });

    it('returns false when ACTIVE_TODAY', () => {
      const streakExplain = createStreakExplain('ACTIVE_TODAY', 5);
      expect(isStreakAtRisk(streakExplain)).toBe(false);
    });

    it('returns false when BROKEN', () => {
      const streakExplain = createStreakExplain('BROKEN', 0);
      expect(isStreakAtRisk(streakExplain)).toBe(false);
    });
  });

  describe('isWeeklyAtRisk', () => {
    it('returns true when BEHIND', () => {
      const weeklyExplain = createWeeklyExplain('BEHIND');
      expect(isWeeklyAtRisk(weeklyExplain)).toBe(true);
    });

    it('returns false when ON_TRACK', () => {
      const weeklyExplain = createWeeklyExplain('ON_TRACK');
      expect(isWeeklyAtRisk(weeklyExplain)).toBe(false);
    });

    it('returns false when ACHIEVED', () => {
      const weeklyExplain = createWeeklyExplain('ACHIEVED');
      expect(isWeeklyAtRisk(weeklyExplain)).toBe(false);
    });
  });

  describe('buildIntervention', () => {
    describe('priority order', () => {
      it('returns STREAK_RESCUE for danger + streak at risk', () => {
        const result = buildIntervention({
          habitState: 'danger',
          streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
          weeklyExplain: createWeeklyExplain('BEHIND'),
        });

        expect(result?.type).toBe('STREAK_RESCUE');
      });

      it('returns WEEKLY_CATCHUP for warning + weekly at risk', () => {
        const result = buildIntervention({
          habitState: 'warning',
          streakExplain: createStreakExplain('ACTIVE_TODAY', 5),
          weeklyExplain: createWeeklyExplain('BEHIND'),
        });

        expect(result?.type).toBe('WEEKLY_CATCHUP');
      });

      it('returns POSITIVE for stable state', () => {
        const result = buildIntervention({
          habitState: 'stable',
          streakExplain: createStreakExplain('ACTIVE_TODAY', 7),
          weeklyExplain: createWeeklyExplain('ON_TRACK'),
        });

        expect(result?.type).toBe('POSITIVE');
      });
    });

    describe('fallback behavior', () => {
      it('returns WEEKLY_CATCHUP for danger without streak risk but with weekly risk', () => {
        const result = buildIntervention({
          habitState: 'danger',
          streakExplain: createStreakExplain('BROKEN', 0),
          weeklyExplain: createWeeklyExplain('BEHIND'),
        });

        expect(result?.type).toBe('WEEKLY_CATCHUP');
      });

      it('returns STREAK_RESCUE for warning without weekly risk but with streak risk', () => {
        const result = buildIntervention({
          habitState: 'warning',
          streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 3),
          weeklyExplain: createWeeklyExplain('ON_TRACK'),
        });

        expect(result?.type).toBe('STREAK_RESCUE');
      });

      it('returns null for warning without any risk', () => {
        const result = buildIntervention({
          habitState: 'warning',
          streakExplain: createStreakExplain('ACTIVE_TODAY', 3),
          weeklyExplain: createWeeklyExplain('ON_TRACK'),
        });

        expect(result).toBeNull();
      });

      it('returns null for danger without any risk', () => {
        const result = buildIntervention({
          habitState: 'danger',
          streakExplain: createStreakExplain('BROKEN', 0),
          weeklyExplain: createWeeklyExplain('ON_TRACK'),
        });

        expect(result).toBeNull();
      });
    });

    describe('intervention content', () => {
      it('STREAK_RESCUE has correct CTA text', () => {
        const result = buildIntervention({
          habitState: 'danger',
          streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
          weeklyExplain: createWeeklyExplain('ON_TRACK'),
        });

        expect(result?.type).toBe('STREAK_RESCUE');
        if (result?.type === 'STREAK_RESCUE') {
          expect(result.ctaText).toBe('5分だけ学習する');
        }
      });

      it('WEEKLY_CATCHUP has correct CTA text', () => {
        const result = buildIntervention({
          habitState: 'warning',
          streakExplain: createStreakExplain('ACTIVE_TODAY', 5),
          weeklyExplain: createWeeklyExplain('BEHIND'),
        });

        expect(result?.type).toBe('WEEKLY_CATCHUP');
        if (result?.type === 'WEEKLY_CATCHUP') {
          expect(result.ctaText).toBe('今週分を取り戻す');
        }
      });

      it('POSITIVE has no CTA', () => {
        const result = buildIntervention({
          habitState: 'stable',
          streakExplain: createStreakExplain('ACTIVE_TODAY', 7),
          weeklyExplain: createWeeklyExplain('ACHIEVED'),
        });

        expect(result?.type).toBe('POSITIVE');
        if (result?.type === 'POSITIVE') {
          expect('ctaText' in result).toBe(false);
        }
      });

      it('STREAK_RESCUE includes streak count in message', () => {
        const result = buildIntervention({
          habitState: 'danger',
          streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
          weeklyExplain: createWeeklyExplain('ON_TRACK'),
        });

        expect(result?.message).toContain('5日');
      });
    });
  });

  describe('hasInterventionCta', () => {
    it('returns true for STREAK_RESCUE', () => {
      const intervention = buildIntervention({
        habitState: 'danger',
        streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
        weeklyExplain: createWeeklyExplain('ON_TRACK'),
      });

      expect(hasInterventionCta(intervention)).toBe(true);
    });

    it('returns true for WEEKLY_CATCHUP', () => {
      const intervention = buildIntervention({
        habitState: 'warning',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 5),
        weeklyExplain: createWeeklyExplain('BEHIND'),
      });

      expect(hasInterventionCta(intervention)).toBe(true);
    });

    it('returns false for POSITIVE', () => {
      const intervention = buildIntervention({
        habitState: 'stable',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 7),
        weeklyExplain: createWeeklyExplain('ACHIEVED'),
      });

      expect(hasInterventionCta(intervention)).toBe(false);
    });

    it('returns false for null', () => {
      expect(hasInterventionCta(null)).toBe(false);
    });
  });

  describe('spec-locking', () => {
    it('[spec-lock] danger + yesterday inactive → STREAK_RESCUE', () => {
      const result = buildIntervention({
        habitState: 'danger',
        streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 3),
        weeklyExplain: createWeeklyExplain('ON_TRACK'),
      });

      expect(result?.type).toBe('STREAK_RESCUE');
    });

    it('[spec-lock] warning + weekly behind → WEEKLY_CATCHUP', () => {
      const result = buildIntervention({
        habitState: 'warning',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 3),
        weeklyExplain: createWeeklyExplain('BEHIND'),
      });

      expect(result?.type).toBe('WEEKLY_CATCHUP');
    });

    it('[spec-lock] stable → POSITIVE', () => {
      const result = buildIntervention({
        habitState: 'stable',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 7),
        weeklyExplain: createWeeklyExplain('ACHIEVED'),
      });

      expect(result?.type).toBe('POSITIVE');
    });

    it('[spec-lock] priority: danger+streak > warning+weekly', () => {
      // Even with both risks, danger+streak takes priority
      const result = buildIntervention({
        habitState: 'danger',
        streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
        weeklyExplain: createWeeklyExplain('BEHIND'),
      });

      expect(result?.type).toBe('STREAK_RESCUE');
    });

    it('[spec-lock] CTA text matches spec', () => {
      const streakRescue = buildIntervention({
        habitState: 'danger',
        streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
        weeklyExplain: createWeeklyExplain('ON_TRACK'),
      });

      const weeklyCatchup = buildIntervention({
        habitState: 'warning',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 5),
        weeklyExplain: createWeeklyExplain('BEHIND'),
      });

      if (streakRescue?.type === 'STREAK_RESCUE') {
        expect(streakRescue.ctaText).toBe('5分だけ学習する');
      }

      if (weeklyCatchup?.type === 'WEEKLY_CATCHUP') {
        expect(weeklyCatchup.ctaText).toBe('今週分を取り戻す');
      }
    });
  });

  describe('shouldLogIntervention', () => {
    it('returns true for STREAK_RESCUE', () => {
      const intervention = buildIntervention({
        habitState: 'danger',
        streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
        weeklyExplain: createWeeklyExplain('ON_TRACK'),
      });

      expect(shouldLogIntervention(intervention)).toBe(true);
    });

    it('returns true for WEEKLY_CATCHUP', () => {
      const intervention = buildIntervention({
        habitState: 'warning',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 5),
        weeklyExplain: createWeeklyExplain('BEHIND'),
      });

      expect(shouldLogIntervention(intervention)).toBe(true);
    });

    it('returns false for POSITIVE', () => {
      const intervention = buildIntervention({
        habitState: 'stable',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 7),
        weeklyExplain: createWeeklyExplain('ACHIEVED'),
      });

      expect(shouldLogIntervention(intervention)).toBe(false);
    });

    it('returns false for null', () => {
      expect(shouldLogIntervention(null)).toBe(false);
    });
  });

  describe('constants integration', () => {
    it('CTA text comes from INTERVENTION_CTA_TEXT constant', () => {
      const streakRescue = buildIntervention({
        habitState: 'danger',
        streakExplain: createStreakExplain('ACTIVE_YESTERDAY', 5),
        weeklyExplain: createWeeklyExplain('ON_TRACK'),
      });

      const weeklyCatchup = buildIntervention({
        habitState: 'warning',
        streakExplain: createStreakExplain('ACTIVE_TODAY', 5),
        weeklyExplain: createWeeklyExplain('BEHIND'),
      });

      if (streakRescue?.type === 'STREAK_RESCUE') {
        expect(streakRescue.ctaText).toBe(INTERVENTION_CTA_TEXT.STREAK_RESCUE);
      }

      if (weeklyCatchup?.type === 'WEEKLY_CATCHUP') {
        expect(weeklyCatchup.ctaText).toBe(INTERVENTION_CTA_TEXT.WEEKLY_CATCHUP);
      }
    });

    it('LOGGABLE_INTERVENTION_TYPES matches expected types', () => {
      expect(LOGGABLE_INTERVENTION_TYPES).toContain('STREAK_RESCUE');
      expect(LOGGABLE_INTERVENTION_TYPES).toContain('WEEKLY_CATCHUP');
      expect(LOGGABLE_INTERVENTION_TYPES).not.toContain('POSITIVE');
    });
  });
});
