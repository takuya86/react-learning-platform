import { describe, it, expect } from 'vitest';
import {
  buildRoiSnapshot,
  calculateImprovementRoi,
  getRoiStatus,
  buildRoiComment,
  type RoiSnapshot,
  type RoiMeta,
  type SnapshotInput,
} from './improvementRoiService';
import type { LearningEvent } from './metricsService';

describe('improvementRoiService', () => {
  describe('buildRoiSnapshot', () => {
    it('should calculate snapshot with follow-up and completion rates', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'user1',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          user_id: 'user1',
          event_type: 'quiz_started',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:30:00Z', // 30 min after (within 24h)
        },
        {
          user_id: 'user1',
          event_type: 'lesson_completed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T11:00:00Z',
        },
      ];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(1);
      expect(snapshot.followUpCount).toBe(1);
      expect(snapshot.followUpRate).toBe(1.0); // 100%
      expect(snapshot.completionCount).toBe(1);
      expect(snapshot.completionRate).toBe(1.0); // 100%
    });

    it('should handle multiple users correctly', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'user1',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          user_id: 'user1',
          event_type: 'quiz_started',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:30:00Z',
        },
        {
          user_id: 'user2',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T11:00:00Z',
        },
        // user2 has no follow-up
      ];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(2); // 2 users viewed
      expect(snapshot.followUpCount).toBe(1); // only user1 followed up
      expect(snapshot.followUpRate).toBe(0.5); // 50%
      expect(snapshot.completionCount).toBe(0);
      expect(snapshot.completionRate).toBe(0);
    });

    it('should only count events within the time window', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'user1',
          event_type: 'lesson_viewed',
          event_date: '2024-12-31',
          reference_id: 'react-basics',
          created_at: '2024-12-31T23:00:00Z', // Before window
        },
        {
          user_id: 'user2',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:00:00Z', // Within window
        },
        {
          user_id: 'user3',
          event_type: 'lesson_viewed',
          event_date: '2025-01-02',
          reference_id: 'react-basics',
          created_at: '2025-01-02T00:00:00Z', // At boundary (excluded)
        },
      ];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(1); // Only user2
    });

    it('should only count events for the specified lesson', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'user1',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          user_id: 'user2',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'vue-basics',
          created_at: '2025-01-01T11:00:00Z',
        },
      ];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(1); // Only react-basics
    });

    it('should respect 24-hour follow-up window', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'user1',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          user_id: 'user1',
          event_type: 'quiz_started',
          event_date: '2025-01-02',
          reference_id: 'react-basics',
          created_at: '2025-01-02T09:59:00Z', // 23h 59m later (within 24h)
        },
        {
          user_id: 'user2',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T11:00:00Z',
        },
        {
          user_id: 'user2',
          event_type: 'quiz_started',
          event_date: '2025-01-02',
          reference_id: 'react-basics',
          created_at: '2025-01-02T11:01:00Z', // 24h 1m later (outside 24h)
        },
      ];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-03T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(2);
      expect(snapshot.followUpCount).toBe(1); // Only user1
      expect(snapshot.followUpRate).toBe(0.5);
    });

    it('should return zeros for empty dataset (prevent NaN)', () => {
      const events: LearningEvent[] = [];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(0);
      expect(snapshot.followUpCount).toBe(0);
      expect(snapshot.followUpRate).toBe(0); // Not NaN
      expect(snapshot.completionCount).toBe(0);
      expect(snapshot.completionRate).toBe(0); // Not NaN
    });

    it('should calculate completion rate correctly', () => {
      const events: LearningEvent[] = [
        {
          user_id: 'user1',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          user_id: 'user1',
          event_type: 'lesson_completed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T11:00:00Z',
        },
        {
          user_id: 'user2',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T12:00:00Z',
        },
        {
          user_id: 'user3',
          event_type: 'lesson_viewed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T13:00:00Z',
        },
        {
          user_id: 'user3',
          event_type: 'lesson_completed',
          event_date: '2025-01-01',
          reference_id: 'react-basics',
          created_at: '2025-01-01T14:00:00Z',
        },
      ];

      const input: SnapshotInput = {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-02T00:00:00Z',
        lessonSlug: 'react-basics',
      };

      const snapshot = buildRoiSnapshot(events, input);

      expect(snapshot.originCount).toBe(3); // 3 views
      expect(snapshot.completionCount).toBe(2); // 2 completions
      expect(snapshot.completionRate).toBeCloseTo(0.667, 2); // 2/3 ≈ 0.667
    });
  });

  describe('getRoiStatus', () => {
    it('should return INSUFFICIENT_DATA when before originCount < 5', () => {
      const status = getRoiStatus(0.1, 4, 10);
      expect(status).toBe('INSUFFICIENT_DATA');
    });

    it('should return INSUFFICIENT_DATA when after originCount < 5', () => {
      const status = getRoiStatus(0.1, 10, 4);
      expect(status).toBe('INSUFFICIENT_DATA');
    });

    it('should return INSUFFICIENT_DATA when both < 5', () => {
      const status = getRoiStatus(0.1, 3, 4);
      expect(status).toBe('INSUFFICIENT_DATA');
    });

    it('should return IMPROVED when deltaRate >= 0.05', () => {
      const status = getRoiStatus(0.05, 10, 10);
      expect(status).toBe('IMPROVED');
    });

    it('should return IMPROVED when deltaRate > 0.05', () => {
      const status = getRoiStatus(0.15, 5, 5);
      expect(status).toBe('IMPROVED');
    });

    it('should return REGRESSED when deltaRate <= -0.05', () => {
      const status = getRoiStatus(-0.05, 10, 10);
      expect(status).toBe('REGRESSED');
    });

    it('should return REGRESSED when deltaRate < -0.05', () => {
      const status = getRoiStatus(-0.15, 5, 5);
      expect(status).toBe('REGRESSED');
    });

    it('should return NO_CHANGE when deltaRate is within threshold', () => {
      const status = getRoiStatus(0.03, 10, 10);
      expect(status).toBe('NO_CHANGE');
    });

    it('should return NO_CHANGE when deltaRate is negative but within threshold', () => {
      const status = getRoiStatus(-0.03, 10, 10);
      expect(status).toBe('NO_CHANGE');
    });

    it('should return NO_CHANGE when deltaRate is exactly 0', () => {
      const status = getRoiStatus(0, 10, 10);
      expect(status).toBe('NO_CHANGE');
    });

    it('should prioritize INSUFFICIENT_DATA over other statuses', () => {
      // Even with huge improvement, insufficient data takes precedence
      const status = getRoiStatus(0.5, 3, 5);
      expect(status).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('calculateImprovementRoi', () => {
    it('should calculate ROI with IMPROVED status', () => {
      const before: RoiSnapshot = {
        originCount: 10,
        followUpCount: 5,
        followUpRate: 0.5,
        completionCount: 7,
        completionRate: 0.7,
      };

      const after: RoiSnapshot = {
        originCount: 10,
        followUpCount: 8,
        followUpRate: 0.8,
        completionCount: 9,
        completionRate: 0.9,
      };

      const meta: RoiMeta = {
        issueNumber: 123,
        issueTitle: 'Improve React Basics lesson',
        lessonSlug: 'react-basics',
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const roi = calculateImprovementRoi(before, after, meta);

      expect(roi.status).toBe('IMPROVED');
      expect(roi.deltaFollowUpRate).toBeCloseTo(0.3, 2); // 0.8 - 0.5
      expect(roi.deltaCompletionRate).toBeCloseTo(0.2, 2); // 0.9 - 0.7
      expect(roi.windowDays).toBe(7);
      expect(roi.lessonSlug).toBe('react-basics');
      expect(roi.issueNumber).toBe(123);
      expect(roi.issueTitle).toBe('Improve React Basics lesson');
      expect(roi.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(roi.closedAt).toBe('2025-01-15T00:00:00Z');
    });

    it('should calculate ROI with REGRESSED status', () => {
      const before: RoiSnapshot = {
        originCount: 10,
        followUpCount: 8,
        followUpRate: 0.8,
        completionCount: 9,
        completionRate: 0.9,
      };

      const after: RoiSnapshot = {
        originCount: 10,
        followUpCount: 5,
        followUpRate: 0.5,
        completionCount: 6,
        completionRate: 0.6,
      };

      const meta: RoiMeta = {
        issueNumber: 124,
        issueTitle: 'Bad improvement',
        lessonSlug: 'react-basics',
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const roi = calculateImprovementRoi(before, after, meta);

      expect(roi.status).toBe('REGRESSED');
      expect(roi.deltaFollowUpRate).toBeCloseTo(-0.3, 2); // 0.5 - 0.8
      expect(roi.deltaCompletionRate).toBeCloseTo(-0.3, 2); // 0.6 - 0.9
    });

    it('should calculate ROI with NO_CHANGE status', () => {
      const before: RoiSnapshot = {
        originCount: 10,
        followUpCount: 5,
        followUpRate: 0.5,
        completionCount: 7,
        completionRate: 0.7,
      };

      const after: RoiSnapshot = {
        originCount: 10,
        followUpCount: 5,
        followUpRate: 0.52,
        completionCount: 7,
        completionRate: 0.72,
      };

      const meta: RoiMeta = {
        issueNumber: 125,
        issueTitle: 'Minor change',
        lessonSlug: 'react-basics',
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const roi = calculateImprovementRoi(before, after, meta);

      expect(roi.status).toBe('NO_CHANGE');
      expect(roi.deltaFollowUpRate).toBeCloseTo(0.02, 2);
    });

    it('should calculate ROI with INSUFFICIENT_DATA status', () => {
      const before: RoiSnapshot = {
        originCount: 3, // < 5
        followUpCount: 2,
        followUpRate: 0.67,
        completionCount: 2,
        completionRate: 0.67,
      };

      const after: RoiSnapshot = {
        originCount: 10,
        followUpCount: 9,
        followUpRate: 0.9,
        completionCount: 8,
        completionRate: 0.8,
      };

      const meta: RoiMeta = {
        issueNumber: 126,
        issueTitle: 'Low sample',
        lessonSlug: 'react-basics',
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const roi = calculateImprovementRoi(before, after, meta);

      expect(roi.status).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('buildRoiComment', () => {
    it('should build comment for IMPROVED status', () => {
      const roi = {
        lessonSlug: 'react-basics',
        issueNumber: 123,
        issueTitle: 'Improve React Basics lesson',
        status: 'IMPROVED' as const,
        before: {
          originCount: 10,
          followUpCount: 5,
          followUpRate: 0.5,
          completionCount: 7,
          completionRate: 0.7,
        },
        after: {
          originCount: 12,
          followUpCount: 10,
          followUpRate: 0.83,
          completionCount: 11,
          completionRate: 0.92,
        },
        deltaFollowUpRate: 0.33,
        deltaCompletionRate: 0.22,
        windowDays: 7,
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const comment = buildRoiComment(roi);

      expect(comment).toContain('✅ Improvement ROI Report');
      expect(comment).toContain('Issue:** #123 - Improve React Basics lesson');
      expect(comment).toContain('Lesson:** `react-basics`');
      expect(comment).toContain('Status: IMPROVED');
      expect(comment).toContain('+33pp');
      expect(comment).toContain('Great work!');
      expect(comment).toContain('| Lesson Views | 10 | 12 | +2 |');
      expect(comment).toContain('| Follow-up Rate | 50% | 83% | +33pp |');
      expect(comment).toContain('| Completion Rate | 70% | 92% | +22pp |');
    });

    it('should build comment for REGRESSED status', () => {
      const roi = {
        lessonSlug: 'react-basics',
        issueNumber: 124,
        issueTitle: 'Bad improvement',
        status: 'REGRESSED' as const,
        before: {
          originCount: 10,
          followUpCount: 8,
          followUpRate: 0.8,
          completionCount: 9,
          completionRate: 0.9,
        },
        after: {
          originCount: 10,
          followUpCount: 5,
          followUpRate: 0.5,
          completionCount: 6,
          completionRate: 0.6,
        },
        deltaFollowUpRate: -0.3,
        deltaCompletionRate: -0.3,
        windowDays: 7,
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const comment = buildRoiComment(roi);

      expect(comment).toContain('⚠️ Improvement ROI Report');
      expect(comment).toContain('Status: REGRESSED');
      expect(comment).toContain('-30pp');
      expect(comment).toContain('negative effect');
      expect(comment).toContain('Consider reverting');
    });

    it('should build comment for NO_CHANGE status', () => {
      const roi = {
        lessonSlug: 'react-basics',
        issueNumber: 125,
        issueTitle: 'Minor change',
        status: 'NO_CHANGE' as const,
        before: {
          originCount: 10,
          followUpCount: 5,
          followUpRate: 0.5,
          completionCount: 7,
          completionRate: 0.7,
        },
        after: {
          originCount: 10,
          followUpCount: 5,
          followUpRate: 0.52,
          completionCount: 7,
          completionRate: 0.72,
        },
        deltaFollowUpRate: 0.02,
        deltaCompletionRate: 0.02,
        windowDays: 7,
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const comment = buildRoiComment(roi);

      expect(comment).toContain('ℹ️ Improvement ROI Report');
      expect(comment).toContain('Status: NO_CHANGE');
      expect(comment).toContain('+2pp');
      expect(comment).toContain('no significant change');
      expect(comment).toContain('within ±5pp threshold');
    });

    it('should build comment for INSUFFICIENT_DATA status', () => {
      const roi = {
        lessonSlug: 'react-basics',
        issueNumber: 126,
        issueTitle: 'Low sample',
        status: 'INSUFFICIENT_DATA' as const,
        before: {
          originCount: 3,
          followUpCount: 2,
          followUpRate: 0.67,
          completionCount: 2,
          completionRate: 0.67,
        },
        after: {
          originCount: 10,
          followUpCount: 9,
          followUpRate: 0.9,
          completionCount: 8,
          completionRate: 0.8,
        },
        deltaFollowUpRate: 0.23,
        deltaCompletionRate: 0.13,
        windowDays: 7,
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const comment = buildRoiComment(roi);

      expect(comment).toContain('📊 Improvement ROI Report');
      expect(comment).toContain('Status: INSUFFICIENT_DATA');
      expect(comment).toContain('Sample size is too small');
      expect(comment).toContain('Before: 3 views');
      expect(comment).toContain('After: 10 views');
      expect(comment).toContain('Wait for more data');
    });

    it('should format negative deltas correctly', () => {
      const roi = {
        lessonSlug: 'react-basics',
        issueNumber: 127,
        issueTitle: 'Test',
        status: 'NO_CHANGE' as const,
        before: {
          originCount: 12,
          followUpCount: 6,
          followUpRate: 0.5,
          completionCount: 8,
          completionRate: 0.67,
        },
        after: {
          originCount: 10,
          followUpCount: 5,
          followUpRate: 0.5,
          completionCount: 7,
          completionRate: 0.7,
        },
        deltaFollowUpRate: 0,
        deltaCompletionRate: 0.03,
        windowDays: 7,
        createdAt: '2025-01-01T00:00:00Z',
        closedAt: '2025-01-15T00:00:00Z',
      };

      const comment = buildRoiComment(roi);

      expect(comment).toContain('| Lesson Views | 12 | 10 | -2 |');
      expect(comment).toContain('| Follow-up Count | 6 | 5 | -1 |');
      expect(comment).toContain('| Completion Count | 8 | 7 | -1 |');
    });
  });
});
