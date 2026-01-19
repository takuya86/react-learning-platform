import { describe, it, expect, vi } from 'vitest';
import { lazy } from 'react';
import { renderHook } from '@testing-library/react';
import { useRecommendations } from '@/features/insights/hooks/useRecommendations';
import type { LoadedLesson } from '@/lib/lessons';
import type { Difficulty } from '@/domain/types';

// Mock lazy component for testing
const MockComponent = lazy(() => Promise.resolve({ default: () => null }));

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
    Component: MockComponent,
    ...overrides,
  };
}

// Mock useProgress hook
vi.mock('@/features/progress', () => ({
  useProgress: () => ({
    getCompletedLessonIds: () => [],
  }),
}));

// Mock getAllLessons
vi.mock('@/lib/lessons', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/lessons')>();
  return {
    ...original,
    getAllLessons: () => [
      createLesson('lesson-1'),
      createLesson('lesson-2'),
      createLesson('lesson-3'),
    ],
  };
});

// Mock the recommendation service
vi.mock('@/features/insights/services/recommendationService', () => ({
  getRecommendedLessons: (lessons: LoadedLesson[], _completedIds: Set<string>, limit: number) =>
    lessons.slice(0, limit),
}));

describe('useRecommendations', () => {
  it('should return recommendations array', () => {
    const { result } = renderHook(() => useRecommendations());

    expect(Array.isArray(result.current.recommendations)).toBe(true);
    expect(result.current.recommendations.length).toBeGreaterThan(0);
  });

  it('should respect the limit option', () => {
    const { result } = renderHook(() => useRecommendations({ limit: 2 }));

    expect(result.current.recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should indicate when recommendations are available', () => {
    const { result } = renderHook(() => useRecommendations());

    expect(result.current.hasRecommendations).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });
});
