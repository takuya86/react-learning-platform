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
  buildLessonRankingByOrigin,
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
     * Even if user does quiz + note, it counts as 1 follow-up
     * P3-1: review_started is now also an origin, not just a follow-up
     */
    it('counts multiple follow-ups as 1 per origin', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
        createEvent('note_created', '2024-01-15', 'user1', 'react-basics', '2024-01-15T12:00:00Z'),
      ];
      const result = calculateLessonMetrics(events);
      expect(result.get('react-basics')?.originCount).toBe(1);
      expect(result.get('react-basics')?.followUpCount).toBe(1);
    });

    /**
     * P3-1: review_started is now an origin, so we use quiz_started as follow-up
     */
    it('handles multiple users independently', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
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
     * P3-1: review_started is now also an origin, so we use quiz_started as follow-up
     */
    it('sorts best by followUpRate desc, originCount desc', () => {
      const events = [
        // react-basics: 2 origins (lesson_viewed), 2 follow-ups = 100%
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user2', 'react-basics', '2024-01-15T11:00:00Z'),

        // useState-hook: 1 origin (lesson_viewed), 1 follow-up = 100%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T12:00:00Z'
        ),
        createEvent('quiz_started', '2024-01-15', 'user1', 'useState-hook', '2024-01-15T13:00:00Z'),

        // useEffect-hook: 2 origins (lesson_viewed), 1 follow-up = 50%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T14:00:00Z'
        ),
        createEvent(
          'quiz_started',
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
     * [spec-lock] P3-2.4: Worst is sorted by followUpRate asc, tie-break by originCount asc, then slug asc
     * P3-1: review_started is now also an origin, so we use quiz_started as follow-up
     */
    it('sorts worst by followUpRate asc, originCount asc', () => {
      const events = [
        // react-basics: 2 origins (lesson_viewed), 2 follow-ups = 100%
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user2', 'react-basics', '2024-01-15T11:00:00Z'),

        // useEffect-hook: 2 origins (lesson_viewed), 0 follow-ups = 0%
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

        // useState-hook: 1 origin (lesson_viewed), 0 follow-ups = 0%
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T12:00:00Z'
        ),
      ];

      const result = buildLessonRanking(events, testLessons);

      // Worst: 0% with lower originCount first (P3-2.4: originCount asc for worst)
      expect(result.worst[0].slug).toBe('useState-hook'); // 0%, 1 origin
      expect(result.worst[1].slug).toBe('useEffect-hook'); // 0%, 2 origins
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

    /**
     * P3-1: review_started is now also an origin, so we use quiz_started as follow-up
     */
    it('calculates followUpRate as percentage', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        // user2 no follow-up
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].followUpRate).toBe(50); // 1/2 = 50%
    });
  });

  // ============================================================
  // P3-2.4: originFilter and buildLessonRankingByOrigin
  // ============================================================

  describe('originFilter', () => {
    /**
     * [spec-lock] P3-2.4: originFilter を指定すると、そのoriginのみでoriginCountが計算される
     */
    it('[spec-lock] originFilter を指定すると、そのoriginのみでoriginCountが計算される', () => {
      const events = [
        // lesson_viewed: 2 events
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T11:00:00Z'),
        // lesson_completed: 1 event
        createEvent(
          'lesson_completed',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T12:00:00Z'
        ),
        // review_started: 1 event
        createEvent(
          'review_started',
          '2024-01-15',
          'user3',
          'react-basics',
          '2024-01-15T13:00:00Z'
        ),
      ];

      // Without filter: all origins counted (4 total)
      const resultAll = calculateLessonMetrics(events);
      expect(resultAll.get('react-basics')?.originCount).toBe(4);

      // With lesson_viewed filter: only lesson_viewed counted (2)
      const resultViewed = calculateLessonMetrics(events, { originFilter: 'lesson_viewed' });
      expect(resultViewed.get('react-basics')?.originCount).toBe(2);

      // With lesson_completed filter: only lesson_completed counted (1)
      const resultCompleted = calculateLessonMetrics(events, { originFilter: 'lesson_completed' });
      expect(resultCompleted.get('react-basics')?.originCount).toBe(1);

      // With review_started filter: only review_started counted (1)
      const resultReview = calculateLessonMetrics(events, { originFilter: 'review_started' });
      expect(resultReview.get('react-basics')?.originCount).toBe(1);
    });

    /**
     * [spec-lock] P3-2.4: review_started を含む ORIGIN_EVENT_TYPES でも同様に集計できる
     */
    it('[spec-lock] review_started を含む ORIGIN_EVENT_TYPES でも同様に集計できる', () => {
      const events = [
        // review_started as origin with follow-up
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T10:00:00Z'
        ),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
        // review_started without follow-up
        createEvent(
          'review_started',
          '2024-01-15',
          'user2',
          'react-basics',
          '2024-01-15T12:00:00Z'
        ),
      ];

      const result = calculateLessonMetrics(events, { originFilter: 'review_started' });
      expect(result.get('react-basics')?.originCount).toBe(2);
      expect(result.get('react-basics')?.followUpCount).toBe(1);
    });
  });

  describe('buildLessonRanking sort determinism', () => {
    /**
     * [spec-lock] P3-2.4: Best: rate desc → originCount desc → slug asc
     */
    it('[spec-lock] Best: rate desc → originCount desc → slug asc', () => {
      const events = [
        // All three lessons have same rate (100%) and same originCount (1)
        // Should be sorted by slug asc
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),

        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T12:00:00Z'
        ),
        createEvent(
          'quiz_started',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T13:00:00Z'
        ),

        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T14:00:00Z'
        ),
        createEvent('quiz_started', '2024-01-15', 'user1', 'useState-hook', '2024-01-15T15:00:00Z'),
      ];

      const result = buildLessonRanking(events, testLessons);

      // All 100%, 1 origin - sorted by slug asc
      expect(result.best[0].slug).toBe('react-basics'); // r < u
      expect(result.best[1].slug).toBe('useEffect-hook'); // useE < useS
      expect(result.best[2].slug).toBe('useState-hook');
    });

    /**
     * [spec-lock] P3-2.4: Worst: rate asc → originCount asc → slug asc
     */
    it('[spec-lock] Worst: rate asc → originCount asc → slug asc', () => {
      const events = [
        // All three lessons have same rate (0%) and same originCount (1)
        // Should be sorted by slug asc
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T12:00:00Z'
        ),
        createEvent(
          'lesson_viewed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T14:00:00Z'
        ),
      ];

      const result = buildLessonRanking(events, testLessons);

      // All 0%, 1 origin - sorted by slug asc
      expect(result.worst[0].slug).toBe('react-basics');
      expect(result.worst[1].slug).toBe('useEffect-hook');
      expect(result.worst[2].slug).toBe('useState-hook');
    });

    /**
     * [spec-lock] P3-2.4: originCount < 5 のとき lowSample=true
     * (Already tested above but explicit spec-lock marker)
     */
    it('[spec-lock] originCount < 5 のとき lowSample=true', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user3', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user4', 'react-basics', '2024-01-15T10:00:00Z'),
        // 4 origins - below default minSample of 5
      ];

      const result = buildLessonRanking(events, testLessons);
      expect(result.best[0].originCount).toBe(4);
      expect(result.best[0].isLowSample).toBe(true);

      // With 5 origins - at threshold
      const events5 = [
        ...events,
        createEvent('lesson_viewed', '2024-01-15', 'user5', 'react-basics', '2024-01-15T10:00:00Z'),
      ];
      const result5 = buildLessonRanking(events5, testLessons);
      expect(result5.best[0].originCount).toBe(5);
      expect(result5.best[0].isLowSample).toBe(false);
    });
  });

  describe('buildLessonRankingByOrigin', () => {
    /**
     * [spec-lock] P3-2.4: Returns ranking for each origin type
     */
    it('returns ranking for each origin type', () => {
      const events = [
        // lesson_viewed events
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),

        // lesson_completed events
        createEvent(
          'lesson_completed',
          '2024-01-15',
          'user1',
          'useState-hook',
          '2024-01-15T12:00:00Z'
        ),
        createEvent('quiz_started', '2024-01-15', 'user1', 'useState-hook', '2024-01-15T13:00:00Z'),

        // review_started events
        createEvent(
          'review_started',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T14:00:00Z'
        ),
        createEvent(
          'quiz_started',
          '2024-01-15',
          'user1',
          'useEffect-hook',
          '2024-01-15T15:00:00Z'
        ),
      ];

      const result = buildLessonRankingByOrigin(events, testLessons);

      // Check all three origin types are present
      expect(result.lesson_viewed).toBeDefined();
      expect(result.lesson_completed).toBeDefined();
      expect(result.review_started).toBeDefined();

      // lesson_viewed: only react-basics counted
      expect(result.lesson_viewed.best.length).toBe(1);
      expect(result.lesson_viewed.best[0].slug).toBe('react-basics');
      expect(result.lesson_viewed.best[0].originCount).toBe(1);

      // lesson_completed: only useState-hook counted
      expect(result.lesson_completed.best.length).toBe(1);
      expect(result.lesson_completed.best[0].slug).toBe('useState-hook');
      expect(result.lesson_completed.best[0].originCount).toBe(1);

      // review_started: only useEffect-hook counted
      expect(result.review_started.best.length).toBe(1);
      expect(result.review_started.best[0].slug).toBe('useEffect-hook');
      expect(result.review_started.best[0].originCount).toBe(1);
    });

    it('each origin ranking is computed independently', () => {
      const events = [
        // react-basics: viewed twice
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'react-basics', '2024-01-15T11:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'react-basics', '2024-01-15T10:00:00Z'),
        // user2 no follow-up

        // react-basics: completed once
        createEvent(
          'lesson_completed',
          '2024-01-15',
          'user1',
          'react-basics',
          '2024-01-15T12:00:00Z'
        ),
        createEvent('note_created', '2024-01-15', 'user1', 'react-basics', '2024-01-15T13:00:00Z'),
      ];

      const result = buildLessonRankingByOrigin(events, testLessons);

      // lesson_viewed: 2 origins, 1 follow-up = 50%
      expect(result.lesson_viewed.best[0].originCount).toBe(2);
      expect(result.lesson_viewed.best[0].followUpRate).toBe(50);

      // lesson_completed: 1 origin, 1 follow-up = 100%
      expect(result.lesson_completed.best[0].originCount).toBe(1);
      expect(result.lesson_completed.best[0].followUpRate).toBe(100);
    });

    it('passes options through to each ranking', () => {
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
      ];

      const result = buildLessonRankingByOrigin(events, testLessons, { limit: 2 });

      expect(result.lesson_viewed.best.length).toBe(2);
      expect(result.lesson_viewed.worst.length).toBe(2);
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
