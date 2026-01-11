/**
 * lessonEffectivenessRankingService Tests
 *
 * [spec-lock] Lesson-level Effectiveness Ranking
 */

import { describe, it, expect } from 'vitest';
import type { LearningEvent } from './metricsService';
import {
  calculateLessonMetrics,
  buildLessonRanking,
  type LessonInfo,
  DEFAULT_MIN_SAMPLE,
} from './lessonEffectivenessRankingService';

// Helper to create test events
function createEvent(
  type: LearningEvent['event_type'],
  dateStr: string,
  userId = 'user1',
  referenceId?: string,
  createdAt?: string
): LearningEvent {
  return {
    user_id: userId,
    event_type: type,
    event_date: dateStr,
    reference_id: referenceId,
    created_at: createdAt,
  };
}

// Test lessons
const testLessons: LessonInfo[] = [
  { slug: 'react-basics', title: 'React Basics', difficulty: 'beginner' },
  { slug: 'useState-hook', title: 'useState Hook', difficulty: 'beginner' },
  { slug: 'useEffect-hook', title: 'useEffect Hook', difficulty: 'intermediate' },
  { slug: 'react-context', title: 'React Context', difficulty: 'advanced' },
];

describe('lessonEffectivenessRankingService', () => {
  // ============================================================
  // calculateLessonMetrics
  // ============================================================

  describe('calculateLessonMetrics', () => {
    it('returns empty map for no events', () => {
      const result = calculateLessonMetrics([]);
      expect(result.size).toBe(0);
    });

    it('counts origin events per lesson', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T11:00:00Z'),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T12:00:00Z'
        ),
      ];
      const result = calculateLessonMetrics(events);

      expect(result.get('react-basics')?.originCount).toBe(2);
      expect(result.get('useState-hook')?.originCount).toBe(1);
    });

    /**
     * [spec-lock] Follow-up window is 24 hours
     * 23:59 after origin is within window
     */
    it('counts follow-up within 24h window', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-16',
          'user1',
          'react-basics',
          '2024-01-16T09:59:00Z'
        ), // 23h59m later
      ];
      const result = calculateLessonMetrics(events);
      expect(result.get('react-basics')?.followUpCount).toBe(1);
    });

    /**
     * [spec-lock] Follow-up after 24h window is not counted
     * 24:01 after origin is outside window
     */
    it('does not count follow-up outside 24h window', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-16',
          'user1',
          'react-basics',
          '2024-01-16T10:01:00Z'
        ), // 24h1m later
      ];
      const result = calculateLessonMetrics(events);
      expect(result.get('react-basics')?.followUpCount).toBe(0);
    });

    /**
     * [spec-lock] Multiple follow-ups count as 1 per origin
     * Even if user does review + quiz + note, it counts as 1 follow-up
     */
    it('counts multiple follow-ups as 1 per origin', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T12:00:00Z'),
        createEvent('note_created', '2024-01-15', 'user1', 'react-basics', '2024-01-15T13:00:00Z'),
      ];
      const result = calculateLessonMetrics(events);
      expect(result.get('react-basics')?.originCount).toBe(1);
      expect(result.get('react-basics')?.followUpCount).toBe(1);
    });

    it('handles multiple users independently', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        // user2 has no follow-up
      ];
      const result = calculateLessonMetrics(events);
      expect(result.get('react-basics')?.originCount).toBe(2);
      expect(result.get('react-basics')?.followUpCount).toBe(1);
    });

    it('ignores events without reference_id', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', '', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user1', undefined, '2024-01-15T11:00:00Z'),
      ];
      const result = calculateLessonMetrics(events);
      expect(result.size).toBe(0);
    });

    it('uses custom window hours', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T14:00:00Z'
        ), // 4h later
      ];

      // 2h window - should not count
      const result2h = calculateLessonMetrics(events, { windowHours: 2 });
      expect(result2h.get('react-basics')?.followUpCount).toBe(0);

      // 6h window - should count
      const result6h = calculateLessonMetrics(events, { windowHours: 6 });
      expect(result6h.get('react-basics')?.followUpCount).toBe(1);
    });
  });

  // ============================================================
  // buildLessonRanking
  // ============================================================

  describe('buildLessonRanking', () => {
    it('returns empty arrays for no events', () => {
      const result = buildLessonRanking([], testLessons);
      expect(result.best).toEqual([]);
      expect(result.worst).toEqual([]);
    });

    /**
     * [spec-lock] Best is sorted by followUpRate desc, tie-break by originCount desc
     */
    it('sorts best by followUpRate desc, originCount desc', () => {
      const events = [
        // react-basics: 2 origins, 2 follow-ups = 100%
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user2',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),

        // useState-hook: 1 origin, 1 follow-up = 100%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T12:00:00Z'
        ),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T13:00:00Z'
        ),

        // useEffect-hook: 2 origins, 1 follow-up = 50%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T14:00:00Z'
        ),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T15:00:00Z'
        ),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user2',
          'useEffect-hook',
          '2024-01-15T14:00:00Z'
        ),
        // user2 no follow-up
      ];

      const result = buildLessonRanking(events, testLessons);

      // Best: 100% with higher originCount first
      expect(result.best[0].slug).toBe('react-basics'); // 100%, 2 origins
      expect(result.best[1].slug).toBe('useState-hook'); // 100%, 1 origin
      expect(result.best[2].slug).toBe('useEffect-hook'); // 50%
    });

    /**
     * [spec-lock] Worst is sorted by followUpRate asc, tie-break by originCount desc
     */
    it('sorts worst by followUpRate asc, originCount desc', () => {
      const events = [
        // react-basics: 2 origins, 2 follow-ups = 100%
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user2',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),

        // useEffect-hook: 2 origins, 0 follow-ups = 0%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T14:00:00Z'
        ),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user2',
          'useEffect-hook',
          '2024-01-15T14:00:00Z'
        ),

        // useState-hook: 1 origin, 0 follow-ups = 0%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T12:00:00Z'
        ),
      ];

      const result = buildLessonRanking(events, testLessons);

      // Worst: 0% with higher originCount first
      expect(result.worst[0].slug).toBe('useEffect-hook'); // 0%, 2 origins
      expect(result.worst[1].slug).toBe('useState-hook'); // 0%, 1 origin
      expect(result.worst[2].slug).toBe('react-basics'); // 100%
    });

    /**
     * [spec-lock] Lessons with originCount = 0 are excluded
     */
    it('excludes lessons with no origin events', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
      ];

      const result = buildLessonRanking(events, testLessons);

      // Only react-basics has origin events
      expect(result.best.length).toBe(1);
      expect(result.best[0].slug).toBe('react-basics');
    });

    /**
     * [spec-lock] Low sample flag when originCount < minSample (default 5)
     */
    it('marks low sample when originCount < minSample', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user3', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user4', 'react-basics', '2024-01-15T10:00:00Z'),
        // 4 origins - below default minSample of 5
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].isLowSample).toBe(true);
    });

    it('does not mark low sample when originCount >= minSample', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user3', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user4', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user5', 'react-basics', '2024-01-15T10:00:00Z'),
        // 5 origins - exactly at minSample
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].isLowSample).toBe(false);
    });

    it('uses custom minSample', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
      ];

      const result = buildLessonRanking(events, testLessons, { minSample: 3 });
      expect(result.best[0].isLowSample).toBe(true);

      const result2 = buildLessonRanking(events, testLessons, { minSample: 2 });
      expect(result2.best[0].isLowSample).toBe(false);
    });

    it('respects limit option', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T10:00:00Z'
        ),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T10:00:00Z'
        ),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'react-context',
          '2024-01-15T10:00:00Z'
        ),
      ];

      const result = buildLessonRanking(events, testLessons, { limit: 2 });
      expect(result.best.length).toBe(2);
      expect(result.worst.length).toBe(2);
    });

    it('includes lesson info from lessons array', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].title).toBe('React Basics');
      expect(result.best[0].difficulty).toBe('beginner');
    });

    it('falls back to slug when lesson not found', () => {
      const events = [
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'unknown-lesson',
          '2024-01-15T10:00:00Z'
        ),
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].title).toBe('unknown-lesson');
      expect(result.best[0].difficulty).toBe('beginner');
    });

    it('calculates followUpRate as percentage', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T11:00:00Z'
        ),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        // user2 no follow-up
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].followUpRate).toBe(50); // 1/2 = 50%
    });
  });

  // ============================================================
  // DEFAULT_MIN_SAMPLE constant
  // ============================================================

  describe('DEFAULT_MIN_SAMPLE', () => {
    it('is 5', () => {
      expect(DEFAULT_MIN_SAMPLE).toBe(5);
    });
  });
});
