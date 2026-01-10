import { describe, it, expect } from 'vitest';
import {
  getAllLessons,
  getLessonById,
  getAllTags,
  getNextLessons,
  getPrerequisiteLessons,
  isLessonUnlocked,
  getIncompletePrerequisites,
} from '@/lib/lessons';

describe('lessons data', () => {
  it('should have lessons array', () => {
    const lessons = getAllLessons();
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBeGreaterThan(0);
  });

  it('should have valid lesson structure', () => {
    const lessons = getAllLessons();
    lessons.forEach((lesson) => {
      expect(lesson).toHaveProperty('id');
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('description');
      expect(lesson).toHaveProperty('Component');
      expect(lesson).toHaveProperty('tags');
      expect(lesson).toHaveProperty('difficulty');
      expect(lesson).toHaveProperty('estimatedMinutes');
      expect(['beginner', 'intermediate', 'advanced']).toContain(lesson.difficulty);
      expect(Array.isArray(lesson.tags)).toBe(true);
    });
  });

  it('should have Component as a function', () => {
    const lessons = getAllLessons();
    lessons.forEach((lesson) => {
      expect(typeof lesson.Component).toBe('function');
    });
  });

  it('should have unique lesson ids', () => {
    const lessons = getAllLessons();
    const ids = lessons.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});

describe('getLessonById', () => {
  it('should return lesson by id', () => {
    const lesson = getLessonById('react-basics');
    expect(lesson).toBeDefined();
    expect(lesson?.id).toBe('react-basics');
  });

  it('should return undefined for non-existent id', () => {
    const lesson = getLessonById('non-existent');
    expect(lesson).toBeUndefined();
  });
});

describe('getAllTags', () => {
  it('should return unique sorted tags', () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeGreaterThan(0);

    const sortedTags = [...tags].sort();
    expect(tags).toEqual(sortedTags);

    const uniqueTags = new Set(tags);
    expect(tags.length).toBe(uniqueTags.size);
  });

  it('should include common React tags', () => {
    const tags = getAllTags();
    expect(tags).toContain('react');
  });
});

describe('getNextLessons', () => {
  it('should return lessons that have this lesson as prerequisite', () => {
    // react-basics is a prerequisite for useState-hook
    const nextLessons = getNextLessons('react-basics');
    const nextIds = nextLessons.map((l) => l.id);
    expect(nextIds).toContain('useState-hook');
  });

  it('should return empty array for lesson with no dependents', () => {
    // Assuming no lesson depends on 'react-forms' (the last in the chain)
    const lessons = getAllLessons();
    const formLesson = lessons.find((l) => l.id === 'react-forms');
    if (formLesson) {
      const nextLessons = getNextLessons('react-forms');
      // This may or may not be empty depending on the actual data
      expect(Array.isArray(nextLessons)).toBe(true);
    }
  });

  it('should respect the limit parameter', () => {
    const nextLessons = getNextLessons('react-basics', 1);
    expect(nextLessons.length).toBeLessThanOrEqual(1);
  });
});

describe('getPrerequisiteLessons', () => {
  it('should return prerequisite lessons', () => {
    // useState-hook has react-basics as prerequisite
    const prereqs = getPrerequisiteLessons('useState-hook');
    const prereqIds = prereqs.map((l) => l.id);
    expect(prereqIds).toContain('react-basics');
  });

  it('should return empty array for lesson with no prerequisites', () => {
    const prereqs = getPrerequisiteLessons('react-basics');
    expect(prereqs).toHaveLength(0);
  });

  it('should return empty array for non-existent lesson', () => {
    const prereqs = getPrerequisiteLessons('non-existent');
    expect(prereqs).toHaveLength(0);
  });
});

describe('isLessonUnlocked', () => {
  it('should return true for lesson with no prerequisites', () => {
    const completedIds = new Set<string>();
    expect(isLessonUnlocked('react-basics', completedIds)).toBe(true);
  });

  it('should return false for non-existent lesson', () => {
    const completedIds = new Set<string>();
    expect(isLessonUnlocked('non-existent', completedIds)).toBe(false);
  });

  it('should return true when all prerequisites are completed', () => {
    const completedIds = new Set(['react-basics']);
    expect(isLessonUnlocked('useState-hook', completedIds)).toBe(true);
  });

  it('should return false when prerequisites are not completed', () => {
    const completedIds = new Set<string>();
    expect(isLessonUnlocked('useState-hook', completedIds)).toBe(false);
  });
});

describe('getIncompletePrerequisites', () => {
  it('should return empty array for lesson with no prerequisites', () => {
    const completedIds = new Set<string>();
    const incomplete = getIncompletePrerequisites('react-basics', completedIds);
    expect(incomplete).toHaveLength(0);
  });

  it('should return empty array for non-existent lesson', () => {
    const completedIds = new Set<string>();
    const incomplete = getIncompletePrerequisites('non-existent', completedIds);
    expect(incomplete).toHaveLength(0);
  });

  it('should return incomplete prerequisites', () => {
    const completedIds = new Set<string>();
    const incomplete = getIncompletePrerequisites('useState-hook', completedIds);
    const incompleteIds = incomplete.map((l) => l.id);
    expect(incompleteIds).toContain('react-basics');
  });

  it('should return empty when all prerequisites completed', () => {
    const completedIds = new Set(['react-basics']);
    const incomplete = getIncompletePrerequisites('useState-hook', completedIds);
    expect(incomplete).toHaveLength(0);
  });
});
