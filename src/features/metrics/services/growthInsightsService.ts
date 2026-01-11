/**
 * Growth Insights Service
 *
 * 「やった → 効果が見える」を実現する集計ロジック
 *
 * ## 設計方針（P2-2準拠）
 * - 数値で褒める（増減・累積）
 * - 具体的に導く（次の一手）
 * - でも"責めない"
 *
 * ## 仕様（固定）
 * - 日付は UTC基準（YYYY-MM-DD形式）
 * - active day = その日にイベントが1つでもあれば1日
 * - 比較は「今週（月曜始まり）」 vs 「先週（月曜始まり）」
 */

import { getUTCDateString, getWeekStartUTC } from './metricsService';

// ============================================================
// Types
// ============================================================

export interface GrowthInsights {
  /** 今週の学習日数 */
  activeDaysThisWeek: number;
  /** 先週の学習日数 */
  activeDaysLastWeek: number;
  /** 差分（this - last） */
  deltaDays: number;
  /** 今週のイベント数 */
  eventsThisWeek: number;
  /** 累積学習日数（全期間） */
  lifetimeActiveDays: number;
  /** 最も伸びた領域（optional） */
  topFocus?: { label: string; count: number };
  /** UIに表示するメッセージ */
  message: string;
  /** サブメッセージ（補足説明） */
  subMessage: string;
}

export interface GrowthInsightsInput {
  /** イベント日付の配列（YYYY-MM-DD形式） */
  eventDates: string[];
  /** イベントの参照ID配列（topFocus計算用） */
  referenceIds?: string[];
  /** 基準日（テスト用、デフォルトは今日） */
  today?: string;
}

// ============================================================
// Constants
// ============================================================

/** 成長メッセージ（増加時） */
const GROWTH_MESSAGES = {
  SIGNIFICANT_INCREASE: (delta: number) => ({
    message: `先週より${delta}日多く学習しています！`,
    subMessage: 'この調子で続けましょう',
  }),
  SLIGHT_INCREASE: {
    message: '先週より学習日数が増えています',
    subMessage: '着実に成長しています',
  },
  MAINTAINED: {
    message: '先週と同じペースをキープ中',
    subMessage: '安定した学習習慣ができています',
  },
} as const;

/** スローペースメッセージ（減少時）- 責めない */
const SLOW_MESSAGES = {
  SLIGHT_DECREASE: {
    message: '今週はスローペース',
    subMessage: '5分だけでも大丈夫です',
  },
  SIGNIFICANT_DECREASE: {
    message: '今週はお休みモード',
    subMessage: '無理せず、できる時に再開しましょう',
  },
} as const;

/** 空状態メッセージ */
const EMPTY_MESSAGES = {
  NO_EVENTS: {
    message: '最初の1回が一番大切',
    subMessage: '今日から始めてみませんか？',
  },
  FIRST_WEEK: {
    message: 'スタートおめでとうございます！',
    subMessage: '来週と比較できるようになります',
  },
  THIS_WEEK_ONLY: {
    message: '今週の学習が始まりました',
    subMessage: '継続すると成長が見えてきます',
  },
} as const;

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get the Monday of the previous week (UTC)
 */
export function getLastWeekStartUTC(date: Date = new Date()): string {
  const thisWeekStart = getWeekStartUTC(date);
  const lastWeekDate = new Date(thisWeekStart + 'T00:00:00Z');
  lastWeekDate.setUTCDate(lastWeekDate.getUTCDate() - 7);
  return getUTCDateString(lastWeekDate);
}

/**
 * Count unique active days within a date range
 * @param eventDates Array of event dates (YYYY-MM-DD)
 * @param weekStart Start of the week (Monday, YYYY-MM-DD)
 * @returns Number of unique days with at least one event
 */
export function countActiveDaysInWeek(eventDates: string[], weekStart: string): number {
  const weekStartDate = new Date(weekStart + 'T00:00:00Z');
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);

  const uniqueDays = new Set<string>();

  for (const dateStr of eventDates) {
    const eventDate = new Date(dateStr + 'T00:00:00Z');
    if (eventDate >= weekStartDate && eventDate < weekEndDate) {
      uniqueDays.add(dateStr);
    }
  }

  return uniqueDays.size;
}

/**
 * Count events within a date range
 */
export function countEventsInWeek(eventDates: string[], weekStart: string): number {
  const weekStartDate = new Date(weekStart + 'T00:00:00Z');
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 7);

  let count = 0;
  for (const dateStr of eventDates) {
    const eventDate = new Date(dateStr + 'T00:00:00Z');
    if (eventDate >= weekStartDate && eventDate < weekEndDate) {
      count++;
    }
  }

  return count;
}

/**
 * Count total unique active days (lifetime)
 */
export function countLifetimeActiveDays(eventDates: string[]): number {
  return new Set(eventDates).size;
}

/**
 * Calculate the most frequent reference ID (topFocus)
 */
export function calculateTopFocus(
  referenceIds: string[]
): { label: string; count: number } | undefined {
  if (referenceIds.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const id of referenceIds) {
    if (id) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  if (counts.size === 0) return undefined;

  let topLabel = '';
  let topCount = 0;

  for (const [label, count] of counts) {
    if (count > topCount) {
      topLabel = label;
      topCount = count;
    }
  }

  return { label: topLabel, count: topCount };
}

/**
 * Generate message based on delta and context
 */
function generateMessage(
  deltaDays: number,
  activeDaysThisWeek: number,
  activeDaysLastWeek: number,
  lifetimeActiveDays: number
): { message: string; subMessage: string } {
  // Empty state: No events at all
  if (lifetimeActiveDays === 0) {
    return EMPTY_MESSAGES.NO_EVENTS;
  }

  // First week (no last week data)
  if (activeDaysLastWeek === 0 && activeDaysThisWeek > 0) {
    return EMPTY_MESSAGES.FIRST_WEEK;
  }

  // Only this week has data, last week is empty
  if (activeDaysLastWeek === 0 && activeDaysThisWeek === 0 && lifetimeActiveDays > 0) {
    return EMPTY_MESSAGES.THIS_WEEK_ONLY;
  }

  // Delta-based messages
  if (deltaDays > 1) {
    return GROWTH_MESSAGES.SIGNIFICANT_INCREASE(deltaDays);
  }

  if (deltaDays === 1) {
    return GROWTH_MESSAGES.SLIGHT_INCREASE;
  }

  if (deltaDays === 0) {
    return GROWTH_MESSAGES.MAINTAINED;
  }

  if (deltaDays === -1) {
    return SLOW_MESSAGES.SLIGHT_DECREASE;
  }

  // deltaDays < -1
  return SLOW_MESSAGES.SIGNIFICANT_DECREASE;
}

// ============================================================
// Main Function
// ============================================================

/**
 * Build growth insights from event data
 *
 * @spec-lock 日付はUTC基準
 * @spec-lock 同日複数イベント → activeDaysは1
 * @spec-lock データが0件 → messageは空じゃない
 */
export function buildGrowthInsights(input: GrowthInsightsInput): GrowthInsights {
  const { eventDates, referenceIds = [], today = getUTCDateString() } = input;

  const todayDate = new Date(today + 'T00:00:00Z');
  const thisWeekStart = getWeekStartUTC(todayDate);
  const lastWeekStart = getLastWeekStartUTC(todayDate);

  // Calculate active days
  const activeDaysThisWeek = countActiveDaysInWeek(eventDates, thisWeekStart);
  const activeDaysLastWeek = countActiveDaysInWeek(eventDates, lastWeekStart);
  const deltaDays = activeDaysThisWeek - activeDaysLastWeek;

  // Calculate event count
  const eventsThisWeek = countEventsInWeek(eventDates, thisWeekStart);

  // Calculate lifetime
  const lifetimeActiveDays = countLifetimeActiveDays(eventDates);

  // Calculate top focus
  const topFocus = calculateTopFocus(referenceIds);

  // Generate message
  const { message, subMessage } = generateMessage(
    deltaDays,
    activeDaysThisWeek,
    activeDaysLastWeek,
    lifetimeActiveDays
  );

  return {
    activeDaysThisWeek,
    activeDaysLastWeek,
    deltaDays,
    eventsThisWeek,
    lifetimeActiveDays,
    topFocus,
    message,
    subMessage,
  };
}
