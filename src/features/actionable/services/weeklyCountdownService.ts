/**
 * Weekly Countdown Service
 *
 * 週間目標の残り量計算ロジック
 *
 * ## 仕様
 * - 残りイベント数 = target - progress
 * - 残り日数 = 週末(日曜)までの日数
 * - 達成済み/目標未設定の場合は表示しない
 */

import { getUTCDateString } from '@/features/metrics/services/metricsService';
import type { WeeklyReasonCode } from '@/features/metrics/services/metricsExplainService';

export type CountdownType = 'on_track' | 'warning' | 'critical' | 'achieved' | 'none';

export interface WeeklyCountdownInfo {
  type: CountdownType;
  show: boolean;
  remainingDays: number;
  remainingEvents: number;
  goalTarget: number;
  progress: number;
  message: string;
  subMessage: string | null;
}

/**
 * Calculate remaining days until end of week (Sunday)
 */
export function getRemainingDaysInWeek(
  weekStartUTC: string,
  todayUTC: string = getUTCDateString()
): number {
  const start = new Date(weekStartUTC + 'T00:00:00Z');
  const today = new Date(todayUTC + 'T00:00:00Z');

  // Week ends on Sunday (6 days after Monday start)
  const weekEnd = new Date(start);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  const diffMs = weekEnd.getTime() - today.getTime();
  const remainingDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  return Math.max(0, remainingDays);
}

/**
 * Determine countdown type based on remaining events and days
 */
export function determineCountdownType(
  remainingEvents: number,
  remainingDays: number,
  reasonCode: WeeklyReasonCode
): CountdownType {
  // Achieved
  if (reasonCode === 'ACHIEVED' || remainingEvents <= 0) {
    return 'achieved';
  }

  // No goal set
  if (reasonCode === 'NO_GOAL') {
    return 'none';
  }

  // Critical: no time left and not achieved
  if (remainingDays === 0 && remainingEvents > 0) {
    return 'critical';
  }

  // Warning: might not make it
  if (remainingEvents > remainingDays) {
    return 'warning';
  }

  // On track
  return 'on_track';
}

/**
 * Build weekly countdown info
 */
export function buildWeeklyCountdown(params: {
  goalTarget: number;
  progress: number;
  weekStartUTC: string;
  reasonCode: WeeklyReasonCode;
  todayUTC?: string;
}): WeeklyCountdownInfo {
  const { goalTarget, progress, weekStartUTC, reasonCode, todayUTC = getUTCDateString() } = params;

  const remainingEvents = Math.max(0, goalTarget - progress);
  const remainingDays = getRemainingDaysInWeek(weekStartUTC, todayUTC);
  const type = determineCountdownType(remainingEvents, remainingDays, reasonCode);

  // Don't show if no goal or unknown
  if (type === 'none' || goalTarget === 0) {
    return {
      type: 'none',
      show: false,
      remainingDays,
      remainingEvents,
      goalTarget,
      progress,
      message: '',
      subMessage: null,
    };
  }

  let message = '';
  let subMessage: string | null = null;

  switch (type) {
    case 'achieved':
      message = '今週の目標達成！';
      subMessage = `${progress}日 / ${goalTarget}日`;
      break;
    case 'critical':
      message = '今日が最終日です';
      subMessage = `あと${remainingEvents}回の学習で達成`;
      break;
    case 'warning':
      message = `今週あと${remainingEvents}回の学習で目標達成`;
      subMessage = `残り${remainingDays}日`;
      break;
    case 'on_track':
      message = `今週あと${remainingEvents}回の学習で目標達成`;
      subMessage = `残り${remainingDays}日 - 順調です`;
      break;
  }

  return {
    type,
    show: true,
    remainingDays,
    remainingEvents,
    goalTarget,
    progress,
    message,
    subMessage,
  };
}
