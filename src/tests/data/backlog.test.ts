import { describe, it, expect } from 'vitest';
import type { BacklogEntry, Difficulty } from '@/domain/types';
import {
  getAllBacklogEntries,
  getAllBacklogTags,
  getFilteredBacklogEntries,
  getTopGenerationCandidates,
  getBacklogStats,
  generateBacklogJson,
} from '@/data/backlog';

describe('backlog data', () => {
  describe('getAllBacklogEntries', () => {
    it('should return an array of backlog entries', () => {
      const entries = getAllBacklogEntries();

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);

      // Check first entry has required fields
      const first = entries[0];
      expect(first).toHaveProperty('slug');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('status');
      expect(first).toHaveProperty('difficulty');
    });
  });

  describe('getAllBacklogTags', () => {
    it('should return sorted unique tags', () => {
      const tags = getAllBacklogTags();

      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);

      // Check tags are sorted
      const sortedTags = [...tags].sort();
      expect(tags).toEqual(sortedTags);

      // Check tags are unique
      const uniqueTags = [...new Set(tags)];
      expect(tags).toEqual(uniqueTags);
    });
  });

  describe('getFilteredBacklogEntries', () => {
    it('should return all entries when no filters provided', () => {
      const all = getAllBacklogEntries();
      const filtered = getFilteredBacklogEntries({});

      expect(filtered).toEqual(all);
    });

    it('should filter by status', () => {
      const entries = getAllBacklogEntries();
      const pendingCount = entries.filter((e) => e.status === 'pending').length;

      const filtered = getFilteredBacklogEntries({ status: ['pending'] });

      expect(filtered.length).toBe(pendingCount);
      expect(filtered.every((e) => e.status === 'pending')).toBe(true);
    });

    it('should filter by difficulty', () => {
      const entries = getAllBacklogEntries();
      const beginnerCount = entries.filter((e) => e.difficulty === 'beginner').length;

      const filtered = getFilteredBacklogEntries({ difficulty: ['beginner'] });

      expect(filtered.length).toBe(beginnerCount);
      expect(filtered.every((e) => e.difficulty === 'beginner')).toBe(true);
    });

    it('should filter by tags', () => {
      const filtered = getFilteredBacklogEntries({ tags: ['react'] });

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((e) => e.tags.includes('react'))).toBe(true);
    });

    it('should combine multiple filters', () => {
      const filtered = getFilteredBacklogEntries({
        status: ['pending'],
        difficulty: ['beginner'],
      });

      expect(filtered.every((e) => e.status === 'pending' && e.difficulty === 'beginner')).toBe(
        true
      );
    });
  });

  describe('getTopGenerationCandidates', () => {
    it('should return only pending entries', () => {
      const entries = getAllBacklogEntries();
      const publishedSlugs = new Set<string>();

      const candidates = getTopGenerationCandidates(entries, publishedSlugs, 10);

      expect(candidates.every((e) => e.status === 'pending')).toBe(true);
    });

    it('should return at most the requested count', () => {
      const entries = getAllBacklogEntries();
      const publishedSlugs = new Set<string>();

      const candidates = getTopGenerationCandidates(entries, publishedSlugs, 3);

      expect(candidates.length).toBeLessThanOrEqual(3);
    });

    it('should prioritize by difficulty (beginner first)', () => {
      const entries = getAllBacklogEntries();
      const publishedSlugs = new Set<string>();

      const candidates = getTopGenerationCandidates(entries, publishedSlugs, 10);

      if (candidates.length >= 2) {
        const difficultyOrder: Record<Difficulty, number> = {
          beginner: 0,
          intermediate: 1,
          advanced: 2,
        };

        for (let i = 1; i < candidates.length; i++) {
          const prevOrder = difficultyOrder[candidates[i - 1].difficulty];
          const currOrder = difficultyOrder[candidates[i].difficulty];
          expect(currOrder).toBeGreaterThanOrEqual(prevOrder);
        }
      }
    });

    it('should exclude entries with unsatisfied prerequisites', () => {
      // Create entries where lesson-2 depends on lesson-1
      const entries: BacklogEntry[] = [
        {
          slug: 'lesson-1',
          title: 'Lesson 1',
          description: 'Desc 1',
          tags: [],
          difficulty: 'beginner',
          estimatedMinutes: 20,
          status: 'pending',
          generatedAt: null,
          prerequisites: [],
          relatedQuizzes: [],
        },
        {
          slug: 'lesson-2',
          title: 'Lesson 2',
          description: 'Desc 2',
          tags: [],
          difficulty: 'beginner',
          estimatedMinutes: 20,
          status: 'pending',
          generatedAt: null,
          prerequisites: ['lesson-1'],
          relatedQuizzes: [],
        },
      ];

      const publishedSlugs = new Set<string>();

      const candidates = getTopGenerationCandidates(entries, publishedSlugs, 10);

      // lesson-2 should be excluded because lesson-1 is not published
      expect(candidates.map((c) => c.slug)).toContain('lesson-1');
      expect(candidates.map((c) => c.slug)).not.toContain('lesson-2');
    });

    it('should include entries when prerequisites are published', () => {
      const entries: BacklogEntry[] = [
        {
          slug: 'lesson-1',
          title: 'Lesson 1',
          description: 'Desc 1',
          tags: [],
          difficulty: 'beginner',
          estimatedMinutes: 20,
          status: 'pending',
          generatedAt: null,
          prerequisites: ['published-lesson'],
          relatedQuizzes: [],
        },
      ];

      const publishedSlugs = new Set(['published-lesson']);

      const candidates = getTopGenerationCandidates(entries, publishedSlugs, 10);

      expect(candidates.map((c) => c.slug)).toContain('lesson-1');
    });
  });

  describe('getBacklogStats', () => {
    it('should return correct totals', () => {
      const entries = getAllBacklogEntries();
      const stats = getBacklogStats(entries);

      expect(stats.total).toBe(entries.length);

      const statusTotal =
        stats.byStatus.pending + stats.byStatus.generated + stats.byStatus.published;
      expect(statusTotal).toBe(entries.length);

      const difficultyTotal =
        stats.byDifficulty.beginner + stats.byDifficulty.intermediate + stats.byDifficulty.advanced;
      expect(difficultyTotal).toBe(entries.length);
    });
  });

  describe('generateBacklogJson', () => {
    it('should generate valid JSON', () => {
      const entries = getAllBacklogEntries();
      const json = generateBacklogJson(entries);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include version and lessons', () => {
      const entries = getAllBacklogEntries();
      const json = generateBacklogJson(entries);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('lessons');
      expect(parsed.lessons).toEqual(entries);
    });

    it('should be formatted with 2-space indentation', () => {
      const entries = getAllBacklogEntries();
      const json = generateBacklogJson(entries);

      // Check for 2-space indentation
      expect(json).toContain('  "');
    });
  });
});
