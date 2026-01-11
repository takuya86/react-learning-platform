/**
 * Lesson Effectiveness Ranking Service
 *
 * Pure functions for calculating lesson-level effectiveness metrics.
 * Determines which lessons drive follow-up actions.
 *
 * ## 仕様（固定）
 *
 * ### 集計単位
 * - lesson（reference_id = lesson slug）単位
 * - 期間内に発生した origin を母数（originCount）
 * - origin ごとに「同一ユーザーが24h以内に follow-up を1回でも起こしたか」を判定
 * - followUpRate = followUpCount / originCount
 *
 * ### ソート規則
 * - Best: followUpRate desc（同率なら originCount desc）
 * - Worst: followUpRate asc（同率なら originCount desc）
 */

import {
  FOLLOW_UP_WINDOW_HOURS,
  FOLLOW_UP_EVENT_TYPES,
  ORIGIN_EVENT_TYPES,
  type FollowUpEventType,
} from '../constants';
import type { LearningEvent, LearningEventType } from './metricsService';

/**
 * Lesson info for display
 */
export interface LessonInfo {
  slug: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Follow-up counts by event type
 */
export type FollowUpCounts = Partial<Record<FollowUpEventType, number>>;

/**
 * Ranking row for display
 */
export interface LessonRankingRow {
  slug: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  originCount: number;
  followUpCount: number;
  followUpRate: number;
  followUpCounts: FollowUpCounts;
  isLowSample: boolean;
}

/**
 * Ranking result
 */
export interface LessonRanking {
  best: LessonRankingRow[];
  worst: LessonRankingRow[];
}

/**
 * Options for building ranking
 */
export interface LessonRankingOptions {
  windowHours?: number;
  minSample?: number;
  limit?: number;
}

/**
 * Default minimum sample size to avoid low confidence rankings
 */
export const DEFAULT_MIN_SAMPLE = 5;

/**
 * Default ranking limit
 */
export const DEFAULT_RANKING_LIMIT = 10;

/**
 * Parse event timestamp to Date object
 */
function getEventTimestamp(event: LearningEvent): Date {
  if (event.created_at) {
    return new Date(event.created_at);
  }
  return new Date(event.event_date + 'T00:00:00Z');
}

/**
 * Check if an event type is an origin event
 */
function isOriginEvent(eventType: LearningEventType): boolean {
  return (ORIGIN_EVENT_TYPES as readonly string[]).includes(eventType);
}

/**
 * Check if an event type is a follow-up event
 */
function isFollowUpEvent(eventType: LearningEventType): boolean {
  return (FOLLOW_UP_EVENT_TYPES as readonly string[]).includes(eventType);
}

/**
 * Lesson metrics result including per-event-type counts
 */
export interface LessonMetricsData {
  originCount: number;
  followUpCount: number;
  followUpCounts: FollowUpCounts;
}

/**
 * Calculate lesson-level effectiveness metrics
 *
 * @spec-lock
 * - Window is 24 hours from origin event
 * - Each origin counts once toward followUpCount if ANY follow-up exists within window
 * - followUpCounts tracks unique follow-up events by type within the window
 * - Lessons with originCount = 0 are excluded from ranking
 */
export function calculateLessonMetrics(
  events: LearningEvent[],
  options: LessonRankingOptions = {}
): Map<string, LessonMetricsData> {
  const { windowHours = FOLLOW_UP_WINDOW_HOURS } = options;
  const windowMs = windowHours * 60 * 60 * 1000;

  // Group events by user
  const eventsByUser = new Map<string, LearningEvent[]>();
  for (const event of events) {
    if (!eventsByUser.has(event.user_id)) {
      eventsByUser.set(event.user_id, []);
    }
    eventsByUser.get(event.user_id)!.push(event);
  }

  // Aggregate metrics per lesson
  const lessonMetrics = new Map<string, LessonMetricsData>();

  // Process each user's events
  for (const userEvents of eventsByUser.values()) {
    // Sort by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // For each origin event, check if there's a follow-up within the window
    for (const originEvent of sortedEvents) {
      if (!isOriginEvent(originEvent.event_type)) continue;

      const lessonSlug = originEvent.reference_id || '';
      if (!lessonSlug) continue;

      // Initialize lesson metrics if not exists
      if (!lessonMetrics.has(lessonSlug)) {
        lessonMetrics.set(lessonSlug, {
          originCount: 0,
          followUpCount: 0,
          followUpCounts: {},
        });
      }

      const metrics = lessonMetrics.get(lessonSlug)!;
      metrics.originCount++;

      // Check for follow-up within window
      const originTime = getEventTimestamp(originEvent).getTime();
      const windowEnd = originTime + windowMs;

      // Track which follow-up types occurred within window
      const followUpTypesInWindow = new Set<FollowUpEventType>();
      let hasFollowUp = false;

      for (const e of sortedEvents) {
        if (!isFollowUpEvent(e.event_type)) continue;
        const eventTime = getEventTimestamp(e).getTime();
        if (eventTime > originTime && eventTime <= windowEnd) {
          hasFollowUp = true;
          followUpTypesInWindow.add(e.event_type as FollowUpEventType);
        }
      }

      if (hasFollowUp) {
        metrics.followUpCount++;
      }

      // Increment counts for each follow-up type found
      for (const eventType of followUpTypesInWindow) {
        metrics.followUpCounts[eventType] = (metrics.followUpCounts[eventType] || 0) + 1;
      }
    }
  }

  return lessonMetrics;
}

/**
 * Build lesson effectiveness ranking
 *
 * @spec-lock
 * - Best: sorted by followUpRate desc, tie-break by originCount desc
 * - Worst: sorted by followUpRate asc, tie-break by originCount desc
 * - Lessons with originCount = 0 are excluded
 * - Low sample flag when originCount < minSample
 */
export function buildLessonRanking(
  events: LearningEvent[],
  lessons: LessonInfo[],
  options: LessonRankingOptions = {}
): LessonRanking {
  const { minSample = DEFAULT_MIN_SAMPLE, limit = DEFAULT_RANKING_LIMIT } = options;

  // Calculate metrics per lesson
  const lessonMetrics = calculateLessonMetrics(events, options);

  // Build lookup map for lesson info
  const lessonInfoMap = new Map<string, LessonInfo>();
  for (const lesson of lessons) {
    lessonInfoMap.set(lesson.slug, lesson);
  }

  // Build ranking rows
  const rows: LessonRankingRow[] = [];
  for (const [slug, metrics] of lessonMetrics) {
    // Skip lessons with no origin events
    if (metrics.originCount === 0) continue;

    const lessonInfo = lessonInfoMap.get(slug);
    const rate = Math.round((metrics.followUpCount / metrics.originCount) * 100);

    rows.push({
      slug,
      title: lessonInfo?.title || slug,
      difficulty: lessonInfo?.difficulty || 'beginner',
      originCount: metrics.originCount,
      followUpCount: metrics.followUpCount,
      followUpRate: rate,
      followUpCounts: metrics.followUpCounts,
      isLowSample: metrics.originCount < minSample,
    });
  }

  // Sort for best: followUpRate desc, originCount desc
  const sortedBest = [...rows].sort((a, b) => {
    if (b.followUpRate !== a.followUpRate) {
      return b.followUpRate - a.followUpRate;
    }
    return b.originCount - a.originCount;
  });

  // Sort for worst: followUpRate asc, originCount desc
  const sortedWorst = [...rows].sort((a, b) => {
    if (a.followUpRate !== b.followUpRate) {
      return a.followUpRate - b.followUpRate;
    }
    return b.originCount - a.originCount;
  });

  return {
    best: sortedBest.slice(0, limit),
    worst: sortedWorst.slice(0, limit),
  };
}
