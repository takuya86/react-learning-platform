import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createIssue,
  closeIssue,
  addLabelToIssue,
  processLifecycleDecision,
  setMockOpenIssues,
  setMockIssueState,
  getMockIssueState,
  getMockIssueLabels,
  resetMockIssueData,
  getMockIssueComments,
  resetMockCommentData,
  type CreateIssueParams,
  type LifecycleResult,
} from '@/features/admin';

// Mock isMockMode to true for tests
vi.mock('@/lib/supabase/client', () => ({
  isMockMode: true,
}));

describe('githubIssueLifecycle - P5-2.2', () => {
  beforeEach(() => {
    resetMockIssueData();
    resetMockCommentData();
  });

  describe('closeIssue', () => {
    /**
     * [P5-2.2] Issue を正常にクローズできる
     */
    it('closes an open issue successfully', async () => {
      // Create an issue first
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      expect(createResult.error).toBeNull();
      const issueNumber = createResult.data!.number;

      // Verify initially open
      expect(getMockIssueState(issueNumber)).toBe('open');

      // Close the issue
      const closeResult = await closeIssue(issueNumber);
      expect(closeResult.error).toBeNull();
      expect(closeResult.data).toBeUndefined();

      // Verify now closed
      expect(getMockIssueState(issueNumber)).toBe('closed');
    });

    /**
     * [P5-2.2] コメント付きでクローズできる
     */
    it('closes issue with a comment', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const comment = 'This issue showed no improvement after 14 days. Closing.';

      // Close with comment
      const closeResult = await closeIssue(issueNumber, comment);
      expect(closeResult.error).toBeNull();

      // Verify closed
      expect(getMockIssueState(issueNumber)).toBe('closed');

      // Verify comment was posted
      const comments = getMockIssueComments(issueNumber);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[comments.length - 1].body).toBe(comment);
    });

    /**
     * [P5-2.2] 冪等性: 既にクローズされている Issue を再度クローズしても成功
     */
    it('is idempotent - closing an already closed issue succeeds', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      // Close once
      await closeIssue(issueNumber);
      expect(getMockIssueState(issueNumber)).toBe('closed');

      // Close again
      const closeResult = await closeIssue(issueNumber);
      expect(closeResult.error).toBeNull();
      expect(getMockIssueState(issueNumber)).toBe('closed');
    });
  });

  describe('addLabelToIssue', () => {
    /**
     * [P5-2.2] Issue にラベルを追加できる
     */
    it('adds a label to an issue successfully', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      // Add label
      const addLabelResult = await addLabelToIssue(issueNumber, 'needs-redesign');
      expect(addLabelResult.error).toBeNull();

      // Verify label was added
      const labels = getMockIssueLabels(issueNumber);
      expect(labels).toContain('needs-redesign');
    });

    /**
     * [P5-2.2] 冪等性: 既に存在するラベルを追加しても成功
     */
    it('is idempotent - adding an existing label succeeds', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      // Add label once
      await addLabelToIssue(issueNumber, 'needs-redesign');
      const labelsAfterFirst = getMockIssueLabels(issueNumber);
      expect(labelsAfterFirst).toContain('needs-redesign');

      // Add same label again
      const addLabelResult = await addLabelToIssue(issueNumber, 'needs-redesign');
      expect(addLabelResult.error).toBeNull();

      // Verify label count didn't increase (no duplicate)
      const labelsAfterSecond = getMockIssueLabels(issueNumber);
      const countBefore = labelsAfterFirst.filter((l) => l === 'needs-redesign').length;
      const countAfter = labelsAfterSecond.filter((l) => l === 'needs-redesign').length;
      expect(countAfter).toBe(countBefore);
    });

    /**
     * [P5-2.2] 複数のラベルを追加できる
     */
    it('can add multiple different labels', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      // Add multiple labels
      await addLabelToIssue(issueNumber, 'needs-redesign');
      await addLabelToIssue(issueNumber, 'high-priority');

      const labels = getMockIssueLabels(issueNumber);
      expect(labels).toContain('needs-redesign');
      expect(labels).toContain('high-priority');
    });
  });

  describe('processLifecycleDecision', () => {
    /**
     * [P5-2.2] CLOSE_NO_EFFECT の場合、コメントを投稿して Issue をクローズ
     */
    it('processes CLOSE_NO_EFFECT correctly', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const lifecycleResult: LifecycleResult = {
        decision: 'CLOSE_NO_EFFECT',
        comment: '14日経過後もFollow-up Rateが改善しなかったためクローズします。',
      };

      // Process decision
      const processResult = await processLifecycleDecision(issueNumber, lifecycleResult);
      expect(processResult.error).toBeNull();

      // Verify issue is closed
      expect(getMockIssueState(issueNumber)).toBe('closed');

      // Verify comment was posted
      const comments = getMockIssueComments(issueNumber);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[comments.length - 1].body).toBe(lifecycleResult.comment);
    });

    /**
     * [P5-2.2] REDESIGN_REQUIRED の場合、コメント投稿とラベル追加
     */
    it('processes REDESIGN_REQUIRED correctly', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const lifecycleResult: LifecycleResult = {
        decision: 'REDESIGN_REQUIRED',
        comment: '改善効果が不十分です。レッスン構成の大幅な見直しが必要です。',
        label: 'needs-redesign',
      };

      // Process decision
      const processResult = await processLifecycleDecision(issueNumber, lifecycleResult);
      expect(processResult.error).toBeNull();

      // Verify issue is still open
      expect(getMockIssueState(issueNumber)).toBe('open');

      // Verify label was added
      const labels = getMockIssueLabels(issueNumber);
      expect(labels).toContain('needs-redesign');

      // Verify comment was posted
      const comments = getMockIssueComments(issueNumber);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[comments.length - 1].body).toBe(lifecycleResult.comment);
    });

    /**
     * [P5-2.2] CONTINUE の場合、何もしない
     */
    it('processes CONTINUE correctly (does nothing)', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const initialLabels = getMockIssueLabels(issueNumber);
      const initialState = getMockIssueState(issueNumber);

      const lifecycleResult: LifecycleResult = {
        decision: 'CONTINUE',
        comment: 'This comment should not be posted',
      };

      // Process decision
      const processResult = await processLifecycleDecision(issueNumber, lifecycleResult);
      expect(processResult.error).toBeNull();

      // Verify nothing changed
      expect(getMockIssueState(issueNumber)).toBe(initialState);
      expect(getMockIssueLabels(issueNumber)).toEqual(initialLabels);
      expect(getMockIssueComments(issueNumber)).toHaveLength(0);
    });

    /**
     * [P5-2.2] 冪等性: 同じ判定を複数回実行しても問題ない
     */
    it('is idempotent when called multiple times', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const lifecycleResult: LifecycleResult = {
        decision: 'REDESIGN_REQUIRED',
        comment: 'Needs redesign',
        label: 'needs-redesign',
      };

      // Process once
      await processLifecycleDecision(issueNumber, lifecycleResult);
      const commentsAfterFirst = getMockIssueComments(issueNumber).length;

      // Process again
      const processResult = await processLifecycleDecision(issueNumber, lifecycleResult);
      expect(processResult.error).toBeNull();

      // Verify label wasn't duplicated
      const labelsAfterSecond = getMockIssueLabels(issueNumber);
      const redesignLabelCount = labelsAfterSecond.filter((l) => l === 'needs-redesign').length;
      expect(redesignLabelCount).toBe(1);

      // Note: Comments will be duplicated (not idempotent by design)
      // This is expected behavior for GitHub's comment API
      const commentsAfterSecond = getMockIssueComments(issueNumber).length;
      expect(commentsAfterSecond).toBe(commentsAfterFirst + 1);
    });

    /**
     * [P5-2.2] REDESIGN_REQUIRED でラベルが指定されていない場合
     */
    it('handles REDESIGN_REQUIRED without label', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const lifecycleResult: LifecycleResult = {
        decision: 'REDESIGN_REQUIRED',
        comment: 'Needs attention',
        // No label specified
      };

      const processResult = await processLifecycleDecision(issueNumber, lifecycleResult);
      expect(processResult.error).toBeNull();

      // Verify comment was still posted
      const comments = getMockIssueComments(issueNumber);
      expect(comments.length).toBeGreaterThan(0);
    });
  });

  describe('mock state management', () => {
    /**
     * [P5-2.2] setMockIssueState と getMockIssueState が正しく動作
     */
    it('setMockIssueState and getMockIssueState work correctly', () => {
      setMockOpenIssues([
        {
          number: 123,
          url: 'https://github.com/test/repo/issues/123',
          title: '[Lesson Improvement] Test',
          labels: ['lesson-improvement'],
        },
      ]);

      setMockIssueState(123, 'open');
      expect(getMockIssueState(123)).toBe('open');

      setMockIssueState(123, 'closed');
      expect(getMockIssueState(123)).toBe('closed');
    });

    /**
     * [P5-2.2] getMockIssueLabels が正しく動作
     */
    it('getMockIssueLabels returns correct labels', async () => {
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      const issueNumber = createResult.data!.number;

      const labels = getMockIssueLabels(issueNumber);
      expect(labels).toContain('lesson-improvement');
      expect(labels).toContain('metrics');
      expect(labels).toContain('hint:CTA_MISSING');
      expect(labels).toContain('lesson:react-basics');
    });
  });

  describe('integration workflow', () => {
    /**
     * [P5-2.2] 完全なライフサイクルワークフロー
     */
    it('executes complete lifecycle workflow', async () => {
      // 1. Create issue
      const params: CreateIssueParams = {
        lessonSlug: 'react-basics',
        lessonTitle: 'React入門',
        hintType: 'CTA_MISSING',
        hintMessage: 'test',
        followUpRate: 15,
        originCount: 10,
      };

      const createResult = await createIssue(params);
      expect(createResult.error).toBeNull();
      const issueNumber = createResult.data!.number;

      // 2. Initial state check
      expect(getMockIssueState(issueNumber)).toBe('open');

      // 3. Evaluate after 7 days - needs redesign
      const redesignResult: LifecycleResult = {
        decision: 'REDESIGN_REQUIRED',
        comment: '7日後評価: 改善効果が限定的です。',
        label: 'needs-redesign',
      };

      await processLifecycleDecision(issueNumber, redesignResult);
      expect(getMockIssueState(issueNumber)).toBe('open');
      expect(getMockIssueLabels(issueNumber)).toContain('needs-redesign');

      // 4. Evaluate after 14 days - close as no effect
      const closeResult: LifecycleResult = {
        decision: 'CLOSE_NO_EFFECT',
        comment: '14日後評価: 改善効果が見られないためクローズします。',
      };

      await processLifecycleDecision(issueNumber, closeResult);
      expect(getMockIssueState(issueNumber)).toBe('closed');

      // Verify comments were posted
      const comments = getMockIssueComments(issueNumber);
      expect(comments.length).toBe(2);
      expect(comments[0].body).toContain('7日後評価');
      expect(comments[1].body).toContain('14日後評価');
    });
  });
});
