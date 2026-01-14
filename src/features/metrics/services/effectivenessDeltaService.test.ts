/**
 * effectivenessDeltaService Tests
 *
 * [spec-lock] Lesson Effectiveness Snapshot & Delta Calculation
 */

import { describe, it, expect } from 'vitest';
import type { LearningEvent } from './metricsService';
import {
  buildLessonEffectivenessSnapshot,
  buildLessonEffectivenessDelta,
  parseIssueBaseline,
  MIN_SAMPLE_SIZE,
  type LessonEffectivenessSnapshot,
} from './effectivenessDeltaService';

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

describe('effectivenessDeltaService', () => {
  // ============================================================
  // buildLessonEffectivenessSnapshot
  // ============================================================

  describe('buildLessonEffectivenessSnapshot', () => {
    it('returns empty array for no events', () => {
      const result = buildLessonEffectivenessSnapshot([], '2024-01-20T00:00:00Z', 30);
      expect(result).toEqual([]);
    });

    /**
     * [spec-lock] Window boundary is UTC-based
     * nowUtc = 2024-01-20T00:00:00Z, windowDays = 7
     * Window = [2024-01-13T00:00:00Z, 2024-01-20T00:00:00Z)
     */
    it('filters events by window boundary (UTC)', () => {
      const events = [
        // Before window - should be excluded
        createEvent('lesson_viewed', '2024-01-12', 'user1', 'react-basics', '2024-01-12T23:59:00Z'),
        // Within window - should be included
        createEvent('lesson_viewed', '2024-01-13', 'user1', 'react-basics', '2024-01-13T00:00:00Z'),
        createEvent('lesson_viewed', '2024-01-19', 'user2', 'react-basics', '2024-01-19T23:59:00Z'),
        // At nowUtc - should be excluded (< nowUtc, not <=)
        createEvent('lesson_viewed', '2024-01-20', 'user3', 'react-basics', '2024-01-20T00:00:00Z'),
      ];

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 7);

      // Only 2 events within window
      expect(result.length).toBe(1);
      expect(result[0].lessonSlug).toBe('react-basics');
      expect(result[0].originCount).toBe(2);
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

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);

      const reactBasics = result.find((s) => s.lessonSlug === 'react-basics');
      const useState = result.find((s) => s.lessonSlug === 'useState-hook');

      expect(reactBasics?.originCount).toBe(2);
      expect(useState?.originCount).toBe(1);
    });

    /**
     * [spec-lock] Follow-up window is 24 hours from origin
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

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);

      expect(result[0].originCount).toBe(1);
      expect(result[0].followUpRate).toBe(100);
    });

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

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);

      expect(result[0].originCount).toBe(1);
      expect(result[0].followUpRate).toBe(0);
    });

    /**
     * [spec-lock] Multiple follow-ups count as 1 per origin
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

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);

      expect(result[0].originCount).toBe(1);
      expect(result[0].followUpRate).toBe(100);
      // followUpCounts should track all 3 types
      expect(result[0].followUpCounts).toEqual({
        review_started: 1,
        quiz_started: 1,
        note_created: 1,
      });
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

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);

      expect(result[0].originCount).toBe(2);
      expect(result[0].followUpRate).toBe(50); // 1/2 = 50%
    });

    it('ignores events without reference_id', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', '', '2024-01-15T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user1', undefined, '2024-01-15T11:00:00Z'),
      ];

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);
      expect(result).toEqual([]);
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
        createEvent('lesson_viewed', '2024-01-15', 'user3', 'react-basics', '2024-01-15T10:00:00Z'),
        // Only user1 has follow-up
      ];

      const result = buildLessonEffectivenessSnapshot(events, '2024-01-20T00:00:00Z', 30);

      expect(result[0].followUpRate).toBe(33); // 1/3 = 33.33% -> 33
    });

    it('includes snapshotAt timestamp', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'react-basics', '2024-01-15T10:00:00Z'),
      ];

      const nowUtc = '2024-01-20T12:34:56Z';
      const result = buildLessonEffectivenessSnapshot(events, nowUtc, 30);

      expect(result[0].snapshotAt).toBe(nowUtc);
    });

    it('handles different window sizes', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-01', 'user1', 'react-basics', '2024-01-01T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-10', 'user2', 'react-basics', '2024-01-10T10:00:00Z'),
        createEvent('lesson_viewed', '2024-01-19', 'user3', 'react-basics', '2024-01-19T10:00:00Z'),
      ];

      const nowUtc = '2024-01-20T00:00:00Z';

      // 7-day window: only last event
      const result7 = buildLessonEffectivenessSnapshot(events, nowUtc, 7);
      expect(result7[0].originCount).toBe(1);

      // 30-day window: all events
      const result30 = buildLessonEffectivenessSnapshot(events, nowUtc, 30);
      expect(result30[0].originCount).toBe(3);
    });
  });

  // ============================================================
  // buildLessonEffectivenessDelta
  // ============================================================

  describe('buildLessonEffectivenessDelta', () => {
    /**
     * [spec-lock] deltaRate = afterRate - beforeRate
     */
    it('calculates delta correctly', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 30,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 12,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result).toEqual({
        lessonSlug: 'react-basics',
        beforeRate: 30,
        afterRate: 50,
        deltaRate: 20,
        beforeOriginCount: 10,
        afterOriginCount: 12,
        isLowSample: false,
      });
    });

    it('handles negative delta', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 60,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 40,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result?.deltaRate).toBe(-20);
    });

    /**
     * [spec-lock] isLowSample = true when originCount < 5
     */
    it('marks low sample when before originCount < 5', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 4,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 60,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result?.isLowSample).toBe(true);
    });

    it('marks low sample when after originCount < 5', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 4,
        followUpRate: 60,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result?.isLowSample).toBe(true);
    });

    it('does not mark low sample when both >= 5', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 5,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 5,
        followUpRate: 60,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result?.isLowSample).toBe(false);
    });

    it('returns null when lessonSlug does not match', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'useState-hook',
        originCount: 10,
        followUpRate: 60,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result).toBeNull();
    });

    it('handles zero delta', () => {
      const before: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-01-01T00:00:00Z',
      };

      const after: LessonEffectivenessSnapshot = {
        lessonSlug: 'react-basics',
        originCount: 10,
        followUpRate: 50,
        followUpCounts: {},
        snapshotAt: '2024-02-01T00:00:00Z',
      };

      const result = buildLessonEffectivenessDelta(before, after);

      expect(result?.deltaRate).toBe(0);
    });
  });

  // ============================================================
  // parseIssueBaseline
  // ============================================================

  describe('parseIssueBaseline', () => {
    it('parses valid front-matter', () => {
      const issueBody = `---
lessonSlug: react-basics
hintType: add-interactive-example
baselineWindowDays: 30
baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
originCount: 42
followUpRate: 35
---

## Summary
This is the issue body.
`;

      const result = parseIssueBaseline(issueBody);

      expect(result).toEqual({
        lessonSlug: 'react-basics',
        hintType: 'add-interactive-example',
        baselineWindowDays: 30,
        baselineSnapshotAtUtc: '2024-01-15T00:00:00Z',
        originCount: 42,
        followUpRate: 35,
      });
    });

    it('returns null for missing front-matter', () => {
      const issueBody = `## Summary
No front-matter here.
`;

      const result = parseIssueBaseline(issueBody);

      expect(result).toBeNull();
    });

    it('returns null for incomplete front-matter', () => {
      const issueBody = `---
lessonSlug: react-basics
hintType: add-interactive-example
---

## Summary
Missing required fields.
`;

      const result = parseIssueBaseline(issueBody);

      expect(result).toBeNull();
    });

    it('returns null for invalid number fields', () => {
      const issueBody = `---
lessonSlug: react-basics
hintType: add-interactive-example
baselineWindowDays: not-a-number
baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
originCount: 42
followUpRate: 35
---
`;

      const result = parseIssueBaseline(issueBody);

      expect(result).toBeNull();
    });

    it('handles front-matter with extra whitespace', () => {
      const issueBody = `---
lessonSlug:   react-basics
hintType: add-interactive-example
baselineWindowDays: 30
baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
originCount: 42
followUpRate: 35
---
`;

      const result = parseIssueBaseline(issueBody);

      expect(result?.lessonSlug).toBe('react-basics');
    });

    it('handles values with colons', () => {
      const issueBody = `---
lessonSlug: react-basics
hintType: add-interactive-example
baselineWindowDays: 30
baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
originCount: 42
followUpRate: 35
---
`;

      const result = parseIssueBaseline(issueBody);

      expect(result?.baselineSnapshotAtUtc).toBe('2024-01-15T00:00:00Z');
    });

    it('ignores unknown fields', () => {
      const issueBody = `---
lessonSlug: react-basics
hintType: add-interactive-example
baselineWindowDays: 30
baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
originCount: 42
followUpRate: 35
unknownField: should be ignored
---
`;

      const result = parseIssueBaseline(issueBody);

      expect(result).toBeTruthy();
      expect(result?.lessonSlug).toBe('react-basics');
    });

    it('handles zero values', () => {
      const issueBody = `---
lessonSlug: react-basics
hintType: add-interactive-example
baselineWindowDays: 0
baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
originCount: 0
followUpRate: 0
---
`;

      const result = parseIssueBaseline(issueBody);

      expect(result?.baselineWindowDays).toBe(0);
      expect(result?.originCount).toBe(0);
      expect(result?.followUpRate).toBe(0);
    });
  });

  // ============================================================
  // MIN_SAMPLE_SIZE constant
  // ============================================================

  describe('MIN_SAMPLE_SIZE', () => {
    it('is 5', () => {
      expect(MIN_SAMPLE_SIZE).toBe(5);
    });
  });
});
