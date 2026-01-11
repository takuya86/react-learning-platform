import { describe, it, expect } from 'vitest';
import {
  selectBestLesson,
  determineUrgency,
  generateHeadline,
  generateReason,
  buildTodayActionRecommendation,
} from '@/features/actionable/services/actionRecommendationService';
import type { LoadedLesson } from '@/lib/lessons';

// Helper to create mock lessons
function createLesson(
  id: string,
  title: string,
  estimatedMinutes: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): LoadedLesson {
  return {
    id,
    title,
    description: `Description for ${title}`,
    estimatedMinutes,
    difficulty,
    tags: ['react'],
    prerequisites: [],
    relatedQuizzes: [],
    objectives: [],
  } as unknown as LoadedLesson;
}

describe('actionRecommendationService', () => {
  describe('selectBestLesson', () => {
    it('returns null for empty array', () => {
      expect(selectBestLesson([])).toBeNull();
    });

    it('selects shortest lesson', () => {
      const lessons = [
        createLesson('lesson-1', 'Lesson 1', 30),
        createLesson('lesson-2', 'Lesson 2', 10),
        createLesson('lesson-3', 'Lesson 3', 20),
      ];

      const result = selectBestLesson(lessons);
      expect(result?.id).toBe('lesson-2');
    });

    it('handles lessons without estimatedMinutes', () => {
      const lesson1 = createLesson('lesson-1', 'Lesson 1', 15);
      const lesson2: LoadedLesson = {
        ...createLesson('lesson-2', 'Lesson 2', 0),
        estimatedMinutes: undefined as unknown as number,
      };

      const result = selectBestLesson([lesson1, lesson2]);
      expect(result?.id).toBe('lesson-1');
    });
  });

  describe('determineUrgency', () => {
    it('returns high for ACTIVE_YESTERDAY with streak', () => {
      expect(determineUrgency('ACTIVE_YESTERDAY', 'ON_TRACK', 5)).toBe('high');
    });

    it('returns high for BEHIND weekly status', () => {
      expect(determineUrgency('ACTIVE_TODAY', 'BEHIND', 3)).toBe('high');
    });

    it('returns medium for ACTIVE_TODAY', () => {
      expect(determineUrgency('ACTIVE_TODAY', 'ON_TRACK', 3)).toBe('medium');
    });

    it('returns high for NO_ACTIVITY_YET with BEHIND weekly status', () => {
      // Weekly BEHIND takes precedence over streak status
      expect(determineUrgency('NO_ACTIVITY_YET', 'BEHIND', 0)).toBe('high');
    });

    it('returns low for NO_ACTIVITY_YET with NO_GOAL weekly status', () => {
      expect(determineUrgency('NO_ACTIVITY_YET', 'NO_GOAL', 0)).toBe('low');
    });

    it('returns low for BROKEN with NO_GOAL weekly status', () => {
      expect(determineUrgency('BROKEN', 'NO_GOAL', 0)).toBe('low');
    });

    it('returns medium for ACTIVE_TODAY even with ACHIEVED weekly', () => {
      // ACTIVE_TODAY returns medium (takes precedence over ACHIEVED)
      expect(determineUrgency('ACTIVE_TODAY', 'ACHIEVED', 5)).toBe('medium');
    });

    it('returns low for ACHIEVED weekly with BROKEN streak', () => {
      expect(determineUrgency('BROKEN', 'ACHIEVED', 0)).toBe('low');
    });
  });

  describe('generateHeadline', () => {
    it('generates streak urgency headline', () => {
      const headline = generateHeadline('high', 'ACTIVE_YESTERDAY', 'ON_TRACK', 5);
      expect(headline).toBe('5日連続を守ろう！');
    });

    it('generates weekly urgency headline', () => {
      const headline = generateHeadline('high', 'ACTIVE_TODAY', 'BEHIND', 3);
      expect(headline).toBe('今週の目標達成まであと少し！');
    });

    it('generates medium urgency headline', () => {
      const headline = generateHeadline('medium', 'ACTIVE_TODAY', 'ON_TRACK', 3);
      expect(headline).toBe('もう少し学習を続けよう！');
    });

    it('generates low urgency headline for achieved', () => {
      const headline = generateHeadline('low', 'ACTIVE_TODAY', 'ACHIEVED', 3);
      expect(headline).toBe('目標達成！さらに学習を進めよう');
    });

    it('generates low urgency headline for new user', () => {
      const headline = generateHeadline('low', 'NO_ACTIVITY_YET', 'BEHIND', 0);
      expect(headline).toBe('今日から学習を始めよう！');
    });
  });

  describe('generateReason', () => {
    const lesson = createLesson('lesson-1', 'Lesson 1', 15);

    it('includes streak info for ACTIVE_YESTERDAY', () => {
      const reason = generateReason(lesson, 'ACTIVE_YESTERDAY', 'ON_TRACK', 5, 2);
      expect(reason).toContain('6日連続');
    });

    it('includes weekly info for BEHIND', () => {
      const reason = generateReason(lesson, 'ACTIVE_TODAY', 'BEHIND', 3, 2);
      expect(reason).toContain('あと2回');
    });

    it('includes time estimate', () => {
      const reason = generateReason(lesson, 'ACTIVE_TODAY', 'ON_TRACK', 3, 2);
      expect(reason).toContain('15分');
    });

    it('includes achieved message for weekly ACHIEVED', () => {
      const reason = generateReason(lesson, 'ACTIVE_TODAY', 'ACHIEVED', 3, 0);
      expect(reason).toContain('目標達成済み');
    });
  });

  describe('buildTodayActionRecommendation', () => {
    it('returns no action when no recommendations', () => {
      const result = buildTodayActionRecommendation({
        recommendations: [],
        streakReasonCode: 'ACTIVE_TODAY',
        weeklyReasonCode: 'ON_TRACK',
        currentStreak: 5,
        remainingWeeklyEvents: 2,
      });

      expect(result.hasAction).toBe(false);
      expect(result.lesson).toBeNull();
      expect(result.headline).toContain('完了');
    });

    it('returns action with lesson recommendation', () => {
      const lessons = [
        createLesson('lesson-1', 'React Basics', 20),
        createLesson('lesson-2', 'Hooks', 15),
      ];

      const result = buildTodayActionRecommendation({
        recommendations: lessons,
        streakReasonCode: 'ACTIVE_YESTERDAY',
        weeklyReasonCode: 'ON_TRACK',
        currentStreak: 5,
        remainingWeeklyEvents: 2,
      });

      expect(result.hasAction).toBe(true);
      expect(result.lesson?.id).toBe('lesson-2'); // Shortest
      expect(result.urgency).toBe('high');
      expect(result.ctaText).toBe('今すぐ始める');
    });

    it('sets correct urgency based on streak status', () => {
      const lessons = [createLesson('lesson-1', 'Lesson 1', 15)];

      const result = buildTodayActionRecommendation({
        recommendations: lessons,
        streakReasonCode: 'ACTIVE_TODAY',
        weeklyReasonCode: 'ON_TRACK',
        currentStreak: 3,
        remainingWeeklyEvents: 2,
      });

      expect(result.urgency).toBe('medium');
    });
  });

  describe('spec-locking', () => {
    it('[spec-lock] shortest lesson is always selected', () => {
      const lessons = [
        createLesson('a', 'A', 30),
        createLesson('b', 'B', 5),
        createLesson('c', 'C', 15),
      ];

      const result = selectBestLesson(lessons);
      expect(result?.id).toBe('b');
    });

    it('[spec-lock] ACTIVE_YESTERDAY with streak=0 is not high urgency', () => {
      expect(determineUrgency('ACTIVE_YESTERDAY', 'ON_TRACK', 0)).not.toBe('high');
    });

    it('[spec-lock] CTA text is always 今すぐ始める', () => {
      const lessons = [createLesson('lesson-1', 'Lesson 1', 15)];
      const result = buildTodayActionRecommendation({
        recommendations: lessons,
        streakReasonCode: 'ACTIVE_TODAY',
        weeklyReasonCode: 'ON_TRACK',
        currentStreak: 3,
        remainingWeeklyEvents: 2,
      });

      expect(result.ctaText).toBe('今すぐ始める');
    });
  });
});
