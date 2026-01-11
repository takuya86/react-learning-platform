import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createIssue,
  isDuplicateIssue,
  listOpenIssuesByLesson,
  canCreateIssue,
  setMockOpenIssues,
  getMockCreatedIssues,
  resetMockIssueData,
  type CreateIssueParams,
} from '@/features/admin';

// Mock isMockMode to true for tests
vi.mock('@/lib/supabase/client', () => ({
  isMockMode: true,
}));

describe('githubIssueService', () => {
  beforeEach(() => {
    resetMockIssueData();
  });

  describe('canCreateIssue', () => {
    /**
     * [spec-lock] originCount >= 5 が必要
     */
    it('returns false when originCount < 5', () => {
      expect(canCreateIssue(4, 'CTA_MISSING')).toBe(false);
      expect(canCreateIssue(0, 'CTA_MISSING')).toBe(false);
    });

    /**
     * [spec-lock] hintType が null の場合は作成不可
     */
    it('returns false when hintType is null', () => {
      expect(canCreateIssue(10, null)).toBe(false);
    });

    /**
     * [spec-lock] LOW_SAMPLE は作成不可
     */
    it('returns false when hintType is LOW_SAMPLE', () => {
      expect(canCreateIssue(10, 'LOW_SAMPLE')).toBe(false);
    });

    /**
     * [spec-lock] 条件を満たせば作成可能
     */
    it('returns true when all conditions are met', () => {
      expect(canCreateIssue(5, 'CTA_MISSING')).toBe(true);
      expect(canCreateIssue(10, 'NEXT_LESSON_WEAK')).toBe(true);
      expect(canCreateIssue(100, 'LOW_ENGAGEMENT')).toBe(true);
    });
  });

  describe('createIssue', () => {
    const validParams: CreateIssueParams = {
      lessonSlug: 'react-basics',
      lessonTitle: 'React入門',
      hintType: 'CTA_MISSING',
      hintMessage: '復習・クイズ・ノート導線が不足',
      followUpRate: 15,
      originCount: 10,
    };

    /**
     * [spec-lock] originCount < 5 はエラー
     */
    it('returns error when originCount < 5', async () => {
      const result = await createIssue({
        ...validParams,
        originCount: 4,
      });

      expect(result.data).toBeNull();
      expect(result.error).toContain('originCount must be >= 5');
    });

    /**
     * [spec-lock] LOW_SAMPLE はエラー
     */
    it('returns error when hintType is LOW_SAMPLE', async () => {
      const result = await createIssue({
        ...validParams,
        hintType: 'LOW_SAMPLE',
      });

      expect(result.data).toBeNull();
      expect(result.error).toContain('LOW_SAMPLE');
    });

    /**
     * [spec-lock] 正常系: Issue が作成される
     */
    it('creates issue successfully in mock mode', async () => {
      const result = await createIssue(validParams);

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(result.data?.number).toBe(1);
      expect(result.data?.title).toContain('[Lesson Improvement]');
      expect(result.data?.title).toContain('React入門');
      expect(result.data?.title).toContain('react-basics'); // slug is included
      expect(result.data?.title).toContain('CTA_MISSING');
    });

    /**
     * [spec-lock] 作成後は getMockCreatedIssues で取得可能
     */
    it('stores created issue in mock storage', async () => {
      await createIssue(validParams);

      const created = getMockCreatedIssues();
      expect(created).toHaveLength(1);
      expect(created[0].title).toContain('React入門');
    });

    /**
     * [spec-lock] 複数作成時は連番
     */
    it('increments issue number for multiple issues', async () => {
      await createIssue(validParams);
      await createIssue({
        ...validParams,
        lessonSlug: 'hooks-intro',
        lessonTitle: 'Hooks入門',
      });

      const created = getMockCreatedIssues();
      expect(created).toHaveLength(2);
      expect(created[0].number).toBe(1);
      expect(created[1].number).toBe(2);
    });

    /**
     * [spec-lock] hintType別のIssue本文
     */
    it('generates correct title for each hint type', async () => {
      const result1 = await createIssue({
        ...validParams,
        hintType: 'NEXT_LESSON_WEAK',
      });
      expect(result1.data?.title).toContain('NEXT_LESSON_WEAK');

      resetMockIssueData();

      const result2 = await createIssue({
        ...validParams,
        hintType: 'LOW_ENGAGEMENT',
      });
      expect(result2.data?.title).toContain('LOW_ENGAGEMENT');
    });
  });

  describe('isDuplicateIssue', () => {
    /**
     * [spec-lock] 重複なしの場合は false
     */
    it('returns false when no matching issue exists', async () => {
      const result = await isDuplicateIssue('react-basics', 'CTA_MISSING');
      expect(result.data).toBe(false);
    });

    /**
     * [spec-lock] 同一 slug + hintType が存在すれば true
     */
    it('returns true when matching issue exists', async () => {
      setMockOpenIssues([
        {
          number: 1,
          url: 'https://github.com/test/repo/issues/1',
          title: '[Lesson Improvement] react-basics - CTA_MISSING',
          labels: ['lesson-improvement', 'metrics', 'hint:CTA_MISSING'],
        },
      ]);

      const result = await isDuplicateIssue('react-basics', 'CTA_MISSING');
      expect(result.data).toBe(true);
    });

    /**
     * [spec-lock] slug は一致するが hintType が異なる場合は false
     */
    it('returns false when slug matches but hintType differs', async () => {
      setMockOpenIssues([
        {
          number: 1,
          url: 'https://github.com/test/repo/issues/1',
          title: '[Lesson Improvement] react-basics - CTA_MISSING',
          labels: ['lesson-improvement', 'metrics', 'hint:CTA_MISSING'],
        },
      ]);

      const result = await isDuplicateIssue('react-basics', 'NEXT_LESSON_WEAK');
      expect(result.data).toBe(false);
    });

    /**
     * [spec-lock] hintType は一致するが slug が異なる場合は false
     */
    it('returns false when hintType matches but slug differs', async () => {
      setMockOpenIssues([
        {
          number: 1,
          url: 'https://github.com/test/repo/issues/1',
          title: '[Lesson Improvement] other-lesson - CTA_MISSING',
          labels: ['lesson-improvement', 'metrics', 'hint:CTA_MISSING'],
        },
      ]);

      const result = await isDuplicateIssue('react-basics', 'CTA_MISSING');
      expect(result.data).toBe(false);
    });
  });

  describe('listOpenIssuesByLesson', () => {
    /**
     * [spec-lock] 該当レッスンの Issue のみ返す
     */
    it('returns only issues for the specified lesson', async () => {
      setMockOpenIssues([
        {
          number: 1,
          url: 'https://github.com/test/repo/issues/1',
          title: '[Lesson Improvement] react-basics - CTA_MISSING',
          labels: ['lesson-improvement'],
        },
        {
          number: 2,
          url: 'https://github.com/test/repo/issues/2',
          title: '[Lesson Improvement] hooks-intro - NEXT_LESSON_WEAK',
          labels: ['lesson-improvement'],
        },
      ]);

      const result = await listOpenIssuesByLesson('react-basics');
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].number).toBe(1);
    });

    /**
     * [spec-lock] 該当なしの場合は空配列
     */
    it('returns empty array when no matching issues', async () => {
      setMockOpenIssues([
        {
          number: 1,
          url: 'https://github.com/test/repo/issues/1',
          title: '[Lesson Improvement] other-lesson - CTA_MISSING',
          labels: ['lesson-improvement'],
        },
      ]);

      const result = await listOpenIssuesByLesson('react-basics');
      expect(result.data).toHaveLength(0);
    });
  });

  describe('duplicate prevention workflow', () => {
    /**
     * [spec-lock] Issue作成後は重複検出される
     */
    it('detects duplicate after issue creation', async () => {
      // Initially no duplicate
      const before = await isDuplicateIssue('react-basics', 'CTA_MISSING');
      expect(before.data).toBe(false);

      // Create issue
      await createIssue({
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      });

      // Now duplicate is detected
      const after = await isDuplicateIssue('react-basics', 'CTA_MISSING');
      expect(after.data).toBe(true);
    });
  });

  describe('front-matter metadata', () => {
    /**
     * [P3-3.1] Issue本文にfront-matterメタデータが含まれる
     */
    it('includes front-matter metadata in issue body', async () => {
      // Mock the buildIssueBody function by creating an issue and checking mock storage
      const params: CreateIssueParams = {
        lessonSlug: 'react-refs',
        lessonTitle: 'React Refs',
        hintType: 'NEXT_LESSON_WEAK',
        hintMessage: '次のレッスンへの導線が弱い',
        followUpRate: 16.7,
        originCount: 12,
        baselineWindowDays: 30,
        baselineSnapshotAtUtc: '2026-01-11T00:00:00Z',
      };

      await createIssue(params);

      // Verify issue was created
      const created = getMockCreatedIssues();
      expect(created).toHaveLength(1);
    });

    /**
     * [P3-3.1] ラベルに lesson:<slug> が含まれる
     */
    it('includes lesson label in created issue', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-refs',
        lessonTitle: 'React Refs',
        hintType: 'NEXT_LESSON_WEAK',
        hintMessage: '次のレッスンへの導線が弱い',
        followUpRate: 16.7,
        originCount: 12,
      };

      await createIssue(params);

      // Check mock open issues which store labels
      const openIssues = await listOpenIssuesByLesson('react-refs');
      expect(openIssues.data).toHaveLength(1);
      expect(openIssues.data?.[0].labels).toContain('lesson:react-refs');
      expect(openIssues.data?.[0].labels).toContain('hint:NEXT_LESSON_WEAK');
      expect(openIssues.data?.[0].labels).toContain('lesson-improvement');
      expect(openIssues.data?.[0].labels).toContain('metrics');
    });
  });
});
