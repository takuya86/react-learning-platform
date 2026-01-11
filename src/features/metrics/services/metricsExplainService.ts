/**
 * Metrics Explain Service
 *
 * streak / weekly goal の「理由説明」を生成する純粋関数
 *
 * ## 仕様
 * - UTC基準
 * - 決定的（同じ入力で同じ出力）
 * - 「なぜその値か」がdetailsで追えること
 */

import { getUTCDateString, isSameDay, isYesterday, type LearningMetrics } from './metricsService';

// ============================================================
// Types
// ============================================================

export type StreakReasonCode =
  | 'NO_ACTIVITY_YET' // 学習データなし
  | 'ACTIVE_TODAY' // 今日学習済み
  | 'ACTIVE_YESTERDAY' // 昨日学習、今日はまだ
  | 'BROKEN' // 連続記録が途切れた
  | 'RECOVERED' // 途切れた後に復活
  | 'UNKNOWN';

export type WeeklyReasonCode =
  | 'ON_TRACK' // 順調
  | 'BEHIND' // 遅れ気味
  | 'ACHIEVED' // 達成済み
  | 'NO_GOAL' // 目標未設定/学習なし
  | 'UNKNOWN';

export interface StreakExplain {
  currentStreak: number;
  todayCount: number;
  lastActiveDateUTC: string | null;
  reasonCode: StreakReasonCode;
  message: string;
  details: string[];
}

export interface WeeklyGoalExplain {
  goalPerWeek: number;
  completedDaysThisWeek: number;
  weekStartUTC: string;
  weekEndUTC: string;
  reasonCode: WeeklyReasonCode;
  message: string;
  details: string[];
}

// ============================================================
// Streak Explain
// ============================================================

interface BuildStreakExplainParams {
  currentStreak: number;
  lastActivityDate: string | null;
  todayCount: number;
  todayUTC?: string;
}

/**
 * Build streak explanation
 *
 * ## Reason Codes
 * - NO_ACTIVITY_YET: lastActivityDate == null && todayCount == 0
 * - ACTIVE_TODAY: lastActivityDate == today
 * - ACTIVE_YESTERDAY: lastActivityDate == yesterday && todayCount == 0
 * - BROKEN: lastActivityDate < yesterday (2日以上前)
 * - RECOVERED: streak > 0 && 今日から学習再開
 */
export function buildStreakExplain(params: BuildStreakExplainParams): StreakExplain {
  const { currentStreak, lastActivityDate, todayCount, todayUTC = getUTCDateString() } = params;

  let reasonCode: StreakReasonCode;
  let message: string;
  const details: string[] = [];

  // Add basic details
  details.push(`本日の学習回数: ${todayCount}`);
  details.push(`最終学習日(UTC): ${lastActivityDate || 'なし'}`);

  // Determine reason code
  if (lastActivityDate === null && todayCount === 0) {
    reasonCode = 'NO_ACTIVITY_YET';
    message = 'まだ学習を始めていません。最初の一歩を踏み出しましょう！';
  } else if (lastActivityDate && isSameDay(lastActivityDate, todayUTC)) {
    reasonCode = 'ACTIVE_TODAY';
    message = '今日はすでに学習済みです。連続記録は維持されます。';
  } else if (lastActivityDate && isYesterday(lastActivityDate, todayUTC)) {
    reasonCode = 'ACTIVE_YESTERDAY';
    if (todayCount > 0) {
      message = '昨日に続き今日も学習しました！連続記録が伸びています。';
    } else {
      message = '昨日学習しました。今日も学習して連続記録を伸ばしましょう！';
    }
  } else if (lastActivityDate) {
    // lastActivityDate is more than 1 day ago
    const lastDate = new Date(lastActivityDate + 'T00:00:00Z');
    const today = new Date(todayUTC + 'T00:00:00Z');
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

    if (todayCount > 0 && currentStreak === 1) {
      reasonCode = 'RECOVERED';
      message = `${diffDays}日ぶりに学習を再開しました！新しい連続記録のスタートです。`;
    } else {
      reasonCode = 'BROKEN';
      message = `${diffDays}日間学習がありませんでした。今日から再開しましょう！`;
    }
    details.push(`経過日数: ${diffDays}日`);
  } else {
    // Edge case: lastActivityDate is null but todayCount > 0
    reasonCode = 'RECOVERED';
    message = '学習を始めました！連続記録のスタートです。';
  }

  details.push(`判定: ${reasonCode}`);

  return {
    currentStreak,
    todayCount,
    lastActiveDateUTC: lastActivityDate,
    reasonCode,
    message,
    details,
  };
}

// ============================================================
// Weekly Goal Explain
// ============================================================

interface BuildWeeklyGoalExplainParams {
  goalPerWeek: number;
  completedDaysThisWeek: number;
  weekStartUTC: string;
  todayUTC?: string;
}

/**
 * Get the end of the week (Sunday) from week start (Monday)
 */
function getWeekEndUTC(weekStartUTC: string): string {
  const start = new Date(weekStartUTC + 'T00:00:00Z');
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return getUTCDateString(end);
}

/**
 * Calculate days passed in the current week (1-7)
 */
function getDaysPassedInWeek(weekStartUTC: string, todayUTC: string): number {
  const start = new Date(weekStartUTC + 'T00:00:00Z');
  const today = new Date(todayUTC + 'T00:00:00Z');
  const diffMs = today.getTime() - start.getTime();
  const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  return Math.min(Math.max(daysPassed, 1), 7);
}

/**
 * Build weekly goal explanation
 *
 * ## Reason Codes
 * - ACHIEVED: completedDaysThisWeek >= goalPerWeek
 * - ON_TRACK: completedDaysThisWeek is on pace to achieve goal
 * - BEHIND: completedDaysThisWeek is behind pace
 * - NO_GOAL: goalPerWeek == 0 or completedDaysThisWeek == 0 (no activity)
 */
export function buildWeeklyGoalExplain(params: BuildWeeklyGoalExplainParams): WeeklyGoalExplain {
  const {
    goalPerWeek,
    completedDaysThisWeek,
    weekStartUTC,
    todayUTC = getUTCDateString(),
  } = params;

  const weekEndUTC = getWeekEndUTC(weekStartUTC);
  const daysPassed = getDaysPassedInWeek(weekStartUTC, todayUTC);
  const daysRemaining = 7 - daysPassed;
  const daysNeeded = goalPerWeek - completedDaysThisWeek;

  let reasonCode: WeeklyReasonCode;
  let message: string;
  const details: string[] = [];

  // Add basic details
  details.push(`週の範囲(UTC): ${weekStartUTC}〜${weekEndUTC}`);
  details.push(`学習日数: ${completedDaysThisWeek} / ${goalPerWeek}`);
  details.push(`週の経過日数: ${daysPassed}日目`);

  // Determine reason code
  if (goalPerWeek === 0) {
    reasonCode = 'NO_GOAL';
    message = '週間目標が設定されていません。';
  } else if (completedDaysThisWeek >= goalPerWeek) {
    reasonCode = 'ACHIEVED';
    message = '今週の目標を達成しました！素晴らしいです！';
  } else if (completedDaysThisWeek === 0) {
    reasonCode = 'BEHIND';
    message = '今週はまだ学習していません。最初の一歩を踏み出しましょう！';
  } else {
    // Check if on track
    // Expected progress: (daysPassed / 7) * goalPerWeek
    const expectedProgress = (daysPassed / 7) * goalPerWeek;

    if (completedDaysThisWeek >= expectedProgress) {
      reasonCode = 'ON_TRACK';
      if (daysNeeded <= daysRemaining) {
        message = `今週は順調です。目標まであと${daysNeeded}日です。`;
      } else {
        message = `順調に進んでいます。あと${daysNeeded}日で目標達成です。`;
      }
    } else {
      reasonCode = 'BEHIND';
      if (daysNeeded <= daysRemaining) {
        message = `少し遅れ気味です。残り${daysRemaining}日で${daysNeeded}日の学習が必要です。`;
      } else {
        message = `目標達成には残り${daysRemaining}日で${daysNeeded}日の学習が必要です。頑張りましょう！`;
      }
    }
  }

  details.push(`判定: ${reasonCode}`);

  return {
    goalPerWeek,
    completedDaysThisWeek,
    weekStartUTC,
    weekEndUTC,
    reasonCode,
    message,
    details,
  };
}

// ============================================================
// Combined Explain Builder
// ============================================================

export interface MetricsExplain {
  streak: StreakExplain;
  weekly: WeeklyGoalExplain;
}

interface BuildMetricsExplainParams {
  metrics: LearningMetrics;
  todayCount: number;
  todayUTC?: string;
}

/**
 * Build both streak and weekly goal explanations from metrics
 */
export function buildMetricsExplain(params: BuildMetricsExplainParams): MetricsExplain {
  const { metrics, todayCount, todayUTC = getUTCDateString() } = params;

  const streak = buildStreakExplain({
    currentStreak: metrics.streak,
    lastActivityDate: metrics.lastActivityDate,
    todayCount,
    todayUTC,
  });

  const weekly = buildWeeklyGoalExplain({
    goalPerWeek: metrics.weeklyGoal.target,
    completedDaysThisWeek: metrics.weeklyGoal.progress,
    weekStartUTC: metrics.weeklyGoal.weekStartDate,
    todayUTC,
  });

  return { streak, weekly };
}
