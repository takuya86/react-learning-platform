/**
 * Evaluation Service
 *
 * Pure functions for automatic evaluation of improvement effectiveness.
 * Analyzes before/after snapshots and generates evaluation reports.
 *
 * ## 仕様（固定）
 *
 * ### Evaluation Status
 * - IMPROVED: deltaRate >= +5pp
 * - REGRESSED: deltaRate <= -5pp
 * - NO_CHANGE: -5pp < deltaRate < +5pp
 * - LOW_SAMPLE: originCount < 5 (before or after)
 *
 * ### Snapshot Calculation
 * - 指定期間内のイベントのみを使用
 * - originCount: lesson_viewed/lesson_completed の数
 * - followUpRate: 24h以内にfollow-upがあった割合 (0-1)
 * - followUpCounts: follow-upイベントタイプ別のカウント
 *
 * ### Delta Calculation
 * - deltaRate = afterRate - beforeRate (percentage points)
 * - windowDays: 評価期間（通常14日）
 *
 * ### Comment Generation
 * - GitHub Issue用のMarkdownコメントを生成
 * - ステータスに応じた絵文字とメッセージ
 * - Before/Afterの詳細データ付き
 */

import {
  MIN_ORIGIN_FOR_EVAL,
  EVAL_RATE_DELTA_THRESHOLD,
  FOLLOW_UP_WINDOW_HOURS,
  FOLLOW_UP_EVENT_TYPES,
  ORIGIN_EVENT_TYPES,
} from '../constants';
import type { LearningEvent, LearningEventType } from './metricsService';

/**
 * Evaluation status for improvement effectiveness
 */
export type EvaluationStatus = 'IMPROVED' | 'REGRESSED' | 'NO_CHANGE' | 'LOW_SAMPLE';

/**
 * Follow-up counts by event type
 */
export type FollowUpCounts = Record<string, number>;

/**
 * Effectiveness snapshot for a specific time window
 */
export interface EffectivenessSnapshot {
  /** Number of origin events (lesson_viewed/lesson_completed) */
  originCount: number;
  /** Number of origin events with follow-up within 24h */
  followUpCount: number;
  /** Follow-up rate as decimal (0-1) */
  followUpRate: number;
  /** Follow-up counts by event type */
  followUpCounts: FollowUpCounts;
}

/**
 * Delta between before and after effectiveness
 */
export interface EffectivenessDelta {
  /** Evaluation status */
  status: EvaluationStatus;
  /** Before snapshot */
  before: EffectivenessSnapshot;
  /** After snapshot */
  after: EffectivenessSnapshot;
  /** Delta in percentage points (e.g., 0.05 = +5pp) */
  deltaRate: number;
  /** Window size in days */
  windowDays: number;
  /** Human-readable note about the evaluation */
  note: string;
}

/**
 * Input for snapshot calculation
 */
export interface SnapshotInput {
  /** Start of time window (UTC ISO string) */
  from: string;
  /** End of time window (UTC ISO string) */
  to: string;
  /** Target lesson slug */
  lessonSlug: string;
}

/**
 * Metadata for evaluation comment
 */
export interface EvaluationMeta {
  /** Issue number */
  issueNumber: number;
  /** Lesson slug */
  lessonSlug: string;
  /** Hint type */
  hintType: string;
  /** PR URL (optional) */
  prUrl?: string;
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
 * Build effectiveness snapshot for a specific time window
 *
 * @spec-lock
 * - Only events within [from, to) are considered
 * - Follow-up window is 24 hours from origin event
 * - followUpRate is decimal 0-1 (not percentage)
 * - If originCount is 0, followUpRate is 0 (not NaN)
 *
 * @param events All learning events (will be filtered by window and lessonSlug)
 * @param input Time window and lesson filter
 * @returns Effectiveness snapshot
 */
export function buildEffectivenessSnapshot(
  events: LearningEvent[],
  input: SnapshotInput
): EffectivenessSnapshot {
  const { from, to, lessonSlug } = input;
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const followUpWindowMs = FOLLOW_UP_WINDOW_HOURS * 60 * 60 * 1000;

  // Filter events within window and matching lessonSlug
  const eventsInWindow = events.filter((event) => {
    const eventMs = getEventTimestamp(event).getTime();
    const matchesTime = eventMs >= fromMs && eventMs < toMs;
    const matchesLesson = event.reference_id === lessonSlug;
    return matchesTime && matchesLesson;
  });

  // Group events by user
  const eventsByUser = new Map<string, LearningEvent[]>();
  for (const event of eventsInWindow) {
    if (!eventsByUser.has(event.user_id)) {
      eventsByUser.set(event.user_id, []);
    }
    eventsByUser.get(event.user_id)!.push(event);
  }

  let originCount = 0;
  let followUpCount = 0;
  const followUpCounts: FollowUpCounts = {};

  // Process each user's events
  for (const userEvents of eventsByUser.values()) {
    // Sort by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // For each origin event, check if there's a follow-up within 24h
    for (const originEvent of sortedEvents) {
      if (!isOriginEvent(originEvent.event_type)) continue;

      originCount++;

      const originTime = getEventTimestamp(originEvent).getTime();
      const followUpWindowEnd = originTime + followUpWindowMs;

      // Track which follow-up types occurred within window
      const followUpTypesInWindow = new Set<string>();
      let hasFollowUp = false;

      for (const e of sortedEvents) {
        if (!isFollowUpEvent(e.event_type)) continue;
        const eventTime = getEventTimestamp(e).getTime();
        if (eventTime > originTime && eventTime <= followUpWindowEnd) {
          hasFollowUp = true;
          followUpTypesInWindow.add(e.event_type);
        }
      }

      if (hasFollowUp) {
        followUpCount++;
      }

      // Increment counts for each follow-up type found
      for (const eventType of followUpTypesInWindow) {
        followUpCounts[eventType] = (followUpCounts[eventType] || 0) + 1;
      }
    }
  }

  // Calculate rate (0-1), handle 0 origins gracefully
  const followUpRate = originCount > 0 ? followUpCount / originCount : 0;

  return {
    originCount,
    followUpCount,
    followUpRate,
    followUpCounts,
  };
}

/**
 * Build effectiveness delta from before/after snapshots
 *
 * @spec-lock
 * - deltaRate = afterRate - beforeRate (in decimal, e.g., 0.05 = +5pp)
 * - windowDays is included in the output
 * - status is determined by getEvaluationStatus()
 *
 * @param beforeSnapshot Baseline snapshot (before improvement)
 * @param afterSnapshot Current snapshot (after improvement)
 * @param windowDays Window size in days
 * @returns Delta with evaluation status
 */
export function buildEffectivenessDelta(
  beforeSnapshot: EffectivenessSnapshot,
  afterSnapshot: EffectivenessSnapshot,
  windowDays: number
): EffectivenessDelta {
  const deltaRate = afterSnapshot.followUpRate - beforeSnapshot.followUpRate;
  const status = getEvaluationStatus(deltaRate, afterSnapshot.originCount);
  const note = generateStatusNote(status, deltaRate);

  return {
    status,
    before: beforeSnapshot,
    after: afterSnapshot,
    deltaRate,
    windowDays,
    note,
  };
}

/**
 * Get evaluation status based on delta rate and sample size
 *
 * @spec-lock
 * - LOW_SAMPLE: afterOriginCount < MIN_ORIGIN_FOR_EVAL (5)
 * - IMPROVED: deltaRate >= EVAL_RATE_DELTA_THRESHOLD (+0.05)
 * - REGRESSED: deltaRate <= -EVAL_RATE_DELTA_THRESHOLD (-0.05)
 * - NO_CHANGE: otherwise
 *
 * @param deltaRate Delta in decimal (e.g., 0.05 = +5pp)
 * @param afterOriginCount Number of origin events in after period
 * @returns Evaluation status
 */
export function getEvaluationStatus(deltaRate: number, afterOriginCount: number): EvaluationStatus {
  // Check sample size first
  if (afterOriginCount < MIN_ORIGIN_FOR_EVAL) {
    return 'LOW_SAMPLE';
  }

  // Check for significant improvement
  if (deltaRate >= EVAL_RATE_DELTA_THRESHOLD) {
    return 'IMPROVED';
  }

  // Check for significant regression
  if (deltaRate <= -EVAL_RATE_DELTA_THRESHOLD) {
    return 'REGRESSED';
  }

  // No significant change
  return 'NO_CHANGE';
}

/**
 * Generate human-readable note for evaluation status
 */
function generateStatusNote(status: EvaluationStatus, deltaRate: number): string {
  switch (status) {
    case 'IMPROVED':
      return `Follow-up rate improved by ${formatPercentagePoints(deltaRate)}`;
    case 'REGRESSED':
      return `Follow-up rate regressed by ${formatPercentagePoints(Math.abs(deltaRate))}`;
    case 'NO_CHANGE':
      return `Follow-up rate change is within ±5pp threshold (${formatPercentagePoints(deltaRate)})`;
    case 'LOW_SAMPLE':
      return 'Sample size too small for reliable evaluation (< 5 origin events)';
  }
}

/**
 * Format decimal to percentage points string
 */
function formatPercentagePoints(decimal: number): string {
  const pp = Math.round(decimal * 100);
  return pp >= 0 ? `+${pp}pp` : `${pp}pp`;
}

/**
 * Format decimal to percentage string
 */
function formatPercentage(decimal: number): string {
  return `${Math.round(decimal * 100)}%`;
}

/**
 * Build GitHub comment markdown for evaluation
 *
 * @spec-lock
 * - Pure function (no side effects)
 * - Returns markdown string
 * - Includes emoji based on status
 * - Shows before/after comparison table
 * - Lists follow-up event breakdown
 *
 * @param delta Effectiveness delta
 * @param meta Metadata for the comment
 * @returns Markdown comment text
 */
export function buildEvaluationComment(delta: EffectivenessDelta, meta: EvaluationMeta): string {
  const { status, before, after, deltaRate, windowDays, note } = delta;
  const { issueNumber, lessonSlug, hintType, prUrl } = meta;

  // Status emoji
  const statusEmoji = {
    IMPROVED: '✅',
    REGRESSED: '⚠️',
    NO_CHANGE: 'ℹ️',
    LOW_SAMPLE: '📊',
  }[status];

  // Header
  let comment = `## ${statusEmoji} Effectiveness Evaluation\n\n`;
  comment += `**Issue:** #${issueNumber}\n`;
  comment += `**Lesson:** \`${lessonSlug}\`\n`;
  comment += `**Hint Type:** \`${hintType}\`\n`;
  if (prUrl) {
    comment += `**PR:** ${prUrl}\n`;
  }
  comment += `**Evaluation Period:** ${windowDays} days (before/after)\n\n`;

  // Status summary
  comment += `### Status: ${status}\n\n`;
  comment += `${note}\n\n`;

  // Before/After comparison table
  comment += `### Before/After Comparison\n\n`;
  comment += `| Metric | Before | After | Delta |\n`;
  comment += `|--------|--------|-------|-------|\n`;
  comment += `| Origin Events | ${before.originCount} | ${after.originCount} | ${formatDelta(
    after.originCount - before.originCount
  )} |\n`;
  comment += `| Follow-up Rate | ${formatPercentage(before.followUpRate)} | ${formatPercentage(
    after.followUpRate
  )} | ${formatPercentagePoints(deltaRate)} |\n`;
  comment += `| Follow-up Count | ${before.followUpCount} | ${after.followUpCount} | ${formatDelta(
    after.followUpCount - before.followUpCount
  )} |\n\n`;

  // Follow-up breakdown (if any)
  if (Object.keys(after.followUpCounts).length > 0) {
    comment += `### Follow-up Event Breakdown (After)\n\n`;
    comment += `| Event Type | Count |\n`;
    comment += `|------------|-------|\n`;
    for (const [eventType, count] of Object.entries(after.followUpCounts)) {
      comment += `| \`${eventType}\` | ${count} |\n`;
    }
    comment += `\n`;
  }

  // Recommendations based on status
  if (status === 'LOW_SAMPLE') {
    comment += `### Recommendation\n\n`;
    comment += `⚠️ Sample size is too small (${after.originCount} origin events). `;
    comment += `Consider waiting for more data (target: ${MIN_ORIGIN_FOR_EVAL}+ events) before evaluating effectiveness.\n\n`;
  } else if (status === 'REGRESSED') {
    comment += `### Recommendation\n\n`;
    comment += `⚠️ The improvement appears to have had a negative effect. `;
    comment += `Consider reverting the change or investigating why engagement decreased.\n\n`;
  } else if (status === 'IMPROVED') {
    comment += `### Recommendation\n\n`;
    comment += `✅ The improvement is effective! Consider applying similar changes to other lessons.\n\n`;
  }

  return comment;
}

/**
 * Format delta with +/- sign
 */
function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}
