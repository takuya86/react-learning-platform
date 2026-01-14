/**
 * Improvement ROI Service
 *
 * Pure functions for calculating improvement ROI (Return on Investment).
 * Analyzes the effectiveness of lesson improvements by comparing before/after metrics.
 *
 * ## 仕様（固定）
 *
 * ### ROI Status
 * - IMPROVED: deltaFollowUpRate >= +5pp
 * - REGRESSED: deltaFollowUpRate <= -5pp
 * - NO_CHANGE: -5pp < deltaFollowUpRate < +5pp
 * - INSUFFICIENT_DATA: originCount < 5 (before or after)
 *
 * ### Snapshot Calculation
 * - 指定期間内のイベントのみを使用
 * - originCount: lesson_viewed の数
 * - followUpRate: 24h以内にfollow-upがあった割合 (0-1)
 * - completionRate: lesson_viewed に対する lesson_completed の割合 (0-1)
 *
 * ### Delta Calculation
 * - deltaFollowUpRate = afterRate - beforeRate (decimal)
 * - deltaCompletionRate = afterCompletionRate - beforeCompletionRate (decimal)
 * - windowDays: ROI計算期間（通常7日）
 */

import {
  ROI_WINDOW_DAYS,
  EVAL_RATE_DELTA_THRESHOLD,
  FOLLOW_UP_WINDOW_HOURS,
  FOLLOW_UP_EVENT_TYPES,
} from '../constants';
import type { LearningEvent, LearningEventType } from './metricsService';

/**
 * ROI status for improvement effectiveness
 */
export type RoiStatus = 'IMPROVED' | 'REGRESSED' | 'NO_CHANGE' | 'INSUFFICIENT_DATA';

/**
 * ROI snapshot for a specific time window
 */
export interface RoiSnapshot {
  /** Number of lesson_viewed events */
  originCount: number;
  /** Number of lesson_viewed events with follow-up within 24h */
  followUpCount: number;
  /** Follow-up rate as decimal (0-1) */
  followUpRate: number;
  /** Number of lesson_completed events */
  completionCount: number;
  /** Completion rate as decimal (0-1) */
  completionRate: number;
}

/**
 * Improvement ROI result
 */
export interface ImprovementRoi {
  /** Lesson slug */
  lessonSlug: string;
  /** Issue number */
  issueNumber: number;
  /** Issue title */
  issueTitle: string;
  /** ROI status */
  status: RoiStatus;
  /** Before snapshot */
  before: RoiSnapshot;
  /** After snapshot */
  after: RoiSnapshot;
  /** Delta in follow-up rate (decimal, e.g., 0.05 = +5pp) */
  deltaFollowUpRate: number;
  /** Delta in completion rate (decimal) */
  deltaCompletionRate: number;
  /** Window size in days */
  windowDays: number;
  /** Issue created_at timestamp */
  createdAt: string;
  /** Issue closed_at timestamp */
  closedAt: string;
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
 * Metadata for ROI calculation
 */
export interface RoiMeta {
  /** Issue number */
  issueNumber: number;
  /** Issue title */
  issueTitle: string;
  /** Lesson slug */
  lessonSlug: string;
  /** Issue created_at timestamp */
  createdAt: string;
  /** Issue closed_at timestamp */
  closedAt: string;
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
 * Check if an event type is a follow-up event
 */
function isFollowUpEvent(eventType: LearningEventType): boolean {
  return (FOLLOW_UP_EVENT_TYPES as readonly string[]).includes(eventType);
}

/**
 * Build ROI snapshot for a specific time window
 *
 * @spec-lock
 * - Only events within [from, to) are considered
 * - Follow-up window is 24 hours from lesson_viewed
 * - followUpRate: lesson_viewed後24hにfollow-upがあった割合 (0-1)
 * - completionRate: lesson_viewedに対するlesson_completedの割合 (0-1)
 * - If originCount is 0, rates are 0 (not NaN)
 *
 * @param events All learning events (will be filtered by window and lessonSlug)
 * @param input Time window and lesson filter
 * @returns ROI snapshot
 */
export function buildRoiSnapshot(events: LearningEvent[], input: SnapshotInput): RoiSnapshot {
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
  let completionCount = 0;

  // Process each user's events
  for (const userEvents of Array.from(eventsByUser.values())) {
    // Sort by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // Count lesson_viewed and check for follow-ups
    for (const event of sortedEvents) {
      if (event.event_type === 'lesson_viewed') {
        originCount++;

        const originTime = getEventTimestamp(event).getTime();
        const followUpWindowEnd = originTime + followUpWindowMs;

        // Check if there's a follow-up within 24h
        const hasFollowUp = sortedEvents.some((e) => {
          if (!isFollowUpEvent(e.event_type)) return false;
          const eventTime = getEventTimestamp(e).getTime();
          return eventTime > originTime && eventTime <= followUpWindowEnd;
        });

        if (hasFollowUp) {
          followUpCount++;
        }
      }

      // Count lesson_completed
      if (event.event_type === 'lesson_completed') {
        completionCount++;
      }
    }
  }

  // Calculate rates (0-1), handle 0 origins gracefully
  const followUpRate = originCount > 0 ? followUpCount / originCount : 0;
  const completionRate = originCount > 0 ? completionCount / originCount : 0;

  return {
    originCount,
    followUpCount,
    followUpRate,
    completionCount,
    completionRate,
  };
}

/**
 * Calculate improvement ROI from before/after snapshots
 *
 * @spec-lock
 * - deltaFollowUpRate = afterRate - beforeRate (in decimal, e.g., 0.05 = +5pp)
 * - deltaCompletionRate = afterCompletionRate - beforeCompletionRate (in decimal)
 * - status is determined by getRoiStatus()
 * - windowDays is included in the output
 *
 * @param beforeSnapshot Baseline snapshot (before improvement)
 * @param afterSnapshot Current snapshot (after improvement)
 * @param meta Metadata for the ROI calculation
 * @returns Improvement ROI result
 */
export function calculateImprovementRoi(
  beforeSnapshot: RoiSnapshot,
  afterSnapshot: RoiSnapshot,
  meta: RoiMeta
): ImprovementRoi {
  const deltaFollowUpRate = afterSnapshot.followUpRate - beforeSnapshot.followUpRate;
  const deltaCompletionRate = afterSnapshot.completionRate - beforeSnapshot.completionRate;
  const status = getRoiStatus(
    deltaFollowUpRate,
    beforeSnapshot.originCount,
    afterSnapshot.originCount
  );

  return {
    lessonSlug: meta.lessonSlug,
    issueNumber: meta.issueNumber,
    issueTitle: meta.issueTitle,
    status,
    before: beforeSnapshot,
    after: afterSnapshot,
    deltaFollowUpRate,
    deltaCompletionRate,
    windowDays: ROI_WINDOW_DAYS,
    createdAt: meta.createdAt,
    closedAt: meta.closedAt,
  };
}

/**
 * Get ROI status based on delta rate and sample size
 *
 * @spec-lock
 * - INSUFFICIENT_DATA: beforeOriginCount < 5 OR afterOriginCount < 5
 * - IMPROVED: deltaFollowUpRate >= +0.05 (+5pp)
 * - REGRESSED: deltaFollowUpRate <= -0.05 (-5pp)
 * - NO_CHANGE: otherwise
 *
 * @param deltaFollowUpRate Delta in decimal (e.g., 0.05 = +5pp)
 * @param beforeOriginCount Number of origin events in before period
 * @param afterOriginCount Number of origin events in after period
 * @returns ROI status
 */
export function getRoiStatus(
  deltaFollowUpRate: number,
  beforeOriginCount: number,
  afterOriginCount: number
): RoiStatus {
  // Check sample size first (both periods must have sufficient data)
  if (beforeOriginCount < 5 || afterOriginCount < 5) {
    return 'INSUFFICIENT_DATA';
  }

  // Check for significant improvement
  if (deltaFollowUpRate >= EVAL_RATE_DELTA_THRESHOLD) {
    return 'IMPROVED';
  }

  // Check for significant regression
  if (deltaFollowUpRate <= -EVAL_RATE_DELTA_THRESHOLD) {
    return 'REGRESSED';
  }

  // No significant change
  return 'NO_CHANGE';
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
 * Format delta with +/- sign
 */
function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

/**
 * Build GitHub comment markdown for improvement ROI
 *
 * @spec-lock
 * - Pure function (no side effects)
 * - Returns markdown string
 * - Includes emoji based on status
 * - Shows before/after comparison table
 * - Displays both follow-up and completion metrics
 *
 * @param roi Improvement ROI result
 * @returns Markdown comment text
 */
export function buildRoiComment(roi: ImprovementRoi): string {
  const {
    status,
    before,
    after,
    deltaFollowUpRate,
    deltaCompletionRate,
    windowDays,
    lessonSlug,
    issueNumber,
    issueTitle,
  } = roi;

  // Status emoji
  const statusEmoji = {
    IMPROVED: '✅',
    REGRESSED: '⚠️',
    NO_CHANGE: 'ℹ️',
    INSUFFICIENT_DATA: '📊',
  }[status];

  // Header
  let comment = `## ${statusEmoji} Improvement ROI Report\n\n`;
  comment += `**Issue:** #${issueNumber} - ${issueTitle}\n`;
  comment += `**Lesson:** \`${lessonSlug}\`\n`;
  comment += `**Analysis Period:** ${windowDays} days (before/after)\n\n`;

  // Status summary
  comment += `### Status: ${status}\n\n`;
  if (status === 'IMPROVED') {
    comment += `🎉 The improvement is showing positive results! Follow-up rate improved by ${formatPercentagePoints(deltaFollowUpRate)}.\n\n`;
  } else if (status === 'REGRESSED') {
    comment += `⚠️ The improvement appears to have had a negative effect. Follow-up rate decreased by ${formatPercentagePoints(Math.abs(deltaFollowUpRate))}.\n\n`;
  } else if (status === 'NO_CHANGE') {
    comment += `The improvement shows no significant change in follow-up rate (${formatPercentagePoints(deltaFollowUpRate)}, within ±5pp threshold).\n\n`;
  } else {
    comment += `⚠️ Sample size is too small for reliable ROI analysis. Before: ${before.originCount} views, After: ${after.originCount} views (minimum: 5 each).\n\n`;
  }

  // Before/After comparison table
  comment += `### Before/After Comparison\n\n`;
  comment += `| Metric | Before | After | Delta |\n`;
  comment += `|--------|--------|-------|-------|\n`;
  comment += `| Lesson Views | ${before.originCount} | ${after.originCount} | ${formatDelta(
    after.originCount - before.originCount
  )} |\n`;
  comment += `| Follow-up Rate | ${formatPercentage(before.followUpRate)} | ${formatPercentage(
    after.followUpRate
  )} | ${formatPercentagePoints(deltaFollowUpRate)} |\n`;
  comment += `| Follow-up Count | ${before.followUpCount} | ${after.followUpCount} | ${formatDelta(
    after.followUpCount - before.followUpCount
  )} |\n`;
  comment += `| Completion Rate | ${formatPercentage(before.completionRate)} | ${formatPercentage(
    after.completionRate
  )} | ${formatPercentagePoints(deltaCompletionRate)} |\n`;
  comment += `| Completion Count | ${before.completionCount} | ${after.completionCount} | ${formatDelta(
    after.completionCount - before.completionCount
  )} |\n\n`;

  // Recommendations based on status
  if (status === 'INSUFFICIENT_DATA') {
    comment += `### Recommendation\n\n`;
    comment += `⚠️ Wait for more data before evaluating the improvement's effectiveness. Target: 5+ lesson views in each period.\n\n`;
  } else if (status === 'REGRESSED') {
    comment += `### Recommendation\n\n`;
    comment += `⚠️ Consider reverting the change or investigating why engagement decreased. Review the improvement to identify potential issues.\n\n`;
  } else if (status === 'IMPROVED') {
    comment += `### Recommendation\n\n`;
    comment += `✅ Great work! The improvement is effective. Consider:\n`;
    comment += `- Applying similar improvements to other lessons\n`;
    comment += `- Documenting what made this improvement successful\n`;
    comment += `- Monitoring long-term trends to ensure sustained improvement\n\n`;
  } else {
    comment += `### Recommendation\n\n`;
    comment += `ℹ️ The improvement shows no significant impact yet. Consider:\n`;
    comment += `- Monitoring for a longer period to capture more data\n`;
    comment += `- Reviewing if the improvement targets the right pain points\n`;
    comment += `- Gathering qualitative feedback from users\n\n`;
  }

  return comment;
}
