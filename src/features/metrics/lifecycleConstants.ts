/**
 * Lifecycle Runner Constants
 *
 * 運用ガードレール用の定数
 * P5-2.4: 暴走防止・監査ログ・安全停止
 *
 * ⚠️ これらの値は spec-lock
 */

// ============================================================
// Safety Guards (spec-lock)
// ============================================================

/**
 * Maximum actions per single run
 * @spec-lock 1回の実行で適用できる最大件数
 */
export const MAX_ACTIONS_PER_RUN = 20;

/**
 * Default run mode
 * @spec-lock schedule 実行は必ず dry-run
 */
export const DEFAULT_RUN_MODE = 'dry' as const;

/**
 * Require confirm flag for write operations
 * @spec-lock --confirm-run がないと本番変更しない
 */
export const REQUIRE_CONFIRM_FLAG_FOR_RUN = true;

/**
 * Safe exit on missing secrets
 * @spec-lock secrets 未設定時は安全終了（エラーにしない）
 */
export const SAFE_EXIT_ON_MISSING_SECRETS = true;

// ============================================================
// Event Types and Reference Format
// ============================================================

/**
 * Lifecycle applied event type
 */
export const LIFECYCLE_APPLIED_EVENT_TYPE = 'lifecycle_applied' as const;

/**
 * Lifecycle run summary event type (for audit logging)
 */
export const LIFECYCLE_RUN_SUMMARY_EVENT_TYPE = 'lifecycle_run_summary' as const;

/**
 * Reference ID prefix for lifecycle events
 */
export const LIFECYCLE_REFERENCE_PREFIX = 'issue' as const;

/**
 * All possible lifecycle decisions
 */
export const LIFECYCLE_DECISIONS = ['CONTINUE', 'CLOSE_NO_EFFECT', 'REDESIGN_REQUIRED'] as const;

export type LifecycleDecisionType = (typeof LIFECYCLE_DECISIONS)[number];

// ============================================================
// Run Summary Structure
// ============================================================

/**
 * Lifecycle run summary for audit logging
 */
export interface LifecycleRunSummary {
  runAt: string;
  mode: 'dry' | 'run';
  processedCount: number;
  appliedCount: number;
  closeCount: number;
  redesignCount: number;
  continueCount: number;
  skippedIdempotentCount: number;
  skippedLimitCount: number;
  errorCount: number;
  errors: string[];
}

/**
 * Build reference ID for run summary event
 */
export function buildRunSummaryReferenceId(runAt: string): string {
  return `run:${runAt}`;
}
