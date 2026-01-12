/**
 * Priority Score Service
 *
 * Pure functions for calculating priority scores for lesson improvements.
 * Combines ROI score with impact weight and strategy weight to prioritize
 * improvements that will have the greatest effect on learning outcomes.
 *
 * ## 仕様（固定）
 *
 * ### Priority Score Calculation
 * - score = roiScore * impactWeight * strategyWeight
 * - roiScore: Follow-up rate improvement (0-100)
 * - impactWeight: Impact based on originCount, log10(originCount + 1), clamped [0.5, 2.0]
 * - strategyWeight: Strategic priority based on difficulty
 *
 * ### Strategy Weights
 * - beginner: 1.2 (highest priority)
 * - intermediate: 1.0 (normal priority)
 * - advanced: 0.9 (lower priority)
 *
 * ### Ranking Rules
 * - Primary sort: score DESC
 * - Secondary sort: roiScore DESC
 * - Tertiary sort: originCount DESC
 * - Quaternary sort: lessonSlug ASC (alphabetical)
 * - isLowSample items (originCount < 5) are moved to the end
 */

import type { Difficulty } from '@/domain/types';
import type { HintType } from './lessonImprovementHintService';
import {
  PRIORITY_SCORE_VERSION,
  PRIORITY_IMPACT_CLAMP,
  PRIORITY_STRATEGY_WEIGHTS,
} from '../constants';

/**
 * Priority score breakdown for transparency
 */
export interface PriorityBreakdown {
  /** Base ROI score (0-100) */
  roiScore: number;
  /** Impact weight based on originCount [0.5, 2.0] */
  impactWeight: number;
  /** Strategy weight based on difficulty */
  strategyWeight: number;
}

/**
 * Priority score result
 */
export interface PriorityResult {
  /** Final priority score */
  score: number;
  /** Breakdown of score components */
  breakdown: PriorityBreakdown;
  /** Version of the priority algorithm */
  version: string;
}

/**
 * Ranked improvement item
 */
export interface RankedItem {
  /** Lesson slug */
  lessonSlug: string;
  /** Lesson title */
  lessonTitle: string;
  /** Priority score result */
  priority: PriorityResult;
  /** Number of lesson views */
  originCount: number;
  /** Follow-up rate (0-1) */
  followUpRate: number;
  /** Improvement hint type (if any) */
  hintType: HintType | null;
  /** GitHub issue number (if any) */
  issueNumber: number | null;
  /** GitHub issue URL (if any) */
  issueUrl: string | null;
  /** Whether sample size is too small (originCount < 5) */
  isLowSample: boolean;
}

/**
 * Input item for ranking
 */
export interface ImprovementItem {
  lessonSlug: string;
  lessonTitle: string;
  roiScore: number;
  originCount: number;
  followUpRate: number;
  difficulty: Difficulty;
  hintType?: HintType | null;
  issueNumber?: number | null;
  issueUrl?: string | null;
}

/**
 * Compute impact weight based on originCount
 *
 * @spec-lock
 * - Formula: log10(originCount + 1)
 * - Clamped to [0.5, 2.0]
 * - Monotonic: larger originCount → larger weight
 *
 * @param originCount Number of lesson views
 * @returns Impact weight [0.5, 2.0]
 */
export function computeImpactWeight(originCount: number): number {
  const rawWeight = Math.log10(originCount + 1);
  const clampedWeight = Math.max(
    PRIORITY_IMPACT_CLAMP.min,
    Math.min(PRIORITY_IMPACT_CLAMP.max, rawWeight)
  );
  return clampedWeight;
}

/**
 * Compute strategy weight based on difficulty and tags
 *
 * @spec-lock
 * - beginner: 1.2
 * - intermediate: 1.0
 * - advanced: 0.9
 * - tags are currently unused but kept for future extension
 *
 * @param difficulty Lesson difficulty level
 * @returns Strategy weight
 */
export function computeStrategyWeight(difficulty: Difficulty): number {
  // Future: could add weight adjustments based on specific tags
  return PRIORITY_STRATEGY_WEIGHTS[difficulty];
}

/**
 * Compute priority score for a lesson improvement
 *
 * @spec-lock
 * - score = roiScore * impactWeight * strategyWeight
 * - All components are positive
 * - Higher score = higher priority
 *
 * @param roiScore Base ROI score (0-100, typically follow-up rate improvement)
 * @param originCount Number of lesson views
 * @param difficulty Lesson difficulty level
 * @returns Priority score result with breakdown
 */
export function computePriorityScore(
  roiScore: number,
  originCount: number,
  difficulty: Difficulty
): PriorityResult {
  const impactWeight = computeImpactWeight(originCount);
  const strategyWeight = computeStrategyWeight(difficulty);
  const score = roiScore * impactWeight * strategyWeight;

  return {
    score,
    breakdown: {
      roiScore,
      impactWeight,
      strategyWeight,
    },
    version: PRIORITY_SCORE_VERSION,
  };
}

/**
 * Rank lesson improvements by priority score
 *
 * @spec-lock
 * - Sort order:
 *   1. isLowSample items go to the end
 *   2. score DESC (highest first)
 *   3. roiScore DESC (tie-breaker)
 *   4. originCount DESC (tie-breaker)
 *   5. lessonSlug ASC (alphabetical tie-breaker)
 * - isLowSample = originCount < 5
 *
 * @param items Array of improvement items to rank
 * @returns Sorted array of ranked items
 */
export function rankImprovements(items: ImprovementItem[]): RankedItem[] {
  // Build ranked items with priority scores
  const rankedItems: RankedItem[] = items.map((item) => {
    const priority = computePriorityScore(item.roiScore, item.originCount, item.difficulty);

    return {
      lessonSlug: item.lessonSlug,
      lessonTitle: item.lessonTitle,
      priority,
      originCount: item.originCount,
      followUpRate: item.followUpRate,
      hintType: item.hintType ?? null,
      issueNumber: item.issueNumber ?? null,
      issueUrl: item.issueUrl ?? null,
      isLowSample: item.originCount < 5,
    };
  });

  // Sort by priority rules
  rankedItems.sort((a, b) => {
    // Rule 1: isLowSample items go to the end
    if (a.isLowSample !== b.isLowSample) {
      return a.isLowSample ? 1 : -1;
    }

    // Rule 2: score DESC
    if (a.priority.score !== b.priority.score) {
      return b.priority.score - a.priority.score;
    }

    // Rule 3: roiScore DESC
    if (a.priority.breakdown.roiScore !== b.priority.breakdown.roiScore) {
      return b.priority.breakdown.roiScore - a.priority.breakdown.roiScore;
    }

    // Rule 4: originCount DESC
    if (a.originCount !== b.originCount) {
      return b.originCount - a.originCount;
    }

    // Rule 5: lessonSlug ASC (alphabetical)
    return a.lessonSlug.localeCompare(b.lessonSlug);
  });

  return rankedItems;
}
