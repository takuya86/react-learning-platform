/**
 * ボーナス計算サービス
 * ストリークボーナスとXP計算を行う
 */

import { XP_VALUES, STREAK_BONUS_MULTIPLIERS, DEFAULT_MULTIPLIER } from '../constants';
import type { XPReason, XPGain, XPCalculationInput } from '../types';

/**
 * ストリークボーナス倍率を計算
 * [spec-lock] 倍率は constants.ts の STREAK_BONUS_MULTIPLIERS で定義
 *
 * - 30日+: 1.5倍 (+50%)
 * - 14日+: 1.3倍 (+30%)
 * - 7日+:  1.2倍 (+20%)
 * - 3日+:  1.1倍 (+10%)
 * - それ以外: 1.0倍
 */
export function getStreakBonusMultiplier(streak: number): number {
  for (const { minDays, multiplier } of STREAK_BONUS_MULTIPLIERS) {
    if (streak >= minDays) {
      return multiplier;
    }
  }
  return DEFAULT_MULTIPLIER;
}

/**
 * ストリークボーナスの説明を取得
 */
export function getStreakBonusDescription(streak: number): string | null {
  const multiplier = getStreakBonusMultiplier(streak);

  if (multiplier === DEFAULT_MULTIPLIER) {
    return null;
  }

  const bonusPercent = Math.round((multiplier - 1) * 100);
  return `${streak}日連続学習ボーナス +${bonusPercent}%`;
}

/**
 * アクション種別の基本XP値を取得
 */
export function getBaseXP(reason: XPReason): number {
  switch (reason) {
    case 'lesson_completed':
      return XP_VALUES.lesson_completed;
    case 'quiz_completed':
      return XP_VALUES.quiz_completed;
    case 'quiz_perfect':
      return XP_VALUES.quiz_perfect;
    case 'exercise_completed':
      return XP_VALUES.exercise_completed;
    case 'streak_bonus':
      return XP_VALUES.streak_bonus_per_day;
    default:
      return 0;
  }
}

/**
 * XP獲得量を計算
 * ストリークボーナス倍率を適用
 */
export function calculateXPGain(input: XPCalculationInput): XPGain {
  const baseAmount = getBaseXP(input.reason);
  const multiplier = getStreakBonusMultiplier(input.streak);
  const amount = Math.round(baseAmount * multiplier);

  return {
    amount,
    baseAmount,
    bonusMultiplier: multiplier,
    reason: input.reason,
    referenceId: input.referenceId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 複数のXP獲得を合計
 */
export function sumXPGains(gains: XPGain[]): number {
  return gains.reduce((sum, gain) => sum + gain.amount, 0);
}

/**
 * XP獲得理由の日本語表示
 */
export function getXPReasonLabel(reason: XPReason): string {
  switch (reason) {
    case 'lesson_completed':
      return 'レッスン完了';
    case 'quiz_completed':
      return 'クイズ完了';
    case 'quiz_perfect':
      return '満点ボーナス';
    case 'exercise_completed':
      return '演習完了';
    case 'streak_bonus':
      return '連続学習ボーナス';
    default:
      return 'その他';
  }
}

/**
 * 今日のストリークボーナスXPを計算
 * 3日以上の連続学習でボーナスXPを付与
 */
export function calculateDailyStreakBonus(streak: number): number {
  if (streak < 3) {
    return 0;
  }
  return XP_VALUES.streak_bonus_per_day;
}

/**
 * XP獲得のサマリーを生成
 */
export function formatXPGainSummary(gain: XPGain): string {
  const label = getXPReasonLabel(gain.reason);
  const bonusText =
    gain.bonusMultiplier > 1 ? ` (×${gain.bonusMultiplier.toFixed(1)}ボーナス)` : '';

  return `${label}: +${gain.amount}XP${bonusText}`;
}
