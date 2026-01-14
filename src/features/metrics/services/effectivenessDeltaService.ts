/**
 * Effectiveness Delta Service
 *
 * Pure functions for calculating lesson effectiveness snapshots and deltas.
 * Used for measuring the impact of lesson improvements.
 *
 * ## 仕様（固定）
 *
 * ### Snapshot計算
 * - 指定期間（windowDays）のイベントのみを使用
 * - window境界はUTCで計算: [nowUtc - windowDays, nowUtc)
 * - 期間内のlesson_viewed/lesson_completedをoriginとしてカウント
 * - originごとに24h以内のfollow-upをカウント
 *
 * ### Delta計算
 * - deltaRate = afterRate - beforeRate
 * - originCount < 5 の場合は isLowSample = true
 *
 * ### Baseline解析
 * - Issue本文のfront-matterからbaselineを抽出
 * - 必須フィールド: lessonSlug, hintType, baselineWindowDays, baselineSnapshotAtUtc, originCount, followUpRate
 */

import {
  FOLLOW_UP_WINDOW_HOURS,
  FOLLOW_UP_EVENT_TYPES,
  ORIGIN_EVENT_TYPES,
  type FollowUpEventType,
} from '../constants';
import type { LearningEvent, LearningEventType } from './metricsService';
import type { FollowUpCounts } from './lessonEffectivenessRankingService';

/**
 * Minimum sample size to avoid low confidence metrics
 */
export const MIN_SAMPLE_SIZE = 5;

/**
 * Lesson effectiveness snapshot for a specific time window
 */
export interface LessonEffectivenessSnapshot {
  lessonSlug: string;
  originCount: number;
  followUpRate: number;
  followUpCounts: FollowUpCounts;
  snapshotAt: string; // UTC timestamp
}

/**
 * Delta between two effectiveness snapshots
 */
export interface LessonEffectivenessDelta {
  lessonSlug: string;
  beforeRate: number;
  afterRate: number;
  deltaRate: number;
  beforeOriginCount: number;
  afterOriginCount: number;
  isLowSample: boolean;
}

/**
 * Baseline data parsed from issue body
 */
export interface IssueBaseline {
  lessonSlug: string;
  hintType: string;
  baselineWindowDays: number;
  baselineSnapshotAtUtc: string;
  originCount: number;
  followUpRate: number;
}

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
 * Build lesson effectiveness snapshot for a specific time window
 *
 * @spec-lock
 * - Window boundary is UTC-based: [nowUtc - windowDays * 24h, nowUtc)
 * - Only events within the window are considered
 * - Follow-up window is 24 hours from origin event
 * - Multiple follow-ups count as 1 per origin
 * - followUpRate is rounded to integer percentage
 *
 * @param events All learning events (will be filtered by window)
 * @param nowUtc Current UTC timestamp (ISO string)
 * @param windowDays Number of days to look back from nowUtc
 * @returns Snapshot for each lesson that has origin events in the window
 */
export function buildLessonEffectivenessSnapshot(
  events: LearningEvent[],
  nowUtc: string,
  windowDays: number
): LessonEffectivenessSnapshot[] {
  const nowMs = new Date(nowUtc).getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const windowStartMs = nowMs - windowMs;
  const followUpWindowMs = FOLLOW_UP_WINDOW_HOURS * 60 * 60 * 1000;

  // Filter events within the window
  const eventsInWindow = events.filter((event) => {
    const eventMs = getEventTimestamp(event).getTime();
    return eventMs >= windowStartMs && eventMs < nowMs;
  });

  // Group events by user
  const eventsByUser = new Map<string, LearningEvent[]>();
  for (const event of eventsInWindow) {
    if (!eventsByUser.has(event.user_id)) {
      eventsByUser.set(event.user_id, []);
    }
    eventsByUser.get(event.user_id)!.push(event);
  }

  // Aggregate metrics per lesson
  const lessonMetrics = new Map<
    string,
    {
      originCount: number;
      followUpCount: number;
      followUpCounts: FollowUpCounts;
    }
  >();

  // Process each user's events
  for (const userEvents of eventsByUser.values()) {
    // Sort by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // For each origin event, check if there's a follow-up within 24h
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

      // Check for follow-up within 24h window
      const originTime = getEventTimestamp(originEvent).getTime();
      const followUpWindowEnd = originTime + followUpWindowMs;

      // Track which follow-up types occurred within window
      const followUpTypesInWindow = new Set<FollowUpEventType>();
      let hasFollowUp = false;

      for (const e of sortedEvents) {
        if (!isFollowUpEvent(e.event_type)) continue;
        const eventTime = getEventTimestamp(e).getTime();
        if (eventTime > originTime && eventTime <= followUpWindowEnd) {
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

  // Build snapshots
  const snapshots: LessonEffectivenessSnapshot[] = [];
  for (const [lessonSlug, metrics] of lessonMetrics) {
    const rate =
      metrics.originCount > 0 ? Math.round((metrics.followUpCount / metrics.originCount) * 100) : 0;

    snapshots.push({
      lessonSlug,
      originCount: metrics.originCount,
      followUpRate: rate,
      followUpCounts: metrics.followUpCounts,
      snapshotAt: nowUtc,
    });
  }

  return snapshots;
}

/**
 * Build lesson effectiveness delta from before/after snapshots
 *
 * @spec-lock
 * - deltaRate = afterRate - beforeRate
 * - isLowSample = true when beforeOriginCount < 5 OR afterOriginCount < 5
 * - before and after must have matching lessonSlug
 *
 * @param before Baseline snapshot (before improvement)
 * @param after Current snapshot (after improvement)
 * @returns Delta metrics, or null if lessonSlug doesn't match
 */
export function buildLessonEffectivenessDelta(
  before: LessonEffectivenessSnapshot,
  after: LessonEffectivenessSnapshot
): LessonEffectivenessDelta | null {
  if (before.lessonSlug !== after.lessonSlug) {
    return null;
  }

  const deltaRate = after.followUpRate - before.followUpRate;
  const isLowSample = before.originCount < MIN_SAMPLE_SIZE || after.originCount < MIN_SAMPLE_SIZE;

  return {
    lessonSlug: before.lessonSlug,
    beforeRate: before.followUpRate,
    afterRate: after.followUpRate,
    deltaRate,
    beforeOriginCount: before.originCount,
    afterOriginCount: after.originCount,
    isLowSample,
  };
}

/**
 * Parse issue baseline from front-matter
 *
 * Expected format:
 * ```
 * ---
 * lessonSlug: react-basics
 * hintType: add-interactive-example
 * baselineWindowDays: 30
 * baselineSnapshotAtUtc: 2024-01-15T00:00:00Z
 * originCount: 42
 * followUpRate: 35
 * ---
 * ```
 *
 * @spec-lock
 * - All fields are required
 * - Returns null if parsing fails or any field is missing
 * - followUpRate is expected as integer percentage (0-100)
 *
 * @param issueBody Issue body text containing front-matter
 * @returns Parsed baseline data, or null if invalid
 */
export function parseIssueBaseline(issueBody: string): IssueBaseline | null {
  // Extract front-matter block between --- markers
  const frontMatterMatch = issueBody.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatterMatch) {
    return null;
  }

  const frontMatter = frontMatterMatch[1];
  const lines = frontMatter.split('\n');

  const data: Partial<IssueBaseline> = {};

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;

    const trimmedKey = key.trim();
    const value = valueParts.join(':').trim();

    switch (trimmedKey) {
      case 'lessonSlug':
        data.lessonSlug = value;
        break;
      case 'hintType':
        data.hintType = value;
        break;
      case 'baselineWindowDays':
        data.baselineWindowDays = parseInt(value, 10);
        break;
      case 'baselineSnapshotAtUtc':
        data.baselineSnapshotAtUtc = value;
        break;
      case 'originCount':
        data.originCount = parseInt(value, 10);
        break;
      case 'followUpRate':
        data.followUpRate = parseInt(value, 10);
        break;
    }
  }

  // Validate all required fields are present and valid
  if (
    !data.lessonSlug ||
    !data.hintType ||
    typeof data.baselineWindowDays !== 'number' ||
    isNaN(data.baselineWindowDays) ||
    !data.baselineSnapshotAtUtc ||
    typeof data.originCount !== 'number' ||
    isNaN(data.originCount) ||
    typeof data.followUpRate !== 'number' ||
    isNaN(data.followUpRate)
  ) {
    return null;
  }

  return data as IssueBaseline;
}
