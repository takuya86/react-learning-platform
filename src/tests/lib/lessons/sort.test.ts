import { describe, it, expect } from 'vitest';
import { topologicalSort, groupByDifficulty } from '@/lib/lessons/sort';
import type { LoadedLesson } from '@/lib/lessons/types';
import type { ComponentType } from 'react';

// Mock component for testing
const MockComponent: ComponentType = () => null;

function createMockLesson(
  id: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  prerequisites: string[] = []
): LoadedLesson {
  return {
    id,
    title: `Lesson ${id}`,
    description: `Description for ${id}`,
    tags: ['react'],
    difficulty,
    estimatedMinutes: 20,
    prerequisites,
    relatedQuizzes: [],
    Component: MockComponent,
  };
}

describe('topologicalSort', () => {
  it('should return empty array for empty input', () => {
    expect(topologicalSort([])).toEqual([]);
  });

  it('should return lessons with no prerequisites in order', () => {
    const lessons = [
      createMockLesson('a', 'beginner'),
      createMockLesson('b', 'intermediate'),
      createMockLesson('c', 'advanced'),
    ];

    const sorted = topologicalSort(lessons);

    expect(sorted.map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('should put prerequisites before dependent lessons', () => {
    const lessons = [
      createMockLesson('advanced', 'advanced', ['intermediate']),
      createMockLesson('beginner', 'beginner'),
      createMockLesson('intermediate', 'intermediate', ['beginner']),
    ];

    const sorted = topologicalSort(lessons);
    const ids = sorted.map((l) => l.id);

    // beginner should come before intermediate
    expect(ids.indexOf('beginner')).toBeLessThan(ids.indexOf('intermediate'));
    // intermediate should come before advanced
    expect(ids.indexOf('intermediate')).toBeLessThan(ids.indexOf('advanced'));
  });

  it('should handle multiple prerequisites', () => {
    const lessons = [
      createMockLesson('final', 'advanced', ['prereq1', 'prereq2']),
      createMockLesson('prereq1', 'beginner'),
      createMockLesson('prereq2', 'beginner'),
    ];

    const sorted = topologicalSort(lessons);
    const ids = sorted.map((l) => l.id);

    // Both prerequisites should come before final
    expect(ids.indexOf('prereq1')).toBeLessThan(ids.indexOf('final'));
    expect(ids.indexOf('prereq2')).toBeLessThan(ids.indexOf('final'));
  });

  it('should handle missing prerequisites gracefully', () => {
    const lessons = [
      createMockLesson('a', 'beginner', ['missing']),
      createMockLesson('b', 'beginner'),
    ];

    // Should not throw
    const sorted = topologicalSort(lessons);
    expect(sorted).toHaveLength(2);
  });

  it('should handle circular dependencies gracefully', () => {
    const lessons = [
      createMockLesson('a', 'beginner', ['b']),
      createMockLesson('b', 'beginner', ['a']),
    ];

    // Should not throw and should return all lessons
    const sorted = topologicalSort(lessons);
    expect(sorted.length).toBeGreaterThan(0);
  });
});

describe('groupByDifficulty', () => {
  it('should group lessons by difficulty', () => {
    const lessons = [
      createMockLesson('a', 'beginner'),
      createMockLesson('b', 'intermediate'),
      createMockLesson('c', 'advanced'),
      createMockLesson('d', 'beginner'),
    ];

    const grouped = groupByDifficulty(lessons);

    expect(grouped.beginner.map((l) => l.id)).toEqual(['a', 'd']);
    expect(grouped.intermediate.map((l) => l.id)).toEqual(['b']);
    expect(grouped.advanced.map((l) => l.id)).toEqual(['c']);
  });

  it('should return empty arrays for missing difficulties', () => {
    const lessons = [createMockLesson('a', 'beginner')];

    const grouped = groupByDifficulty(lessons);

    expect(grouped.beginner).toHaveLength(1);
    expect(grouped.intermediate).toHaveLength(0);
    expect(grouped.advanced).toHaveLength(0);
  });
});
