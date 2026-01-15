/**
 * Intervention Service
 *
 * 「今、何を出すべきか」を1つだけ決める
 *
 * ## 判定優先順位（仕様固定）
 * 優先順位は constants.ts で一元管理
 *
 * ## 設計方針
 * - 責めない・押し付けない・自然に戻す
 * - 赤/警告アイコン禁止
 * - 行動を1つだけ提示
 */

import type { HabitState } from './habitScoreService';
import type { StreakExplain, WeeklyGoalExplain } from './metricsExplainService';
import {
  INTERVENTION_CTA_TEXT,
  INTERVENTION_ICONS,
  POSITIVE_LONG_STREAK_THRESHOLD,
  LOGGABLE_INTERVENTION_TYPES,
  type InterventionIconName,
} from '../constants';

// ============================================================
// Types
// ============================================================

export type InterventionType = 'STREAK_RESCUE' | 'WEEKLY_CATCHUP' | 'POSITIVE';

export interface StreakRescueIntervention {
  type: 'STREAK_RESCUE';
  message: string;
  subMessage: string;
  ctaText: string;
  iconName: InterventionIconName;
}

export interface WeeklyCatchupIntervention {
  type: 'WEEKLY_CATCHUP';
  message: string;
  subMessage: string;
  ctaText: string;
  iconName: InterventionIconName;
}

export interface PositiveIntervention {
  type: 'POSITIVE';
  message: string;
  subMessage: string;
  iconName: InterventionIconName;
}

export type Intervention =
  | StreakRescueIntervention
  | WeeklyCatchupIntervention
  | PositiveIntervention
  | null;

export interface BuildInterventionParams {
  habitState: HabitState;
  streakExplain: StreakExplain;
  weeklyExplain: WeeklyGoalExplain;
}

// ============================================================
// Intervention Builder
// ============================================================

/**
 * Determine if streak is at risk
 * Risk = Yesterday was last activity and streak > 0
 */
export function isStreakAtRisk(streakExplain: StreakExplain): boolean {
  return streakExplain.reasonCode === 'ACTIVE_YESTERDAY' && streakExplain.currentStreak > 0;
}

/**
 * Determine if weekly goal is at risk
 * Risk = Behind on weekly progress
 */
export function isWeeklyAtRisk(weeklyExplain: WeeklyGoalExplain): boolean {
  return weeklyExplain.reasonCode === 'BEHIND';
}

/**
 * Build streak rescue intervention
 * Gentle message, no pressure
 */
function buildStreakRescue(streakExplain: StreakExplain): StreakRescueIntervention {
  const streak = streakExplain.currentStreak;

  return {
    type: 'STREAK_RESCUE',
    message: `${streak}日続いてる学習、今日も続けませんか？`,
    subMessage: '短い時間でも大丈夫です',
    ctaText: INTERVENTION_CTA_TEXT.STREAK_RESCUE,
    iconName: INTERVENTION_ICONS.STREAK_RESCUE,
  };
}

/**
 * Build weekly catchup intervention
 * Encouraging, not blaming
 */
function buildWeeklyCatchup(weeklyExplain: WeeklyGoalExplain): WeeklyCatchupIntervention {
  const remaining = weeklyExplain.goalPerWeek - weeklyExplain.completedDaysThisWeek;
  const remainingText = remaining > 0 ? `あと${remaining}回` : '';

  return {
    type: 'WEEKLY_CATCHUP',
    message: `今週の目標、${remainingText}で達成できます`,
    subMessage: '今日やれば十分間に合います',
    ctaText: INTERVENTION_CTA_TEXT.WEEKLY_CATCHUP,
    iconName: INTERVENTION_ICONS.WEEKLY_CATCHUP,
  };
}

/**
 * Build positive reinforcement
 * Celebrate without being over the top
 */
function buildPositive(streakExplain: StreakExplain): PositiveIntervention {
  const streak = streakExplain.currentStreak;

  if (streak >= POSITIVE_LONG_STREAK_THRESHOLD) {
    return {
      type: 'POSITIVE',
      message: `${streak}日連続！素晴らしいペースです`,
      subMessage: 'この調子で続けましょう',
      iconName: INTERVENTION_ICONS.POSITIVE_LONG_STREAK,
    };
  }

  return {
    type: 'POSITIVE',
    message: '順調に学習できています',
    subMessage: '今日も頑張りましょう',
    iconName: INTERVENTION_ICONS.POSITIVE,
  };
}

/**
 * Build intervention based on habit state and metrics
 *
 * @spec-lock Priority order is fixed:
 * 1. danger + streak risk → STREAK_RESCUE
 * 2. warning + weekly risk → WEEKLY_CATCHUP
 * 3. stable → POSITIVE
 * 4. otherwise → null
 */
export function buildIntervention(params: BuildInterventionParams): Intervention {
  const { habitState, streakExplain, weeklyExplain } = params;

  // Priority 1: Danger + Streak at risk → Streak Rescue
  if (habitState === 'danger' && isStreakAtRisk(streakExplain)) {
    return buildStreakRescue(streakExplain);
  }

  // Priority 2: Warning + Weekly at risk → Weekly Catchup
  if (habitState === 'warning' && isWeeklyAtRisk(weeklyExplain)) {
    return buildWeeklyCatchup(weeklyExplain);
  }

  // Priority 3: Stable → Positive reinforcement
  if (habitState === 'stable') {
    return buildPositive(streakExplain);
  }

  // For danger without streak risk, or warning without weekly risk,
  // also check for alternative interventions
  if (habitState === 'danger') {
    // Danger but no streak to rescue - check weekly
    if (isWeeklyAtRisk(weeklyExplain)) {
      return buildWeeklyCatchup(weeklyExplain);
    }
  }

  if (habitState === 'warning') {
    // Warning but weekly not at risk - check streak
    if (isStreakAtRisk(streakExplain)) {
      return buildStreakRescue(streakExplain);
    }
  }

  // No intervention needed
  return null;
}

/**
 * Check if intervention has a CTA
 */
export function hasInterventionCta(intervention: Intervention): boolean {
  if (!intervention) return false;
  return intervention.type === 'STREAK_RESCUE' || intervention.type === 'WEEKLY_CATCHUP';
}

/**
 * Check if intervention should be logged
 * Only STREAK_RESCUE and WEEKLY_CATCHUP are logged (not POSITIVE)
 */
export function shouldLogIntervention(intervention: Intervention): boolean {
  if (!intervention) return false;
  return (LOGGABLE_INTERVENTION_TYPES as readonly string[]).includes(intervention.type);
}
