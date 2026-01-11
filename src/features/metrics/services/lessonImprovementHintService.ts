/**
 * Lesson Improvement Hint Service
 *
 * Pure functions for generating improvement hints for lessons with low follow-up rates.
 * Analyzes why a lesson may have low engagement and provides actionable suggestions.
 *
 * ## 仕様（固定）
 *
 * ### 判定ルール（優先度順、1つだけ返す）
 * 1. originCount < 5 → LOW_SAMPLE
 * 2. followUpRate < 0.2 && next_lesson_opened === 0 → NEXT_LESSON_WEAK
 * 3. review_started + quiz_started + note_created === 0 → CTA_MISSING
 * 4. followUpRate < 0.3 → LOW_ENGAGEMENT
 * 5. それ以外 → null（ヒントなし）
 */

import type { FollowUpEventType } from '../constants';

/**
 * Input data for hint generation
 */
export interface LessonEffectiveness {
  lessonSlug: string;
  originCount: number;
  followUpRate: number; // 0-100 as percentage
  followUpCounts: Partial<Record<FollowUpEventType, number>>;
}

/**
 * Hint type classification
 */
export type HintType = 'LOW_SAMPLE' | 'NEXT_LESSON_WEAK' | 'CTA_MISSING' | 'LOW_ENGAGEMENT';

/**
 * Improvement hint output
 */
export interface LessonImprovementHint {
  type: HintType;
  message: string;
}

/**
 * Hint messages (Japanese)
 */
const HINT_MESSAGES: Record<HintType, string> = {
  LOW_SAMPLE: 'サンプル数が少ないため判断保留',
  NEXT_LESSON_WEAK: '次のレッスン導線が弱い可能性',
  CTA_MISSING: '復習・クイズ・ノート導線が不足',
  LOW_ENGAGEMENT: '内容理解後の行動につながっていない可能性',
};

/**
 * Threshold constants
 */
const MIN_SAMPLE_SIZE = 5;
const LOW_FOLLOWUP_RATE_THRESHOLD = 20; // 20%
const MEDIUM_FOLLOWUP_RATE_THRESHOLD = 30; // 30%

/**
 * Generate improvement hint for a lesson
 *
 * @spec-lock
 * - Returns exactly ONE hint based on priority rules
 * - Returns null if lesson has good follow-up rate (>= 30%)
 * - Priority: LOW_SAMPLE > NEXT_LESSON_WEAK > CTA_MISSING > LOW_ENGAGEMENT
 */
export function generateLessonHint(
  effectiveness: LessonEffectiveness
): LessonImprovementHint | null {
  const { originCount, followUpRate, followUpCounts } = effectiveness;

  // Rule 1: Low sample size (highest priority)
  if (originCount < MIN_SAMPLE_SIZE) {
    return {
      type: 'LOW_SAMPLE',
      message: HINT_MESSAGES.LOW_SAMPLE,
    };
  }

  // Rule 2: Next lesson weak (rate < 20% AND no next_lesson_opened)
  const nextLessonOpened = followUpCounts.next_lesson_opened ?? 0;
  if (followUpRate < LOW_FOLLOWUP_RATE_THRESHOLD && nextLessonOpened === 0) {
    return {
      type: 'NEXT_LESSON_WEAK',
      message: HINT_MESSAGES.NEXT_LESSON_WEAK,
    };
  }

  // Rule 3: CTA missing (no review/quiz/note activity)
  const reviewStarted = followUpCounts.review_started ?? 0;
  const quizStarted = followUpCounts.quiz_started ?? 0;
  const noteCreated = followUpCounts.note_created ?? 0;
  if (reviewStarted + quizStarted + noteCreated === 0) {
    return {
      type: 'CTA_MISSING',
      message: HINT_MESSAGES.CTA_MISSING,
    };
  }

  // Rule 4: Low engagement (rate < 30%)
  if (followUpRate < MEDIUM_FOLLOWUP_RATE_THRESHOLD) {
    return {
      type: 'LOW_ENGAGEMENT',
      message: HINT_MESSAGES.LOW_ENGAGEMENT,
    };
  }

  // No hint needed for good performers
  return null;
}

/**
 * Generate hints for multiple lessons
 *
 * @spec-lock
 * - Returns a Map keyed by lessonSlug
 * - Each lesson gets at most one hint
 */
export function generateLessonHints(
  effectivenessData: LessonEffectiveness[]
): Map<string, LessonImprovementHint> {
  const hints = new Map<string, LessonImprovementHint>();

  for (const data of effectivenessData) {
    const hint = generateLessonHint(data);
    if (hint) {
      hints.set(data.lessonSlug, hint);
    }
  }

  return hints;
}
