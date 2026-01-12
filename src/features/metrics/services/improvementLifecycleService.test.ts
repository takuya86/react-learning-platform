/**
 * P5-2.1: Improvement Lifecycle Service Tests
 *
 * 判定ロジックのテスト (spec-lock):
 * - 評価回数が2回未満の場合
 * - 効果なし & ROIなし
 * - 効果あり but ROIマイナス
 * - 正常な継続ケース
 * - 境界値テスト
 */

import { describe, it, expect } from 'vitest';
import {
  determineLifecycle,
  buildCloseComment,
  buildRedesignComment,
  type ImprovementStatus,
} from './improvementLifecycleService';

describe('improvementLifecycleService', () => {
  describe('determineLifecycle', () => {
    it('evaluationCount < 2 → CONTINUE', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-001',
        priorityScore: 80,
        effectivenessDelta: -10,
        roi: -5,
        evaluationCount: 1,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      const result = determineLifecycle(status);

      expect(result.decision).toBe('CONTINUE');
      expect(result.reason).toBe('評価回数が不足');
      expect(result.shouldClose).toBe(false);
      expect(result.shouldAddLabel).toBe(false);
      expect(result.labelToAdd).toBe(null);
    });

    it('evaluationCount >= 2 && delta <= 0 && roi <= 0 → CLOSE_NO_EFFECT', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-002',
        priorityScore: 60,
        effectivenessDelta: -5,
        roi: -10,
        evaluationCount: 3,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      const result = determineLifecycle(status);

      expect(result.decision).toBe('CLOSE_NO_EFFECT');
      expect(result.reason).toBe('効果指標の改善が見られない');
      expect(result.shouldClose).toBe(true);
      expect(result.shouldAddLabel).toBe(false);
      expect(result.labelToAdd).toBe(null);
    });

    it('evaluationCount >= 2 && delta > 0 && roi < 0 → REDESIGN_REQUIRED', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-003',
        priorityScore: 70,
        effectivenessDelta: 15,
        roi: -8,
        evaluationCount: 2,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      const result = determineLifecycle(status);

      expect(result.decision).toBe('REDESIGN_REQUIRED');
      expect(result.reason).toBe('効果はあるがROIが負');
      expect(result.shouldClose).toBe(false);
      expect(result.shouldAddLabel).toBe(true);
      expect(result.labelToAdd).toBe('needs-redesign');
    });

    it('evaluationCount >= 2 && delta > 0 && roi >= 0 → CONTINUE', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-004',
        priorityScore: 85,
        effectivenessDelta: 20,
        roi: 5,
        evaluationCount: 4,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      const result = determineLifecycle(status);

      expect(result.decision).toBe('CONTINUE');
      expect(result.reason).toBe('継続監視');
      expect(result.shouldClose).toBe(false);
      expect(result.shouldAddLabel).toBe(false);
      expect(result.labelToAdd).toBe(null);
    });

    describe('境界値テスト', () => {
      it('delta = 0, roi = 0, evaluationCount = 2 → CLOSE_NO_EFFECT', () => {
        const status: ImprovementStatus = {
          improvementId: 'lesson-boundary-1',
          priorityScore: 50,
          effectivenessDelta: 0,
          roi: 0,
          evaluationCount: 2,
          lastEvaluatedAt: '2026-01-12T10:00:00Z',
        };

        const result = determineLifecycle(status);

        expect(result.decision).toBe('CLOSE_NO_EFFECT');
        expect(result.shouldClose).toBe(true);
      });

      it('delta = 0, roi = -1, evaluationCount = 2 → CLOSE_NO_EFFECT', () => {
        const status: ImprovementStatus = {
          improvementId: 'lesson-boundary-2',
          priorityScore: 50,
          effectivenessDelta: 0,
          roi: -1,
          evaluationCount: 2,
          lastEvaluatedAt: '2026-01-12T10:00:00Z',
        };

        const result = determineLifecycle(status);

        expect(result.decision).toBe('CLOSE_NO_EFFECT');
        expect(result.shouldClose).toBe(true);
      });

      it('delta = 0.01, roi = -0.01, evaluationCount = 2 → REDESIGN_REQUIRED', () => {
        const status: ImprovementStatus = {
          improvementId: 'lesson-boundary-3',
          priorityScore: 50,
          effectivenessDelta: 0.01,
          roi: -0.01,
          evaluationCount: 2,
          lastEvaluatedAt: '2026-01-12T10:00:00Z',
        };

        const result = determineLifecycle(status);

        expect(result.decision).toBe('REDESIGN_REQUIRED');
        expect(result.shouldClose).toBe(false);
        expect(result.shouldAddLabel).toBe(true);
      });

      it('delta = 0.01, roi = 0, evaluationCount = 2 → CONTINUE', () => {
        const status: ImprovementStatus = {
          improvementId: 'lesson-boundary-4',
          priorityScore: 50,
          effectivenessDelta: 0.01,
          roi: 0,
          evaluationCount: 2,
          lastEvaluatedAt: '2026-01-12T10:00:00Z',
        };

        const result = determineLifecycle(status);

        expect(result.decision).toBe('CONTINUE');
        expect(result.shouldClose).toBe(false);
        expect(result.shouldAddLabel).toBe(false);
      });

      it('evaluationCount = 1 (境界未満) → CONTINUE', () => {
        const status: ImprovementStatus = {
          improvementId: 'lesson-boundary-5',
          priorityScore: 50,
          effectivenessDelta: -100,
          roi: -100,
          evaluationCount: 1,
          lastEvaluatedAt: '2026-01-12T10:00:00Z',
        };

        const result = determineLifecycle(status);

        expect(result.decision).toBe('CONTINUE');
        expect(result.reason).toBe('評価回数が不足');
      });

      it('evaluationCount = 2 (境界) with negative values → CLOSE_NO_EFFECT', () => {
        const status: ImprovementStatus = {
          improvementId: 'lesson-boundary-6',
          priorityScore: 50,
          effectivenessDelta: -100,
          roi: -100,
          evaluationCount: 2,
          lastEvaluatedAt: '2026-01-12T10:00:00Z',
        };

        const result = determineLifecycle(status);

        expect(result.decision).toBe('CLOSE_NO_EFFECT');
        expect(result.shouldClose).toBe(true);
      });
    });
  });

  describe('buildCloseComment', () => {
    it('クローズコメントを正しく生成する', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-close',
        priorityScore: 60,
        effectivenessDelta: -5,
        roi: -10,
        evaluationCount: 3,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      const comment = buildCloseComment(status);

      expect(comment).toContain('🔒 自動クローズ');
      expect(comment).toContain('評価回数: 3回');
      expect(comment).toContain('効果指標の改善が見られない');
      expect(comment).toContain('ROIが正または中立に転じなかった');
      expect(comment).toContain('Auto-closed by P5-2 Improvement Lifecycle');
    });
  });

  describe('buildRedesignComment', () => {
    it('再設計コメントを正しく生成する', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-redesign',
        priorityScore: 70,
        effectivenessDelta: 15.5,
        roi: -8.25,
        evaluationCount: 2,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      const result = determineLifecycle(status);
      const comment = buildRedesignComment(status, result);

      expect(comment).toContain('⚠️ 再設計が必要です');
      expect(comment).toContain('評価回数: 2回');
      expect(comment).toContain('効果指標の改善: あり');
      expect(comment).toContain('Δ = 15.50');
      expect(comment).toContain('ROI: -8.25');
      expect(comment).toContain('needs-redesign');
      expect(comment).toContain('Auto-labeled by P5-2 Improvement Lifecycle');
    });

    it('効果なしの場合も正しくフォーマットする', () => {
      const status: ImprovementStatus = {
        improvementId: 'lesson-no-effect',
        priorityScore: 50,
        effectivenessDelta: -2.75,
        roi: -5.5,
        evaluationCount: 3,
        lastEvaluatedAt: '2026-01-12T10:00:00Z',
      };

      // このケースは実際にはCLOSE_NO_EFFECTになるが、
      // 関数の動作確認のため仮想的に呼び出す
      const result = {
        decision: 'REDESIGN_REQUIRED' as const,
        reason: 'テスト用',
        shouldClose: false,
        shouldAddLabel: true,
        labelToAdd: 'needs-redesign',
      };
      const comment = buildRedesignComment(status, result);

      expect(comment).toContain('効果指標の改善: なし');
      expect(comment).toContain('Δ = -2.75');
      expect(comment).toContain('ROI: -5.50');
    });
  });
});
