/**
 * Learning Effectiveness Service
 *
 * Pure functions for calculating learning effectiveness metrics.
 * Measures whether learning actions lead to follow-up engagement.
 *
 * ## 仕様（固定）
 *
 * ### Follow-up Rate
 * - 起点: lesson_viewed, lesson_completed, review_started
 * - follow-up: next_lesson_opened, review_started, quiz_started, note_created
 * - 24時間以内のfollow-upをカウント
 * - review_started は origin と follow-up の両方になりうる（P3-1拡張）
 *
 * ### Completion Rate
 * - lesson_viewed → lesson_completed の変換率
 */

import {
  FOLLOW_UP_WINDOW_HOURS,
  FOLLOW_UP_EVENT_TYPES,
  ORIGIN_EVENT_TYPES,
  type OriginEventType,
} from '../constants';
import type { LearningEvent, LearningEventType } from './metricsService';

/**
 * Follow-up analysis input
 */
export interface FollowUpInput {
  events: LearningEvent[];
  windowHours?: number;
}

/**
 * Follow-up rate result
 */
export interface FollowUpRate {
  /** Number of origin events (lesson_viewed/lesson_completed) */
  originCount: number;
  /** Number of origin events that had a follow-up within the window */
  followedUpCount: number;
  /** Follow-up rate as a percentage (0-100) */
  rate: number;
}

/**
 * Completion rate result
 */
export interface CompletionRate {
  /** Number of lesson_viewed events */
  viewedCount: number;
  /** Number of lesson_completed events */
  completedCount: number;
  /** Completion rate as a percentage (0-100) */
  rate: number;
}

/**
 * Effectiveness summary for admin display
 */
export interface EffectivenessSummary {
  followUpRate: FollowUpRate;
  completionRate: CompletionRate;
  /** Most common follow-up action */
  topFollowUpAction: {
    type: LearningEventType | null;
    count: number;
  };
}

/**
 * Origin-specific follow-up rate
 * @spec-lock P3-1: Origin別のfollow-up rateを計測
 */
export interface OriginFollowUpRate {
  originType: OriginEventType;
  originCount: number;
  followedUpCount: number;
  rate: number;
}

/**
 * Effectiveness breakdown by origin type
 * @spec-lock P3-1: lesson_viewed, lesson_completed, review_started それぞれの効果を分離
 */
export interface EffectivenessBreakdown {
  overall: FollowUpRate;
  byOrigin: OriginFollowUpRate[];
}

/**
 * Parse event timestamp to Date object
 * Handles both event_date (YYYY-MM-DD) and created_at (ISO timestamp)
 */
function getEventTimestamp(event: LearningEvent): Date {
  if (event.created_at) {
    return new Date(event.created_at);
  }
  // Fallback to event_date at midnight UTC
  return new Date(event.event_date + 'T00:00:00Z');
}

/**
 * Check if an event type is an origin event (lesson_viewed or lesson_completed)
 */
export function isOriginEvent(eventType: LearningEventType): boolean {
  return (ORIGIN_EVENT_TYPES as readonly string[]).includes(eventType);
}

/**
 * Check if an event type is a follow-up event
 */
export function isFollowUpEvent(eventType: LearningEventType): boolean {
  return (FOLLOW_UP_EVENT_TYPES as readonly string[]).includes(eventType);
}

/**
 * Calculate follow-up rate
 *
 * For each origin event (lesson_viewed/lesson_completed),
 * check if there's a follow-up event within the time window.
 *
 * @spec-lock
 * - Window is 24 hours from origin event
 * - Only counts first follow-up per origin
 * - Origin and follow-up must be from same user
 */
export function calculateFollowUpRate(input: FollowUpInput): FollowUpRate {
  const { events, windowHours = FOLLOW_UP_WINDOW_HOURS } = input;
  const windowMs = windowHours * 60 * 60 * 1000;

  // Group events by user
  const eventsByUser = new Map<string, LearningEvent[]>();
  for (const event of events) {
    const userId = event.user_id;
    if (!eventsByUser.has(userId)) {
      eventsByUser.set(userId, []);
    }
    eventsByUser.get(userId)!.push(event);
  }

  let originCount = 0;
  let followedUpCount = 0;

  // Process each user's events
  for (const userEvents of eventsByUser.values()) {
    // Sort events by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // Find origin events and check for follow-ups
    for (const originEvent of sortedEvents) {
      if (!isOriginEvent(originEvent.event_type)) continue;

      originCount++;
      const originTime = getEventTimestamp(originEvent).getTime();
      const windowEnd = originTime + windowMs;

      // Check if there's a follow-up within the window
      const hasFollowUp = sortedEvents.some((e) => {
        if (!isFollowUpEvent(e.event_type)) return false;
        const eventTime = getEventTimestamp(e).getTime();
        return eventTime > originTime && eventTime <= windowEnd;
      });

      if (hasFollowUp) {
        followedUpCount++;
      }
    }
  }

  const rate = originCount > 0 ? Math.round((followedUpCount / originCount) * 100) : 0;

  return {
    originCount,
    followedUpCount,
    rate,
  };
}

/**
 * Calculate lesson completion rate
 *
 * @spec-lock
 * - Counts unique lessons viewed
 * - Counts unique lessons completed
 * - Rate = completed / viewed * 100
 */
export function calculateCompletionRate(events: LearningEvent[]): CompletionRate {
  // Group by user to count unique lessons per user
  const lessonsByUser = new Map<string, { viewed: Set<string>; completed: Set<string> }>();

  for (const event of events) {
    const userId = event.user_id;
    const lessonId = event.reference_id || '';

    if (!lessonsByUser.has(userId)) {
      lessonsByUser.set(userId, { viewed: new Set(), completed: new Set() });
    }

    const userLessons = lessonsByUser.get(userId)!;

    if (event.event_type === 'lesson_viewed' && lessonId) {
      userLessons.viewed.add(lessonId);
    } else if (event.event_type === 'lesson_completed' && lessonId) {
      userLessons.completed.add(lessonId);
    }
  }

  // Aggregate totals
  let viewedCount = 0;
  let completedCount = 0;

  for (const userLessons of lessonsByUser.values()) {
    viewedCount += userLessons.viewed.size;
    completedCount += userLessons.completed.size;
  }

  const rate = viewedCount > 0 ? Math.round((completedCount / viewedCount) * 100) : 0;

  return {
    viewedCount,
    completedCount,
    rate,
  };
}

/**
 * Count follow-up actions by type
 */
export function countFollowUpActions(events: LearningEvent[]): Map<LearningEventType, number> {
  const counts = new Map<LearningEventType, number>();

  for (const event of events) {
    if (isFollowUpEvent(event.event_type)) {
      const current = counts.get(event.event_type) || 0;
      counts.set(event.event_type, current + 1);
    }
  }

  return counts;
}

/**
 * Get the most common follow-up action
 */
export function getTopFollowUpAction(events: LearningEvent[]): {
  type: LearningEventType | null;
  count: number;
} {
  const counts = countFollowUpActions(events);

  let topType: LearningEventType | null = null;
  let topCount = 0;

  for (const [type, count] of counts) {
    if (count > topCount) {
      topType = type;
      topCount = count;
    }
  }

  return { type: topType, count: topCount };
}

/**
 * Build effectiveness summary for admin display
 */
export function buildEffectivenessSummary(events: LearningEvent[]): EffectivenessSummary {
  return {
    followUpRate: calculateFollowUpRate({ events }),
    completionRate: calculateCompletionRate(events),
    topFollowUpAction: getTopFollowUpAction(events),
  };
}

/**
 * Calculate follow-up rate for a specific origin type
 *
 * @spec-lock P3-1
 * - Window is 24 hours from origin event
 * - Only counts first follow-up per origin
 * - Origin and follow-up must be from same user
 * - review_started can be both origin and follow-up
 */
export function calculateFollowUpRateByOrigin(
  events: LearningEvent[],
  originType: OriginEventType,
  windowHours: number = FOLLOW_UP_WINDOW_HOURS
): OriginFollowUpRate {
  const windowMs = windowHours * 60 * 60 * 1000;

  // Group events by user
  const eventsByUser = new Map<string, LearningEvent[]>();
  for (const event of events) {
    const userId = event.user_id;
    if (!eventsByUser.has(userId)) {
      eventsByUser.set(userId, []);
    }
    eventsByUser.get(userId)!.push(event);
  }

  let originCount = 0;
  let followedUpCount = 0;

  // Process each user's events
  for (const userEvents of eventsByUser.values()) {
    // Sort events by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // Find origin events of the specified type and check for follow-ups
    for (const originEvent of sortedEvents) {
      if (originEvent.event_type !== originType) continue;

      originCount++;
      const originTime = getEventTimestamp(originEvent).getTime();
      const windowEnd = originTime + windowMs;

      // Check if there's a follow-up within the window
      // Note: review_started can be follow-up even when it's also the origin type
      const hasFollowUp = sortedEvents.some((e) => {
        if (!isFollowUpEvent(e.event_type)) return false;
        const eventTime = getEventTimestamp(e).getTime();
        return eventTime > originTime && eventTime <= windowEnd;
      });

      if (hasFollowUp) {
        followedUpCount++;
      }
    }
  }

  const rate = originCount > 0 ? Math.round((followedUpCount / originCount) * 100) : 0;

  return {
    originType,
    originCount,
    followedUpCount,
    rate,
  };
}

/**
 * Calculate effectiveness breakdown by origin type
 *
 * @spec-lock P3-1
 * - Returns overall rate + breakdown by each origin type
 * - Origin types: lesson_viewed, lesson_completed, review_started
 */
export function calculateEffectivenessBreakdown(
  events: LearningEvent[],
  windowHours: number = FOLLOW_UP_WINDOW_HOURS
): EffectivenessBreakdown {
  const overall = calculateFollowUpRate({ events, windowHours });

  const byOrigin: OriginFollowUpRate[] = ORIGIN_EVENT_TYPES.map((originType) =>
    calculateFollowUpRateByOrigin(events, originType, windowHours)
  );

  return {
    overall,
    byOrigin,
  };
}
