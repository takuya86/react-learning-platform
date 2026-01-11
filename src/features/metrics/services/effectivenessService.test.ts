/**
 * effectivenessService Tests
 *
 * [spec-lock] Learning Effectiveness Metrics
 */

import { describe, it, expect } from 'vitest';
import type { LearningEvent } from './metricsService';
import {
  isOriginEvent,
  isFollowUpEvent,
  calculateFollowUpRate,
  calculateCompletionRate,
  countFollowUpActions,
  getTopFollowUpAction,
  buildEffectivenessSummary,
} from './effectivenessService';

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

describe('effectivenessService', () => {
  // ============================================================
  // isOriginEvent / isFollowUpEvent
  // ============================================================

  describe('isOriginEvent', () => {
    /**
     * [spec-lock] Origin events are lesson_viewed and lesson_completed
     */
    it('returns true for lesson_viewed', () => {
      expect(isOriginEvent('lesson_viewed')).toBe(true);
    });

    it('returns true for lesson_completed', () => {
      expect(isOriginEvent('lesson_completed')).toBe(true);
    });

    it('returns false for non-origin events', () => {
      expect(isOriginEvent('quiz_started')).toBe(false);
      expect(isOriginEvent('review_started')).toBe(false);
      expect(isOriginEvent('note_created')).toBe(false);
    });
  });

  describe('isFollowUpEvent', () => {
    /**
     * [spec-lock] Follow-up events are: next_lesson_opened, review_started, quiz_started, note_created
     */
    it('returns true for follow-up event types', () => {
      expect(isFollowUpEvent('next_lesson_opened')).toBe(true);
      expect(isFollowUpEvent('review_started')).toBe(true);
      expect(isFollowUpEvent('quiz_started')).toBe(true);
      expect(isFollowUpEvent('note_created')).toBe(true);
    });

    it('returns false for non-follow-up events', () => {
      expect(isFollowUpEvent('lesson_viewed')).toBe(false);
      expect(isFollowUpEvent('lesson_completed')).toBe(false);
      expect(isFollowUpEvent('quiz_completed')).toBe(false);
    });
  });

  // ============================================================
  // calculateFollowUpRate
  // ============================================================

  describe('calculateFollowUpRate', () => {
    /**
     * [spec-lock] DB冪等性により同一日・同一レッスンのoriginは1件のみ
     * 再訪してもoriginCountは増えない（DBがupsertで吸収）
     *
     * 注意: このテストはDB層の挙動を前提。DB UNIQUE制約:
     * (user_id, event_type, reference_id, event_date)
     */
    it('counts origin events from deduplicated DB records', () => {
      // DBから取得される時点で既に重複排除されている前提
      // 同一日・同一レッスンのlesson_viewedは1件
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        // DBレベルで弾かれるので、再訪イベントは存在しない
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T11:00:00Z'),
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.originCount).toBe(1);
      expect(result.followedUpCount).toBe(1);
    });

    /**
     * [spec-lock] 24h窓の計算はcreated_at（timestamp）ベース
     * created_atがない場合はevent_date 00:00:00 UTCにフォールバック
     */
    it('uses created_at timestamp for precise 24h window calculation', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T23:00:00Z'),
        // 22時間後（24h以内）
        createEvent('review_started', '2024-01-16', 'user1', 'lesson1', '2024-01-16T21:00:00Z'),
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.followedUpCount).toBe(1);
    });

    it('falls back to event_date midnight when created_at is missing', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1'), // no created_at
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1'), // no created_at
      ];
      // Both fall back to 00:00:00 UTC, so they're at the same time
      // follow-up must be AFTER origin, not at same time
      const result = calculateFollowUpRate({ events });
      expect(result.followedUpCount).toBe(0);
    });

    /**
     * [spec-lock] Follow-up rate counts origin events with follow-up within 24 hours
     */
    it('returns 0 for no events', () => {
      const result = calculateFollowUpRate({ events: [] });
      expect(result).toEqual({
        originCount: 0,
        followedUpCount: 0,
        rate: 0,
      });
    });

    it('returns 0 for only origin events with no follow-up', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
      ];
      const result = calculateFollowUpRate({ events });
      expect(result).toEqual({
        originCount: 1,
        followedUpCount: 0,
        rate: 0,
      });
    });

    it('returns 100% when all origins have follow-ups within window', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T11:00:00Z'),
      ];
      const result = calculateFollowUpRate({ events });
      expect(result).toEqual({
        originCount: 1,
        followedUpCount: 1,
        rate: 100,
      });
    });

    /**
     * [spec-lock] Follow-up must occur AFTER origin event (not at same time)
     */
    it('does not count follow-up at exact same time as origin', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.followedUpCount).toBe(0);
    });

    /**
     * [spec-lock] Follow-up window is 24 hours
     */
    it('does not count follow-up outside 24h window', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-16', 'user1', 'lesson1', '2024-01-16T12:00:00Z'), // 26h later
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.followedUpCount).toBe(0);
    });

    it('counts follow-up just within 24h window', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-16', 'user1', 'lesson1', '2024-01-16T09:59:59Z'), // Just under 24h
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.followedUpCount).toBe(1);
    });

    it('handles multiple origin events with partial follow-ups', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T11:00:00Z'),
        createEvent('lesson_completed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T12:00:00Z'),
        // No follow-up for lesson_completed
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.originCount).toBe(2); // lesson_viewed + lesson_completed
      expect(result.followedUpCount).toBe(1); // Only lesson_viewed had follow-up after it
      expect(result.rate).toBe(50);
    });

    it('handles multiple users independently', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T11:00:00Z'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'lesson1', '2024-01-15T10:00:00Z'),
        // user2 has no follow-up
      ];
      const result = calculateFollowUpRate({ events });
      expect(result.originCount).toBe(2);
      expect(result.followedUpCount).toBe(1);
      expect(result.rate).toBe(50);
    });

    it('allows custom window hours', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T13:00:00Z'), // 3h later
      ];
      // 2h window - should not count
      const result2h = calculateFollowUpRate({ events, windowHours: 2 });
      expect(result2h.followedUpCount).toBe(0);

      // 4h window - should count
      const result4h = calculateFollowUpRate({ events, windowHours: 4 });
      expect(result4h.followedUpCount).toBe(1);
    });
  });

  // ============================================================
  // calculateCompletionRate
  // ============================================================

  describe('calculateCompletionRate', () => {
    /**
     * [spec-lock] Completion rate = completed / viewed * 100
     */
    it('returns 0 for no events', () => {
      const result = calculateCompletionRate([]);
      expect(result).toEqual({
        viewedCount: 0,
        completedCount: 0,
        rate: 0,
      });
    });

    it('returns 0 for only viewed lessons', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson2'),
      ];
      const result = calculateCompletionRate(events);
      expect(result.viewedCount).toBe(2);
      expect(result.completedCount).toBe(0);
      expect(result.rate).toBe(0);
    });

    it('returns 100% when all viewed lessons are completed', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_completed', '2024-01-15', 'user1', 'lesson1'),
      ];
      const result = calculateCompletionRate(events);
      expect(result.viewedCount).toBe(1);
      expect(result.completedCount).toBe(1);
      expect(result.rate).toBe(100);
    });

    it('calculates partial completion rate', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_completed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson2'),
        // lesson2 not completed
      ];
      const result = calculateCompletionRate(events);
      expect(result.viewedCount).toBe(2);
      expect(result.completedCount).toBe(1);
      expect(result.rate).toBe(50);
    });

    /**
     * [spec-lock] Counts unique lessons per user
     */
    it('counts unique lessons per user (not duplicate views)', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_viewed', '2024-01-16', 'user1', 'lesson1'), // Same lesson, different day
        createEvent('lesson_completed', '2024-01-16', 'user1', 'lesson1'),
      ];
      const result = calculateCompletionRate(events);
      expect(result.viewedCount).toBe(1); // Unique lesson
      expect(result.completedCount).toBe(1);
      expect(result.rate).toBe(100);
    });

    it('handles multiple users', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_completed', '2024-01-15', 'user1', 'lesson1'),
        createEvent('lesson_viewed', '2024-01-15', 'user2', 'lesson1'),
        // user2 did not complete
      ];
      const result = calculateCompletionRate(events);
      expect(result.viewedCount).toBe(2); // 1 per user
      expect(result.completedCount).toBe(1);
      expect(result.rate).toBe(50);
    });
  });

  // ============================================================
  // countFollowUpActions / getTopFollowUpAction
  // ============================================================

  describe('countFollowUpActions', () => {
    it('returns empty map for no events', () => {
      const result = countFollowUpActions([]);
      expect(result.size).toBe(0);
    });

    it('counts only follow-up event types', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15'),
        createEvent('review_started', '2024-01-15'),
        createEvent('quiz_started', '2024-01-15'),
        createEvent('review_started', '2024-01-15'),
      ];
      const result = countFollowUpActions(events);
      expect(result.get('review_started')).toBe(2);
      expect(result.get('quiz_started')).toBe(1);
      expect(result.has('lesson_viewed')).toBe(false);
    });
  });

  describe('getTopFollowUpAction', () => {
    it('returns null for no events', () => {
      const result = getTopFollowUpAction([]);
      expect(result).toEqual({ type: null, count: 0 });
    });

    it('returns the most common follow-up action', () => {
      const events = [
        createEvent('review_started', '2024-01-15'),
        createEvent('quiz_started', '2024-01-15'),
        createEvent('review_started', '2024-01-15'),
        createEvent('review_started', '2024-01-15'),
      ];
      const result = getTopFollowUpAction(events);
      expect(result.type).toBe('review_started');
      expect(result.count).toBe(3);
    });
  });

  // ============================================================
  // buildEffectivenessSummary
  // ============================================================

  describe('buildEffectivenessSummary', () => {
    it('builds complete summary from events', () => {
      const events = [
        createEvent('lesson_viewed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T10:00:00Z'),
        createEvent('review_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T11:00:00Z'),
        createEvent('lesson_completed', '2024-01-15', 'user1', 'lesson1', '2024-01-15T12:00:00Z'),
        createEvent('quiz_started', '2024-01-15', 'user1', 'lesson1', '2024-01-15T13:00:00Z'),
      ];

      const result = buildEffectivenessSummary(events);

      expect(result.followUpRate.originCount).toBe(2);
      expect(result.completionRate.viewedCount).toBe(1);
      expect(result.completionRate.completedCount).toBe(1);
      expect(result.topFollowUpAction.type).toBeDefined();
    });

    it('handles empty events', () => {
      const result = buildEffectivenessSummary([]);

      expect(result.followUpRate.rate).toBe(0);
      expect(result.completionRate.rate).toBe(0);
      expect(result.topFollowUpAction.type).toBeNull();
    });
  });
});
