/**
 * Tests for Evaluation Service
 *
 * @spec-lock すべてのテストケースは仕様変更時に必ず更新が必要
 */

import { describe, it, expect } from 'vitest';
import {
  buildEffectivenessSnapshot,
  buildEffectivenessDelta,
  getEvaluationStatus,
  buildEvaluationComment,
  type EffectivenessSnapshot,
  type EvaluationMeta,
} from './evaluationService';
import type { LearningEvent } from './metricsService';

// ============================================================
// Test Helpers
// ============================================================

function createEvent(
  userId: string,
  eventType: string,
  referenceId: string,
  createdAt: string
): LearningEvent {
  return {
    id: Math.random().toString(),
    user_id: userId,
    event_type: eventType as LearningEvent['event_type'],
    event_date: createdAt.split('T')[0],
    created_at: createdAt,
    reference_id: referenceId,
  };
}

// ============================================================
// buildEffectivenessSnapshot Tests
// ============================================================

describe('buildEffectivenessSnapshot', () => {
  describe('基本動作', () => {
    it('期間内のイベントのみをカウントする', () => {
      const events: LearningEvent[] = [
        // Before window
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-01T10:00:00Z'),
        // In window - origin
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
        // In window - follow-up (within 24h)
        createEvent('user1', 'next_lesson_opened', 'react-basics', '2024-01-10T12:00:00Z'),
        // After window
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-25T10:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(1);
      expect(snapshot.followUpCount).toBe(1);
      expect(snapshot.followUpRate).toBe(1);
    });

    it('lessonSlugでフィルタする', () => {
      const events: LearningEvent[] = [
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
        createEvent('user1', 'lesson_viewed', 'react-advanced', '2024-01-10T11:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(1);
    });

    it('24時間以内のfollow-upのみカウント', () => {
      const events: LearningEvent[] = [
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
        // Within 24h - counted
        createEvent('user1', 'next_lesson_opened', 'react-basics', '2024-01-11T09:00:00Z'),
        // After 24h - not counted
        createEvent('user1', 'quiz_started', 'react-basics', '2024-01-11T11:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(1);
      expect(snapshot.followUpCount).toBe(1);
    });
  });

  describe('follow-upカウント', () => {
    it('複数のfollow-upタイプをカウント', () => {
      const events: LearningEvent[] = [
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
        createEvent('user1', 'next_lesson_opened', 'react-basics', '2024-01-10T11:00:00Z'),
        createEvent('user1', 'quiz_started', 'react-basics', '2024-01-10T12:00:00Z'),
        createEvent('user1', 'note_created', 'react-basics', '2024-01-10T13:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.followUpCounts['next_lesson_opened']).toBe(1);
      expect(snapshot.followUpCounts['quiz_started']).toBe(1);
      expect(snapshot.followUpCounts['note_created']).toBe(1);
    });

    it('同じタイプのfollow-upは1回としてカウント（per origin）', () => {
      const events: LearningEvent[] = [
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
        createEvent('user1', 'quiz_started', 'react-basics', '2024-01-10T11:00:00Z'),
        createEvent('user1', 'quiz_started', 'react-basics', '2024-01-10T12:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      // Follow-up counts per origin
      expect(snapshot.followUpCounts['quiz_started']).toBe(1);
    });
  });

  describe('複数ユーザー', () => {
    it('各ユーザーのイベントを独立してカウント', () => {
      const events: LearningEvent[] = [
        // User1: origin with follow-up
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
        createEvent('user1', 'next_lesson_opened', 'react-basics', '2024-01-10T11:00:00Z'),
        // User2: origin without follow-up
        createEvent('user2', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(2);
      expect(snapshot.followUpCount).toBe(1);
      expect(snapshot.followUpRate).toBe(0.5);
    });
  });

  describe('エッジケース', () => {
    it('originが0件の場合、followUpRateは0（NaNではない）', () => {
      const events: LearningEvent[] = [];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(0);
      expect(snapshot.followUpCount).toBe(0);
      expect(snapshot.followUpRate).toBe(0);
      expect(snapshot.followUpRate).not.toBeNaN();
    });

    it('follow-upのみでoriginがない場合、0件', () => {
      const events: LearningEvent[] = [
        createEvent('user1', 'next_lesson_opened', 'react-basics', '2024-01-10T10:00:00Z'),
        createEvent('user1', 'quiz_started', 'react-basics', '2024-01-10T11:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(0);
      expect(snapshot.followUpCount).toBe(0);
    });

    it('window境界（from inclusive, to exclusive）', () => {
      const events: LearningEvent[] = [
        // Exactly at from - included
        createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T00:00:00Z'),
        // Exactly at to - excluded
        createEvent('user2', 'lesson_viewed', 'react-basics', '2024-01-24T00:00:00Z'),
      ];

      const snapshot = buildEffectivenessSnapshot(events, {
        from: '2024-01-10T00:00:00Z',
        to: '2024-01-24T00:00:00Z',
        lessonSlug: 'react-basics',
      });

      expect(snapshot.originCount).toBe(1);
    });
  });
});

// ============================================================
// buildEffectivenessDelta Tests
// ============================================================

describe('buildEffectivenessDelta', () => {
  it('deltaRateを正しく計算（decimal）', () => {
    const before: EffectivenessSnapshot = {
      originCount: 10,
      followUpCount: 3,
      followUpRate: 0.3,
      followUpCounts: {},
    };

    const after: EffectivenessSnapshot = {
      originCount: 10,
      followUpCount: 5,
      followUpRate: 0.5,
      followUpCounts: {},
    };

    const delta = buildEffectivenessDelta(before, after, 14);

    expect(delta.deltaRate).toBe(0.2); // 0.5 - 0.3
    expect(delta.windowDays).toBe(14);
  });

  it('before/afterのsnapshotを保持', () => {
    const before: EffectivenessSnapshot = {
      originCount: 10,
      followUpCount: 3,
      followUpRate: 0.3,
      followUpCounts: { quiz_started: 2 },
    };

    const after: EffectivenessSnapshot = {
      originCount: 12,
      followUpCount: 8,
      followUpRate: 0.67,
      followUpCounts: { quiz_started: 5, note_created: 3 },
    };

    const delta = buildEffectivenessDelta(before, after, 14);

    expect(delta.before).toEqual(before);
    expect(delta.after).toEqual(after);
  });

  it('statusとnoteを生成', () => {
    const before: EffectivenessSnapshot = {
      originCount: 10,
      followUpCount: 3,
      followUpRate: 0.3,
      followUpCounts: {},
    };

    const after: EffectivenessSnapshot = {
      originCount: 10,
      followUpCount: 5,
      followUpRate: 0.5,
      followUpCounts: {},
    };

    const delta = buildEffectivenessDelta(before, after, 14);

    expect(delta.status).toBe('IMPROVED');
    expect(delta.note).toContain('improved');
  });
});

// ============================================================
// getEvaluationStatus Tests
// ============================================================

describe('getEvaluationStatus', () => {
  describe('LOW_SAMPLE判定', () => {
    it('afterOriginCount < 5 の場合、LOW_SAMPLE', () => {
      expect(getEvaluationStatus(0.1, 4)).toBe('LOW_SAMPLE');
      expect(getEvaluationStatus(0.1, 0)).toBe('LOW_SAMPLE');
    });

    it('afterOriginCount >= 5 の場合、他の条件を評価', () => {
      expect(getEvaluationStatus(0.1, 5)).toBe('IMPROVED');
      expect(getEvaluationStatus(0.1, 100)).toBe('IMPROVED');
    });
  });

  describe('IMPROVED判定', () => {
    it('deltaRate >= 0.05 の場合、IMPROVED', () => {
      expect(getEvaluationStatus(0.05, 10)).toBe('IMPROVED');
      expect(getEvaluationStatus(0.06, 10)).toBe('IMPROVED');
      expect(getEvaluationStatus(0.5, 10)).toBe('IMPROVED');
    });

    it('deltaRate < 0.05 の場合、IMPROVEDではない', () => {
      expect(getEvaluationStatus(0.049, 10)).not.toBe('IMPROVED');
    });
  });

  describe('REGRESSED判定', () => {
    it('deltaRate <= -0.05 の場合、REGRESSED', () => {
      expect(getEvaluationStatus(-0.05, 10)).toBe('REGRESSED');
      expect(getEvaluationStatus(-0.06, 10)).toBe('REGRESSED');
      expect(getEvaluationStatus(-0.5, 10)).toBe('REGRESSED');
    });

    it('deltaRate > -0.05 の場合、REGRESSEDではない', () => {
      expect(getEvaluationStatus(-0.049, 10)).not.toBe('REGRESSED');
    });
  });

  describe('NO_CHANGE判定', () => {
    it('-0.05 < deltaRate < 0.05 の場合、NO_CHANGE', () => {
      expect(getEvaluationStatus(0, 10)).toBe('NO_CHANGE');
      expect(getEvaluationStatus(0.01, 10)).toBe('NO_CHANGE');
      expect(getEvaluationStatus(-0.01, 10)).toBe('NO_CHANGE');
      expect(getEvaluationStatus(0.049, 10)).toBe('NO_CHANGE');
      expect(getEvaluationStatus(-0.049, 10)).toBe('NO_CHANGE');
    });
  });

  describe('境界値テスト', () => {
    it('閾値ちょうど（±0.05）', () => {
      expect(getEvaluationStatus(0.05, 10)).toBe('IMPROVED');
      expect(getEvaluationStatus(-0.05, 10)).toBe('REGRESSED');
    });

    it('サンプルサイズ境界（5件）', () => {
      expect(getEvaluationStatus(0.1, 4)).toBe('LOW_SAMPLE');
      expect(getEvaluationStatus(0.1, 5)).toBe('IMPROVED');
    });
  });
});

// ============================================================
// buildEvaluationComment Tests
// ============================================================

describe('buildEvaluationComment', () => {
  const createDelta = (
    status: 'IMPROVED' | 'REGRESSED' | 'NO_CHANGE' | 'LOW_SAMPLE',
    deltaRate: number
  ) => ({
    status,
    before: {
      originCount: 10,
      followUpCount: 3,
      followUpRate: 0.3,
      followUpCounts: { quiz_started: 2 },
    },
    after: {
      originCount: 12,
      followUpCount: 8,
      followUpRate: 0.67,
      followUpCounts: { quiz_started: 5, note_created: 3 },
    },
    deltaRate,
    windowDays: 14,
    note: 'Test note',
  });

  const createMeta = (): EvaluationMeta => ({
    issueNumber: 123,
    lessonSlug: 'react-basics',
    hintType: 'add-interactive-example',
    prUrl: 'https://github.com/user/repo/pull/456',
  });

  it('IMPROVEDステータスで正しいコメントを生成', () => {
    const delta = createDelta('IMPROVED', 0.1);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).toContain('✅');
    expect(comment).toContain('IMPROVED');
    expect(comment).toContain('#123');
    expect(comment).toContain('react-basics');
    expect(comment).toContain('add-interactive-example');
    expect(comment).toContain('https://github.com/user/repo/pull/456');
  });

  it('REGRESSEDステータスで警告を含む', () => {
    const delta = createDelta('REGRESSED', -0.1);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).toContain('⚠️');
    expect(comment).toContain('REGRESSED');
    expect(comment).toContain('negative effect');
  });

  it('LOW_SAMPLEステータスで推奨事項を含む', () => {
    const delta = createDelta('LOW_SAMPLE', 0.05);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).toContain('📊');
    expect(comment).toContain('LOW_SAMPLE');
    expect(comment).toContain('too small');
    expect(comment).toContain('target: 5+');
  });

  it('NO_CHANGEステータス', () => {
    const delta = createDelta('NO_CHANGE', 0.02);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).toContain('ℹ️');
    expect(comment).toContain('NO_CHANGE');
  });

  it('Before/After比較テーブルを含む', () => {
    const delta = createDelta('IMPROVED', 0.1);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).toContain('| Metric | Before | After | Delta |');
    expect(comment).toContain('| Origin Events | 10 | 12 | +2 |');
    expect(comment).toContain('| Follow-up Rate | 30% | 67%');
  });

  it('Follow-up内訳テーブルを含む', () => {
    const delta = createDelta('IMPROVED', 0.1);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).toContain('Follow-up Event Breakdown');
    expect(comment).toContain('quiz_started');
    expect(comment).toContain('note_created');
  });

  it('prUrlがない場合は省略', () => {
    const delta = createDelta('IMPROVED', 0.1);
    const meta = { ...createMeta(), prUrl: undefined };

    const comment = buildEvaluationComment(delta, meta);

    expect(comment).not.toContain('**PR:**');
  });

  it('パーセンテージとppの表記が正しい', () => {
    const delta = createDelta('IMPROVED', 0.15);
    const meta = createMeta();

    const comment = buildEvaluationComment(delta, meta);

    // deltaRate should be in pp
    expect(comment).toContain('+15pp');
    // rates should be in %
    expect(comment).toContain('30%');
    expect(comment).toContain('67%');
  });
});

// ============================================================
// Integration Tests
// ============================================================

describe('Integration: Full evaluation flow', () => {
  it('Before/Afterスナップショットからコメント生成まで', () => {
    // Before period events (5 origins, 2 with follow-up = 40%)
    const beforeEvents: LearningEvent[] = [
      createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-01T10:00:00Z'),
      createEvent('user1', 'quiz_started', 'react-basics', '2024-01-01T11:00:00Z'),
      createEvent('user2', 'lesson_viewed', 'react-basics', '2024-01-02T10:00:00Z'),
      createEvent('user2', 'note_created', 'react-basics', '2024-01-02T11:00:00Z'),
      createEvent('user3', 'lesson_viewed', 'react-basics', '2024-01-03T10:00:00Z'),
      // No follow-up for user3
      createEvent('user4', 'lesson_viewed', 'react-basics', '2024-01-04T10:00:00Z'),
      // No follow-up for user4
      createEvent('user5', 'lesson_viewed', 'react-basics', '2024-01-05T10:00:00Z'),
      // No follow-up for user5
    ];

    // After period events (5 origins, all with follow-up = 100%, improved!)
    const afterEvents: LearningEvent[] = [
      createEvent('user1', 'lesson_viewed', 'react-basics', '2024-02-01T10:00:00Z'),
      createEvent('user1', 'quiz_started', 'react-basics', '2024-02-01T11:00:00Z'),
      createEvent('user2', 'lesson_viewed', 'react-basics', '2024-02-02T10:00:00Z'),
      createEvent('user2', 'note_created', 'react-basics', '2024-02-02T11:00:00Z'),
      createEvent('user3', 'lesson_viewed', 'react-basics', '2024-02-03T10:00:00Z'),
      createEvent('user3', 'next_lesson_opened', 'react-basics', '2024-02-03T11:00:00Z'),
      createEvent('user4', 'lesson_viewed', 'react-basics', '2024-02-04T10:00:00Z'),
      createEvent('user4', 'quiz_started', 'react-basics', '2024-02-04T11:00:00Z'),
      createEvent('user5', 'lesson_viewed', 'react-basics', '2024-02-05T10:00:00Z'),
      // P3-1: review_started is now origin, use next_lesson_opened as follow-up
      createEvent('user5', 'next_lesson_opened', 'react-basics', '2024-02-05T11:00:00Z'),
    ];

    // Build snapshots
    const beforeSnapshot = buildEffectivenessSnapshot(beforeEvents, {
      from: '2024-01-01T00:00:00Z',
      to: '2024-01-15T00:00:00Z',
      lessonSlug: 'react-basics',
    });

    const afterSnapshot = buildEffectivenessSnapshot(afterEvents, {
      from: '2024-02-01T00:00:00Z',
      to: '2024-02-15T00:00:00Z',
      lessonSlug: 'react-basics',
    });

    // Build delta
    const delta = buildEffectivenessDelta(beforeSnapshot, afterSnapshot, 14);

    // Verify delta
    expect(delta.before.originCount).toBe(5);
    expect(delta.before.followUpCount).toBe(2);
    expect(delta.before.followUpRate).toBe(0.4); // 2/5
    expect(delta.after.originCount).toBe(5);
    expect(delta.after.followUpCount).toBe(5);
    expect(delta.after.followUpRate).toBe(1); // 5/5
    expect(delta.deltaRate).toBeCloseTo(0.6, 2); // 1.0 - 0.4 = 0.6 = +60pp
    expect(delta.status).toBe('IMPROVED');

    // Build comment
    const meta: EvaluationMeta = {
      issueNumber: 42,
      lessonSlug: 'react-basics',
      hintType: 'add-interactive-example',
    };

    const comment = buildEvaluationComment(delta, meta);

    // Verify comment content
    expect(comment).toContain('✅');
    expect(comment).toContain('IMPROVED');
    expect(comment).toContain('#42');
    expect(comment).toContain('react-basics');
  });

  it('サンプルサイズ不足の場合', () => {
    const events: LearningEvent[] = [
      createEvent('user1', 'lesson_viewed', 'react-basics', '2024-01-10T10:00:00Z'),
      createEvent('user1', 'quiz_started', 'react-basics', '2024-01-10T11:00:00Z'),
    ];

    const snapshot = buildEffectivenessSnapshot(events, {
      from: '2024-01-10T00:00:00Z',
      to: '2024-01-24T00:00:00Z',
      lessonSlug: 'react-basics',
    });

    const delta = buildEffectivenessDelta(snapshot, snapshot, 14);

    expect(delta.status).toBe('LOW_SAMPLE');
    expect(delta.note).toContain('too small');
  });
});
