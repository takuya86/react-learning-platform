/**
 * Lifecycle Idempotency Service
 *
 * Manages idempotency for lifecycle decisions.
 * Uses learning_events table to track which decisions have been applied.
 *
 * reference_id format: `issue:{issueNumber}:{decision}`
 * Example: `issue:123:CLOSE_NO_EFFECT`
 */

import type { LifecycleDecision } from '@/features/admin';
import { LIFECYCLE_APPLIED_EVENT_TYPE } from '../constants';

/**
 * Build reference ID for lifecycle event
 * @spec-lock format: issue:{issueNumber}:{decision}
 */
export function buildLifecycleReferenceId(
  issueNumber: number,
  decision: LifecycleDecision
): string {
  return `issue:${issueNumber}:${decision}`;
}

/**
 * Check if lifecycle decision has already been applied
 * Uses a Set of applied reference IDs for lookup
 *
 * @param appliedSet Set of reference IDs that have been applied
 * @param issueNumber Issue number
 * @param decision Lifecycle decision
 * @returns true if should skip (already applied)
 */
export function shouldSkipDecision(
  appliedSet: Set<string>,
  issueNumber: number,
  decision: LifecycleDecision
): boolean {
  const referenceId = buildLifecycleReferenceId(issueNumber, decision);
  return appliedSet.has(referenceId);
}

/**
 * Build learning event record for lifecycle applied
 *
 * @param userId System user ID (e.g., 'system')
 * @param issueNumber Issue number
 * @param decision Lifecycle decision
 * @param eventDate UTC date string (YYYY-MM-DD)
 */
export function buildLifecycleAppliedEvent(
  userId: string,
  issueNumber: number,
  decision: LifecycleDecision,
  eventDate: string
) {
  return {
    user_id: userId,
    event_type: LIFECYCLE_APPLIED_EVENT_TYPE,
    reference_id: buildLifecycleReferenceId(issueNumber, decision),
    event_date: eventDate,
  };
}

/**
 * Parse lifecycle reference ID to extract issue number and decision
 */
export function parseLifecycleReferenceId(referenceId: string): {
  issueNumber: number;
  decision: LifecycleDecision;
} | null {
  const match = referenceId.match(/^issue:(\d+):(\w+)$/);
  if (!match) return null;
  return {
    issueNumber: parseInt(match[1], 10),
    decision: match[2] as LifecycleDecision,
  };
}
