import { describe, it, expect } from 'vitest';
import {
  computeImpactWeight,
  computeStrategyWeight,
  computePriorityScore,
  rankImprovements,
  type ImprovementItem,
} from './priorityScoreService';
import { PRIORITY_SCORE_VERSION } from '../constants';

describe('priorityScoreService', () => {
  describe('computeImpactWeight', () => {
    it('should compute impact weight using log10(originCount + 1)', () => {
      // log10(0 + 1) = 0 → clamped to 0.5
      expect(computeImpactWeight(0)).toBe(0.5);

      // log10(9 + 1) = 1.0
      expect(computeImpactWeight(9)).toBe(1.0);

      // log10(99 + 1) = 2.0
      expect(computeImpactWeight(99)).toBe(2.0);

      // log10(999 + 1) = 3.0 → clamped to 2.0
      expect(computeImpactWeight(999)).toBe(2.0);
    });

    it('should be monotonically increasing (before clamping)', () => {
      // Smaller originCount should have smaller or equal weight
      const weight1 = computeImpactWeight(5);
      const weight2 = computeImpactWeight(10);
      const weight3 = computeImpactWeight(50);

      expect(weight1).toBeLessThan(weight2);
      expect(weight2).toBeLessThan(weight3);
    });

    it('should clamp to [0.5, 2.0] range', () => {
      // Very small originCount
      expect(computeImpactWeight(0)).toBeGreaterThanOrEqual(0.5);
      expect(computeImpactWeight(1)).toBeGreaterThanOrEqual(0.5);

      // Very large originCount
      expect(computeImpactWeight(1000)).toBeLessThanOrEqual(2.0);
      expect(computeImpactWeight(10000)).toBeLessThanOrEqual(2.0);
    });
  });

  describe('computeStrategyWeight', () => {
    it('should return correct weight for beginner', () => {
      expect(computeStrategyWeight('beginner')).toBe(1.2);
    });

    it('should return correct weight for intermediate', () => {
      expect(computeStrategyWeight('intermediate')).toBe(1.0);
    });

    it('should return correct weight for advanced', () => {
      expect(computeStrategyWeight('advanced')).toBe(0.9);
    });

    it('should prioritize beginner > intermediate > advanced', () => {
      const beginnerWeight = computeStrategyWeight('beginner');
      const intermediateWeight = computeStrategyWeight('intermediate');
      const advancedWeight = computeStrategyWeight('advanced');

      expect(beginnerWeight).toBeGreaterThan(intermediateWeight);
      expect(intermediateWeight).toBeGreaterThan(advancedWeight);
    });

    it('should return correct weights for all difficulty levels', () => {
      // All difficulty levels should return their specified weights
      expect(computeStrategyWeight('beginner')).toBe(1.2);
      expect(computeStrategyWeight('intermediate')).toBe(1.0);
      expect(computeStrategyWeight('advanced')).toBe(0.9);
    });
  });

  describe('computePriorityScore', () => {
    it('should compute score as roiScore * impactWeight * strategyWeight', () => {
      const roiScore = 50; // 50% improvement potential
      const originCount = 9; // log10(10) = 1.0 → impactWeight = 1.0
      const difficulty = 'intermediate'; // strategyWeight = 1.0

      const result = computePriorityScore(roiScore, originCount, difficulty);

      expect(result.score).toBe(50); // 50 * 1.0 * 1.0
      expect(result.breakdown.roiScore).toBe(50);
      expect(result.breakdown.impactWeight).toBe(1.0);
      expect(result.breakdown.strategyWeight).toBe(1.0);
      expect(result.version).toBe(PRIORITY_SCORE_VERSION);
    });

    it('should amplify score for beginner lessons', () => {
      const roiScore = 50;
      const originCount = 9;

      const beginnerResult = computePriorityScore(roiScore, originCount, 'beginner');
      const intermediateResult = computePriorityScore(roiScore, originCount, 'intermediate');

      // beginner has 1.2x weight, intermediate has 1.0x
      expect(beginnerResult.score).toBeGreaterThan(intermediateResult.score);
      expect(beginnerResult.score).toBeCloseTo(50 * 1.0 * 1.2, 2);
    });

    it('should reduce score for advanced lessons', () => {
      const roiScore = 50;
      const originCount = 9;

      const advancedResult = computePriorityScore(roiScore, originCount, 'advanced');
      const intermediateResult = computePriorityScore(roiScore, originCount, 'intermediate');

      // advanced has 0.9x weight, intermediate has 1.0x
      expect(advancedResult.score).toBeLessThan(intermediateResult.score);
      expect(advancedResult.score).toBeCloseTo(50 * 1.0 * 0.9, 2);
    });

    it('should amplify score for high originCount', () => {
      const roiScore = 50;
      const difficulty = 'intermediate';

      const lowCountResult = computePriorityScore(roiScore, 9, difficulty); // impactWeight = 1.0
      const highCountResult = computePriorityScore(roiScore, 99, difficulty); // impactWeight = 2.0

      expect(highCountResult.score).toBeGreaterThan(lowCountResult.score);
      expect(highCountResult.score).toBeCloseTo(50 * 2.0 * 1.0, 2);
    });
  });

  describe('rankImprovements', () => {
    it('should rank by score DESC when all have sufficient samples', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'lesson-a',
          lessonTitle: 'Lesson A',
          roiScore: 30,
          originCount: 10,
          followUpRate: 0.5,
          difficulty: 'intermediate',
        },
        {
          lessonSlug: 'lesson-b',
          lessonTitle: 'Lesson B',
          roiScore: 50, // Higher ROI
          originCount: 10,
          followUpRate: 0.3,
          difficulty: 'intermediate',
        },
        {
          lessonSlug: 'lesson-c',
          lessonTitle: 'Lesson C',
          roiScore: 40,
          originCount: 10,
          followUpRate: 0.4,
          difficulty: 'intermediate',
        },
      ];

      const ranked = rankImprovements(items);

      // Should be ranked: B (50) > C (40) > A (30)
      expect(ranked[0].lessonSlug).toBe('lesson-b');
      expect(ranked[1].lessonSlug).toBe('lesson-c');
      expect(ranked[2].lessonSlug).toBe('lesson-a');
    });

    it('should move isLowSample items to the end', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'lesson-low',
          lessonTitle: 'Low Sample',
          roiScore: 80, // High ROI but low sample
          originCount: 3, // < 5
          followUpRate: 0.2,
          difficulty: 'intermediate',
        },
        {
          lessonSlug: 'lesson-good',
          lessonTitle: 'Good Sample',
          roiScore: 40, // Lower ROI but good sample
          originCount: 20,
          followUpRate: 0.4,
          difficulty: 'intermediate',
        },
      ];

      const ranked = rankImprovements(items);

      // lesson-good should be first despite lower ROI
      expect(ranked[0].lessonSlug).toBe('lesson-good');
      expect(ranked[0].isLowSample).toBe(false);

      expect(ranked[1].lessonSlug).toBe('lesson-low');
      expect(ranked[1].isLowSample).toBe(true);
    });

    it('should use roiScore as secondary sort when scores are equal', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'lesson-a',
          lessonTitle: 'Lesson A',
          roiScore: 30,
          originCount: 9, // Same impactWeight
          followUpRate: 0.5,
          difficulty: 'intermediate', // Same strategyWeight
        },
        {
          lessonSlug: 'lesson-b',
          lessonTitle: 'Lesson B',
          roiScore: 50, // Higher ROI
          originCount: 9,
          followUpRate: 0.3,
          difficulty: 'intermediate',
        },
      ];

      const ranked = rankImprovements(items);

      // Same impactWeight and strategyWeight, so sort by roiScore
      expect(ranked[0].lessonSlug).toBe('lesson-b'); // Higher roiScore
      expect(ranked[1].lessonSlug).toBe('lesson-a');
    });

    it('should use originCount as tertiary sort when scores and roiScore are equal', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'lesson-a',
          lessonTitle: 'Lesson A',
          roiScore: 50,
          originCount: 10,
          followUpRate: 0.5,
          difficulty: 'intermediate',
        },
        {
          lessonSlug: 'lesson-b',
          lessonTitle: 'Lesson B',
          roiScore: 50, // Same ROI
          originCount: 20, // Higher originCount
          followUpRate: 0.5,
          difficulty: 'intermediate',
        },
      ];

      const ranked = rankImprovements(items);

      // Same roiScore, but lesson-b has higher originCount
      expect(ranked[0].lessonSlug).toBe('lesson-b');
      expect(ranked[1].lessonSlug).toBe('lesson-a');
    });

    it('should use lessonSlug alphabetically as quaternary sort', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'react-hooks',
          lessonTitle: 'React Hooks',
          roiScore: 50,
          originCount: 10,
          followUpRate: 0.5,
          difficulty: 'intermediate',
        },
        {
          lessonSlug: 'jsx-basics',
          lessonTitle: 'JSX Basics',
          roiScore: 50, // Same ROI
          originCount: 10, // Same originCount
          followUpRate: 0.5,
          difficulty: 'intermediate',
        },
        {
          lessonSlug: 'state-management',
          lessonTitle: 'State Management',
          roiScore: 50,
          originCount: 10,
          followUpRate: 0.5,
          difficulty: 'intermediate',
        },
      ];

      const ranked = rankImprovements(items);

      // Alphabetical order: jsx-basics, react-hooks, state-management
      expect(ranked[0].lessonSlug).toBe('jsx-basics');
      expect(ranked[1].lessonSlug).toBe('react-hooks');
      expect(ranked[2].lessonSlug).toBe('state-management');
    });

    it('should preserve hintType and issue information', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'lesson-a',
          lessonTitle: 'Lesson A',
          roiScore: 50,
          originCount: 10,
          followUpRate: 0.3,
          difficulty: 'beginner',
          hintType: 'LOW_ENGAGEMENT',
          issueNumber: 123,
          issueUrl: 'https://github.com/owner/repo/issues/123',
        },
      ];

      const ranked = rankImprovements(items);

      expect(ranked[0].hintType).toBe('LOW_ENGAGEMENT');
      expect(ranked[0].issueNumber).toBe(123);
      expect(ranked[0].issueUrl).toBe('https://github.com/owner/repo/issues/123');
    });

    it('should handle missing optional fields gracefully', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'lesson-a',
          lessonTitle: 'Lesson A',
          roiScore: 50,
          originCount: 10,
          followUpRate: 0.3,
          difficulty: 'intermediate',
          // No hintType, issueNumber, issueUrl, tags
        },
      ];

      const ranked = rankImprovements(items);

      expect(ranked[0].hintType).toBeNull();
      expect(ranked[0].issueNumber).toBeNull();
      expect(ranked[0].issueUrl).toBeNull();
    });

    it('should correctly handle mixed priority scenarios', () => {
      const items: ImprovementItem[] = [
        {
          lessonSlug: 'beginner-high-roi',
          lessonTitle: 'Beginner High ROI',
          roiScore: 60,
          originCount: 50,
          followUpRate: 0.2,
          difficulty: 'beginner', // 1.2x strategy weight
        },
        {
          lessonSlug: 'advanced-high-roi',
          lessonTitle: 'Advanced High ROI',
          roiScore: 60,
          originCount: 50,
          followUpRate: 0.2,
          difficulty: 'advanced', // 0.9x strategy weight
        },
        {
          lessonSlug: 'low-sample-high-roi',
          lessonTitle: 'Low Sample',
          roiScore: 80, // Highest ROI
          originCount: 3, // Low sample
          followUpRate: 0.1,
          difficulty: 'beginner',
        },
      ];

      const ranked = rankImprovements(items);

      // beginner-high-roi should be first (1.2x weight)
      expect(ranked[0].lessonSlug).toBe('beginner-high-roi');
      expect(ranked[0].isLowSample).toBe(false);

      // advanced-high-roi should be second (0.9x weight)
      expect(ranked[1].lessonSlug).toBe('advanced-high-roi');
      expect(ranked[1].isLowSample).toBe(false);

      // low-sample should be last despite highest ROI
      expect(ranked[2].lessonSlug).toBe('low-sample-high-roi');
      expect(ranked[2].isLowSample).toBe(true);
    });
  });
});
