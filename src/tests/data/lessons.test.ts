import { describe, it, expect } from 'vitest';
import { getAllLessons, getLessonById, getAllTags } from '@/lib/lessons';

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
