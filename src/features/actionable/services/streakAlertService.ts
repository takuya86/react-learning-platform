/**
 * Streak Alert Service
 *
 * streak維持のための強調表示ロジック
 *
 * ## 仕様
 * - ACTIVE_YESTERDAY: 今日学習するとstreak継続（warning）
 * - ACTIVE_TODAY: streak継続中（success）
 * - streak=0, BROKEN: 表示しない
 */

import type { StreakReasonCode } from '@/features/metrics/services/metricsExplainService';

export type StreakAlertType = 'warning' | 'success' | 'none';
export type StreakAlertIcon = 'check' | 'alert-triangle' | 'flame' | '';

export interface StreakAlertInfo {
  type: StreakAlertType;
  show: boolean;
  message: string;
  subMessage: string | null;
  iconName: StreakAlertIcon;
}

/**
 * Build streak alert info based on reason code
 */
export function buildStreakAlert(
  reasonCode: StreakReasonCode,
  currentStreak: number
): StreakAlertInfo {
  // Don't show for broken or no activity
  if (
    currentStreak === 0 ||
    reasonCode === 'BROKEN' ||
    reasonCode === 'NO_ACTIVITY_YET' ||
    reasonCode === 'UNKNOWN'
  ) {
    return {
      type: 'none',
      show: false,
      message: '',
      subMessage: null,
      iconName: '',
    };
  }

  // Active today - success
  if (reasonCode === 'ACTIVE_TODAY') {
    return {
      type: 'success',
      show: true,
      message: '今日学習済み',
      subMessage: `${currentStreak}日連続 継続中`,
      iconName: 'check',
    };
  }

  // Active yesterday - warning (need to study today)
  if (reasonCode === 'ACTIVE_YESTERDAY') {
    return {
      type: 'warning',
      show: true,
      message: '今日学習するとstreak継続',
      subMessage: `現在${currentStreak}日連続`,
      iconName: 'alert-triangle',
    };
  }

  // Recovered - success
  if (reasonCode === 'RECOVERED') {
    return {
      type: 'success',
      show: true,
      message: '学習再開しました！',
      subMessage: '新しいstreakのスタートです',
      iconName: 'flame',
    };
  }

  return {
    type: 'none',
    show: false,
    message: '',
    subMessage: null,
    iconName: '',
  };
}
