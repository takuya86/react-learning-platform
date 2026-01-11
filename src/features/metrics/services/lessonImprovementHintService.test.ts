import { describe, it, expect } from 'vitest';
import {
  generateLessonHint,
  generateLessonHints,
  type LessonEffectiveness,
} from './lessonImprovementHintService';

describe('lessonImprovementHintService', () => {
  describe('generateLessonHint', () => {
    /**
     * [spec-lock] LOW_SAMPLE は最優先で返る
     */
    it('returns LOW_SAMPLE when originCount < 5', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 4,
        followUpRate: 50, // Good rate, but low sample
        followUpCounts: {
          next_lesson_opened: 2,
          review_started: 1,
          quiz_started: 1,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint).toEqual({
        type: 'LOW_SAMPLE',
        message: 'サンプル数が少ないため判断保留',
      });
    });

    /**
     * [spec-lock] originCount = 0 でも LOW_SAMPLE
     */
    it('returns LOW_SAMPLE when originCount is 0', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 0,
        followUpRate: 0,
        followUpCounts: {},
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('LOW_SAMPLE');
    });

    /**
     * [spec-lock] NEXT_LESSON_WEAK: followUpRate < 20% かつ next_lesson_opened === 0
     */
    it('returns NEXT_LESSON_WEAK when rate < 20% and no next lesson opened', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 15, // 15% < 20%
        followUpCounts: {
          next_lesson_opened: 0,
          review_started: 1,
          quiz_started: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint).toEqual({
        type: 'NEXT_LESSON_WEAK',
        message: '次のレッスン導線が弱い可能性',
      });
    });

    /**
     * [spec-lock] NEXT_LESSON_WEAK: followUpRate = 19 (< 20) and next_lesson_opened missing
     */
    it('returns NEXT_LESSON_WEAK when next_lesson_opened is missing from counts', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 19,
        followUpCounts: {
          review_started: 1,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('NEXT_LESSON_WEAK');
    });

    /**
     * [spec-lock] NEXT_LESSON_WEAK は rate >= 20 では発火しない
     */
    it('does not return NEXT_LESSON_WEAK when rate >= 20%', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 20, // Exactly 20%, not < 20
        followUpCounts: {
          next_lesson_opened: 0,
          review_started: 0,
          quiz_started: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      // Should fall through to CTA_MISSING, not NEXT_LESSON_WEAK
      expect(hint?.type).not.toBe('NEXT_LESSON_WEAK');
    });

    /**
     * [spec-lock] CTA_MISSING: review + quiz + note = 0
     */
    it('returns CTA_MISSING when no review/quiz/note activity', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25, // 25% >= 20%, so NEXT_LESSON_WEAK doesn't apply
        followUpCounts: {
          next_lesson_opened: 3,
          review_started: 0,
          quiz_started: 0,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint).toEqual({
        type: 'CTA_MISSING',
        message: '復習・クイズ・ノート導線が不足',
      });
    });

    /**
     * [spec-lock] CTA_MISSING: counts が undefined の場合も 0 として扱う
     */
    it('returns CTA_MISSING when counts are missing (treated as 0)', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25,
        followUpCounts: {
          next_lesson_opened: 2,
          // review_started, quiz_started, note_created are missing
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('CTA_MISSING');
    });

    /**
     * [spec-lock] CTA_MISSING は review/quiz/note のいずれかがあれば発火しない
     */
    it('does not return CTA_MISSING when review_started > 0', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25,
        followUpCounts: {
          next_lesson_opened: 2,
          review_started: 1,
          quiz_started: 0,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).not.toBe('CTA_MISSING');
    });

    /**
     * [spec-lock] CTA_MISSING は quiz_started > 0 でも発火しない
     */
    it('does not return CTA_MISSING when quiz_started > 0', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25,
        followUpCounts: {
          next_lesson_opened: 0,
          review_started: 0,
          quiz_started: 1,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).not.toBe('CTA_MISSING');
    });

    /**
     * [spec-lock] CTA_MISSING は note_created > 0 でも発火しない
     */
    it('does not return CTA_MISSING when note_created > 0', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25,
        followUpCounts: {
          next_lesson_opened: 0,
          review_started: 0,
          quiz_started: 0,
          note_created: 1,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).not.toBe('CTA_MISSING');
    });

    /**
     * [spec-lock] LOW_ENGAGEMENT: followUpRate < 30%
     */
    it('returns LOW_ENGAGEMENT when rate < 30% and other conditions not met', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25, // 25% < 30%
        followUpCounts: {
          next_lesson_opened: 1,
          review_started: 1,
          quiz_started: 0,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint).toEqual({
        type: 'LOW_ENGAGEMENT',
        message: '内容理解後の行動につながっていない可能性',
      });
    });

    /**
     * [spec-lock] followUpRate >= 30% の場合は null（ヒントなし）
     */
    it('returns null when followUpRate >= 30%', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 30, // Exactly 30%
        followUpCounts: {
          next_lesson_opened: 1,
          review_started: 1,
          quiz_started: 1,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint).toBeNull();
    });

    /**
     * [spec-lock] 高パフォーマンスレッスンは null
     */
    it('returns null for high-performing lessons', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 100,
        followUpRate: 75, // 75% - good!
        followUpCounts: {
          next_lesson_opened: 50,
          review_started: 20,
          quiz_started: 30,
          note_created: 10,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint).toBeNull();
    });

    /**
     * [spec-lock] 優先度: LOW_SAMPLE > NEXT_LESSON_WEAK
     * LOW_SAMPLE の条件を満たす場合、NEXT_LESSON_WEAK の条件も満たしても LOW_SAMPLE を返す
     */
    it('returns LOW_SAMPLE over NEXT_LESSON_WEAK when both conditions met', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 3, // LOW_SAMPLE
        followUpRate: 10, // Also triggers NEXT_LESSON_WEAK conditions
        followUpCounts: {
          next_lesson_opened: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('LOW_SAMPLE');
    });

    /**
     * [spec-lock] 優先度: NEXT_LESSON_WEAK > CTA_MISSING
     */
    it('returns NEXT_LESSON_WEAK over CTA_MISSING when both conditions met', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 15, // < 20%
        followUpCounts: {
          next_lesson_opened: 0,
          review_started: 0,
          quiz_started: 0,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('NEXT_LESSON_WEAK');
    });

    /**
     * [spec-lock] 優先度: CTA_MISSING > LOW_ENGAGEMENT
     */
    it('returns CTA_MISSING over LOW_ENGAGEMENT when both conditions met', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 25, // < 30% but >= 20%
        followUpCounts: {
          next_lesson_opened: 2,
          review_started: 0,
          quiz_started: 0,
          note_created: 0,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('CTA_MISSING');
    });

    /**
     * [spec-lock] followUpRate = 29 は LOW_ENGAGEMENT
     */
    it('returns LOW_ENGAGEMENT when rate is 29%', () => {
      const effectiveness: LessonEffectiveness = {
        lessonSlug: 'lesson-1',
        originCount: 10,
        followUpRate: 29,
        followUpCounts: {
          next_lesson_opened: 1,
          review_started: 1,
        },
      };

      const hint = generateLessonHint(effectiveness);
      expect(hint?.type).toBe('LOW_ENGAGEMENT');
    });
  });

  describe('generateLessonHints', () => {
    /**
     * [spec-lock] 複数レッスンのヒント生成
     */
    it('generates hints for multiple lessons', () => {
      const data: LessonEffectiveness[] = [
        {
          lessonSlug: 'lesson-1',
          originCount: 3,
          followUpRate: 0,
          followUpCounts: {},
        },
        {
          lessonSlug: 'lesson-2',
          originCount: 10,
          followUpRate: 15,
          followUpCounts: { next_lesson_opened: 0, review_started: 1 },
        },
        {
          lessonSlug: 'lesson-3',
          originCount: 10,
          followUpRate: 80,
          followUpCounts: { next_lesson_opened: 5, review_started: 3 },
        },
      ];

      const hints = generateLessonHints(data);

      expect(hints.size).toBe(2); // lesson-3 has no hint
      expect(hints.get('lesson-1')?.type).toBe('LOW_SAMPLE');
      expect(hints.get('lesson-2')?.type).toBe('NEXT_LESSON_WEAK');
      expect(hints.has('lesson-3')).toBe(false);
    });

    /**
     * [spec-lock] 空配列の場合は空Map
     */
    it('returns empty map for empty input', () => {
      const hints = generateLessonHints([]);
      expect(hints.size).toBe(0);
    });

    /**
     * [spec-lock] 全レッスンがヒント不要の場合は空Map
     */
    it('returns empty map when all lessons have good rates', () => {
      const data: LessonEffectiveness[] = [
        {
          lessonSlug: 'lesson-1',
          originCount: 10,
          followUpRate: 50,
          followUpCounts: { review_started: 5 },
        },
        {
          lessonSlug: 'lesson-2',
          originCount: 20,
          followUpRate: 80,
          followUpCounts: { quiz_started: 10, note_created: 6 },
        },
      ];

      const hints = generateLessonHints(data);
      expect(hints.size).toBe(0);
    });
  });
});
