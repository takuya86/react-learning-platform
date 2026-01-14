import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRecommendedLessons,
  hasRecommendations,
  getRecommendationCount,
} from '@/features/insights/services/recommendationService';
import type { LoadedLesson } from '@/lib/lessons';
import type { Difficulty } from '@/domain/types';

// Mock data factory
function createLesson(id: string, overrides: Partial<LoadedLesson> = {}): LoadedLesson {
  return {
    id,
    title: `Lesson ${id}`,
    description: `Description for ${id}`,
    tags: ['react'],
    difficulty: 'beginner' as Difficulty,
    estimatedMinutes: 10,
    prerequisites: [],
    relatedQuizzes: [],
    Component: () => null,
    ...overrides,
  };
}

// Track test lessons for the mock
let testLessons: LoadedLesson[] = [];

// Mock the lessons module
vi.mock('@/lib/lessons', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/lessons')>();
  return {
    ...original,
    topologicalSort: original.topologicalSort,
    isLessonUnlocked: (lessonId: string, completedIds: Set<string>) => {
      const lesson = testLessons.find((l) => l.id === lessonId);
      if (!lesson) return false;
      if (lesson.prerequisites.length === 0) return true;
      return lesson.prerequisites.every((prereq) => completedIds.has(prereq));
    },
  };
});

// Helper to set test lessons for each test
function setTestLessons(lessons: LoadedLesson[]) {
  testLessons = lessons;
}

describe('recommendationService', () => {
  beforeEach(() => {
    testLessons = [];
  });

  describe('getRecommendedLessons', () => {
    it('should exclude lessons with incomplete prerequisites', () => {
      const lessons = [
        createLesson('lesson-1'),
        createLesson('lesson-2', { prerequisites: ['lesson-1'] }),
        createLesson('lesson-3', { prerequisites: ['lesson-2'] }),
      ];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const result = getRecommendedLessons(lessons, completedIds);

      // Only lesson-1 should be recommended (no prerequisites)
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('lesson-1');
    });

    it('should exclude completed lessons', () => {
      const lessons = [
        createLesson('lesson-1'),
        createLesson('lesson-2'),
        createLesson('lesson-3'),
      ];
      setTestLessons(lessons);
      const completedIds = new Set(['lesson-1', 'lesson-2']);

      const result = getRecommendedLessons(lessons, completedIds);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('lesson-3');
    });

    it('should unlock lessons when prerequisites are completed', () => {
      const lessons = [
        createLesson('lesson-1'),
        createLesson('lesson-2', { prerequisites: ['lesson-1'] }),
      ];
      setTestLessons(lessons);
      const completedIds = new Set(['lesson-1']);

      const result = getRecommendedLessons(lessons, completedIds);

      // lesson-2 should now be recommended since lesson-1 is completed
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('lesson-2');
    });

    it('should return stable ordering based on topological sort', () => {
      const lessons = [
        createLesson('lesson-3', { difficulty: 'advanced' }),
        createLesson('lesson-1', { difficulty: 'beginner' }),
        createLesson('lesson-2', { difficulty: 'intermediate' }),
      ];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const result1 = getRecommendedLessons(lessons, completedIds);
      const result2 = getRecommendedLessons(lessons, completedIds);

      // Results should be identical
      expect(result1.map((l) => l.id)).toEqual(result2.map((l) => l.id));
      // Order: beginner first (lesson-1), then intermediate (lesson-2), then advanced (lesson-3)
      expect(result1[0].id).toBe('lesson-1');
    });

    it('should return empty array when no lessons available', () => {
      const lessons: LoadedLesson[] = [];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const result = getRecommendedLessons(lessons, completedIds);

      expect(result).toEqual([]);
    });

    it('should return empty array when all lessons are completed', () => {
      const lessons = [createLesson('lesson-1'), createLesson('lesson-2')];
      setTestLessons(lessons);
      const completedIds = new Set(['lesson-1', 'lesson-2']);

      const result = getRecommendedLessons(lessons, completedIds);

      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', () => {
      const lessons = [
        createLesson('lesson-1'),
        createLesson('lesson-2'),
        createLesson('lesson-3'),
        createLesson('lesson-4'),
        createLesson('lesson-5'),
      ];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const result = getRecommendedLessons(lessons, completedIds, 3);

      expect(result.length).toBe(3);
    });

    it('should handle limit larger than available lessons', () => {
      const lessons = [createLesson('lesson-1'), createLesson('lesson-2')];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const result = getRecommendedLessons(lessons, completedIds, 10);

      expect(result.length).toBe(2);
    });

    it('should prioritize lessons earlier in learning path', () => {
      const lessons = [
        createLesson('lesson-1', { difficulty: 'beginner' }),
        createLesson('lesson-2', { difficulty: 'beginner', prerequisites: ['lesson-1'] }),
        createLesson('lesson-3', { difficulty: 'intermediate' }),
      ];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const result = getRecommendedLessons(lessons, completedIds);

      // lesson-1 should come first (beginner with no prereqs)
      // lesson-3 should be next (intermediate, no prereqs - unlocked)
      // lesson-2 is locked (needs lesson-1)
      expect(result[0].id).toBe('lesson-1');
    });

    it('[仕様固定] 推薦順序は「未完了→アンロック済み→トポロジカル順」の優先度で決定される', () => {
      // この仕様を変更する場合は recommendationService.ts のコメントも更新すること
      const lessons = [
        createLesson('advanced-1', { difficulty: 'advanced' }),
        createLesson('beginner-1', { difficulty: 'beginner' }),
        createLesson('intermediate-1', {
          difficulty: 'intermediate',
          prerequisites: ['beginner-1'],
        }),
        createLesson('beginner-2', { difficulty: 'beginner' }),
      ];
      setTestLessons(lessons);
      const completedIds = new Set(['beginner-1']);

      const result = getRecommendedLessons(lessons, completedIds);

      // 期待される順序:
      // 1. beginner-2 (未完了、アンロック済み、難易度低)
      // 2. intermediate-1 (未完了、アンロック済み=beginner-1完了)
      // 3. advanced-1 (未完了、アンロック済み)
      // beginner-1 は完了済みなので除外
      expect(result.map((l) => l.id)).toEqual(['beginner-2', 'intermediate-1', 'advanced-1']);
    });
  });

  describe('hasRecommendations', () => {
    it('should return true when recommendations exist', () => {
      const lessons = [createLesson('lesson-1')];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      expect(hasRecommendations(lessons, completedIds)).toBe(true);
    });

    it('should return false when no recommendations', () => {
      const lessons = [createLesson('lesson-1')];
      setTestLessons(lessons);
      const completedIds = new Set(['lesson-1']);

      expect(hasRecommendations(lessons, completedIds)).toBe(false);
    });
  });

  describe('getRecommendationCount', () => {
    it('should return correct count of available recommendations', () => {
      const lessons = [
        createLesson('lesson-1'),
        createLesson('lesson-2'),
        createLesson('lesson-3'),
      ];
      setTestLessons(lessons);
      const completedIds = new Set(['lesson-1']);

      const count = getRecommendationCount(lessons, completedIds);

      expect(count).toBe(2);
    });

    it('should respect maxCount parameter', () => {
      const lessons = [
        createLesson('lesson-1'),
        createLesson('lesson-2'),
        createLesson('lesson-3'),
        createLesson('lesson-4'),
        createLesson('lesson-5'),
      ];
      setTestLessons(lessons);
      const completedIds = new Set<string>();

      const count = getRecommendationCount(lessons, completedIds, 3);

      expect(count).toBe(3);
    });
  });
});
