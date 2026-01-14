/**
 * Metrics Constants
 *
 * Habit Score / Intervention の仕様を一元管理
 * 将来の仕様変更に耐えられる構造
 *
 * ⚠️ 数値を直接書くのは禁止
 * → 必ずこのファイル経由で参照すること
 */

// ============================================================
// Habit Score Constants
// ============================================================

/**
 * Habit Score の重み配分（合計100）
 *
 * @spec-lock 重みの合計は常に100
 */
export const HABIT_SCORE_WEIGHTS = {
  /** 過去7日の学習日数 (max 40点) */
  RECENT_DAYS: 40,
  /** 連続日数 (max 40点, 7日で上限) */
  STREAK: 40,
  /** 週間目標達成率 (max 20点) */
  WEEKLY_PROGRESS: 20,
} as const;

/**
 * Habit Score の状態閾値
 *
 * @spec-lock 閾値は固定
 * - 80以上: stable
 * - 50以上: warning
 * - 50未満: danger
 */
export const HABIT_SCORE_THRESHOLDS = {
  /** stable の下限 */
  STABLE: 80,
  /** warning の下限 */
  WARNING: 50,
} as const;

/**
 * Habit Score 計算時の正規化上限
 */
export const HABIT_SCORE_NORMALIZATION = {
  /** 連続日数の上限（これ以上は同じスコア） */
  MAX_STREAK_DAYS: 7,
  /** 直近学習日数のカウント期間 */
  RECENT_DAYS_PERIOD: 7,
} as const;

// ============================================================
// Intervention Constants
// ============================================================

/**
 * 介入の優先順位（上から優先）
 *
 * @spec-lock 優先順位は固定
 */
export const INTERVENTION_PRIORITY = ['STREAK_RESCUE', 'WEEKLY_CATCHUP', 'POSITIVE'] as const;

/**
 * 介入タイプごとのCTAテキスト
 */
export const INTERVENTION_CTA_TEXT = {
  STREAK_RESCUE: '5分だけ学習する',
  WEEKLY_CATCHUP: '今週分を取り戻す',
} as const;

/**
 * 介入タイプごとのアイコン
 */
export const INTERVENTION_ICONS = {
  STREAK_RESCUE: '🌱',
  WEEKLY_CATCHUP: '📅',
  POSITIVE: '✨',
  POSITIVE_LONG_STREAK: '🎯',
} as const;

/**
 * POSITIVE 介入で長期ストリーク判定する閾値
 */
export const POSITIVE_LONG_STREAK_THRESHOLD = 7;

// ============================================================
// Event Logging Constants
// ============================================================

/**
 * 介入表示イベントのタイプ
 */
export const INTERVENTION_EVENT_TYPE = 'intervention_shown' as const;

/**
 * 介入表示ログを記録するタイプ（POSITIVE は記録しない）
 */
export const LOGGABLE_INTERVENTION_TYPES = ['STREAK_RESCUE', 'WEEKLY_CATCHUP'] as const;

/**
 * 成長インサイト表示イベントのタイプ
 */
export const INSIGHTS_EVENT_TYPE = 'insights_shown' as const;

/**
 * 成長インサイトカードのリファレンスID
 */
export const INSIGHTS_REFERENCE_ID = 'growth_insights_card' as const;

// ============================================================
// Learning Effectiveness Constants (P3-1)
// ============================================================

/**
 * Follow-up window in hours
 * @spec-lock 24時間以内のfollow-upをカウント
 */
export const FOLLOW_UP_WINDOW_HOURS = 24 as const;

/**
 * Follow-up対象イベントタイプ
 * @spec-lock これらのイベントがfollow-upとしてカウントされる
 */
export const FOLLOW_UP_EVENT_TYPES = [
  'next_lesson_opened',
  'review_started',
  'quiz_started',
  'note_created',
] as const;

/**
 * Follow-up event type (derived from FOLLOW_UP_EVENT_TYPES)
 */
export type FollowUpEventType = (typeof FOLLOW_UP_EVENT_TYPES)[number];

/**
 * 起点イベントタイプ
 * @spec-lock これらのイベントからfollow-upを計測する
 * - lesson_viewed: レッスン閲覧 → 次行動
 * - lesson_completed: レッスン完了 → 次行動
 * - review_started: 復習開始 → 次行動（P3-1拡張）
 */
export const ORIGIN_EVENT_TYPES = ['lesson_viewed', 'lesson_completed', 'review_started'] as const;

/**
 * Origin event type (derived from ORIGIN_EVENT_TYPES)
 */
export type OriginEventType = (typeof ORIGIN_EVENT_TYPES)[number];

// ============================================================
// Evaluation Service Constants (P4-1.1)
// ============================================================

/**
 * Evaluation window in days
 * @spec-lock 効果測定の期間（Before/After各14日間）
 */
export const EVALUATION_WINDOW_DAYS = 14 as const;

/**
 * Minimum origin count for valid evaluation
 * @spec-lock 5件未満はLOW_SAMPLEとして扱う
 */
export const MIN_ORIGIN_FOR_EVAL = 5 as const;

/**
 * Delta threshold for significant change (percentage points)
 * @spec-lock ±5pp以上の変化で改善/悪化と判定
 */
export const EVAL_RATE_DELTA_THRESHOLD = 0.05 as const;

// ============================================================
// ROI Service Constants (P4-2.1)
// ============================================================

/**
 * ROI calculation window in days (before/after each)
 * @spec-lock Before/After それぞれ7日間
 */
export const ROI_WINDOW_DAYS = 7 as const;

// ============================================================
// Priority Score Constants (P5-1.1)
// ============================================================

/**
 * Priority score version
 * @spec-lock バージョン管理用（将来のアルゴリズム変更に備える）
 */
export const PRIORITY_SCORE_VERSION = 'v1' as const;

/**
 * Impact weight calculation: log base
 * @spec-lock log10(originCount + 1) で計算
 */
export const PRIORITY_IMPACT_LOG_BASE = 10;

/**
 * Impact weight clamp range
 * @spec-lock 0.5 ~ 2.0 にクランプ
 */
export const PRIORITY_IMPACT_CLAMP = { min: 0.5, max: 2.0 } as const;

/**
 * Strategy weight by difficulty
 * @spec-lock 初心者向けを優先（beginner > intermediate > advanced）
 */
export const PRIORITY_STRATEGY_WEIGHTS = {
  beginner: 1.2,
  intermediate: 1.0,
  advanced: 0.9,
} as const;

// ============================================================
// Lifecycle Runner Constants (P5-2.3)
// ============================================================

/**
 * Lifecycle applied event type
 * @spec-lock lifecycle_applied イベントで冪等性を保証
 */
export const LIFECYCLE_APPLIED_EVENT_TYPE = 'lifecycle_applied' as const;
