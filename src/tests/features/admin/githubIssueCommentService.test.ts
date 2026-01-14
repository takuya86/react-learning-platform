/**
 * Tests for GitHub Issue Comment Service
 *
 * P4-1.2: Tests idempotent comment posting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getIssueDetails,
  listIssueComments,
  createIssueComment,
  hasEvaluationComment,
  buildEvaluationMarker,
  setMockIssueDetails,
  setMockIssueComments,
  getMockIssueComments,
  resetMockCommentData,
  type IssueDetails,
  type IssueComment,
} from '@/features/admin/services/githubIssueCommentService';

// Mock isMockMode to true for tests
vi.mock('@/lib/supabase/client', () => ({
  isMockMode: true,
}));

describe('githubIssueCommentService', () => {
  beforeEach(() => {
    resetMockCommentData();
  });

  describe('buildEvaluationMarker', () => {
    it('should generate correct marker format', () => {
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      expect(marker).toBe('<!-- eval:lesson_slug=react-refs issue=123 window=14 -->');
    });

    it('should handle different lesson slugs', () => {
      const marker = buildEvaluationMarker('use-effect-basics', 456, 7);
      expect(marker).toBe('<!-- eval:lesson_slug=use-effect-basics issue=456 window=7 -->');
    });

    it('should handle different window days', () => {
      const marker1 = buildEvaluationMarker('react-refs', 123, 7);
      const marker2 = buildEvaluationMarker('react-refs', 123, 14);
      const marker3 = buildEvaluationMarker('react-refs', 123, 30);

      expect(marker1).toBe('<!-- eval:lesson_slug=react-refs issue=123 window=7 -->');
      expect(marker2).toBe('<!-- eval:lesson_slug=react-refs issue=123 window=14 -->');
      expect(marker3).toBe('<!-- eval:lesson_slug=react-refs issue=123 window=30 -->');
    });
  });

  describe('hasEvaluationComment', () => {
    it('should return true when marker exists in comments', () => {
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      const comments: IssueComment[] = [
        {
          id: 1,
          body: 'Some other comment',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          body: `## Evaluation Results\n\nFollow-up rate improved!\n\n${marker}`,
          createdAt: '2026-01-02T00:00:00Z',
        },
      ];

      expect(hasEvaluationComment(comments, marker)).toBe(true);
    });

    it('should return false when marker does not exist', () => {
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      const comments: IssueComment[] = [
        {
          id: 1,
          body: 'Some comment without marker',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          body: 'Another comment',
          createdAt: '2026-01-02T00:00:00Z',
        },
      ];

      expect(hasEvaluationComment(comments, marker)).toBe(false);
    });

    it('should return false for empty comments array', () => {
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      expect(hasEvaluationComment([], marker)).toBe(false);
    });

    it('should distinguish between different markers', () => {
      const marker1 = buildEvaluationMarker('react-refs', 123, 14);
      const marker2 = buildEvaluationMarker('react-refs', 123, 7);
      const marker3 = buildEvaluationMarker('use-effect-basics', 123, 14);

      const comments: IssueComment[] = [
        {
          id: 1,
          body: `Evaluation for 14 days\n\n${marker1}`,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];

      expect(hasEvaluationComment(comments, marker1)).toBe(true);
      expect(hasEvaluationComment(comments, marker2)).toBe(false);
      expect(hasEvaluationComment(comments, marker3)).toBe(false);
    });
  });

  describe('getIssueDetails (mock mode)', () => {
    it('should return issue details when issue exists', async () => {
      const mockIssue: IssueDetails = {
        number: 123,
        title: '[Lesson Improvement] React Refs',
        body: 'Issue body content',
        state: 'open',
        createdAt: '2026-01-01T00:00:00Z',
        closedAt: null,
        labels: ['lesson-improvement', 'hint:LOW_ENGAGEMENT'],
      };

      setMockIssueDetails(123, mockIssue);

      const result = await getIssueDetails(123);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockIssue);
    });

    it('should return error when issue does not exist', async () => {
      const result = await getIssueDetails(999);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Issue #999 not found in mock data');
    });

    it('should return closed issue details', async () => {
      const mockIssue: IssueDetails = {
        number: 456,
        title: '[Lesson Improvement] Use Effect',
        body: 'Issue body',
        state: 'closed',
        createdAt: '2026-01-01T00:00:00Z',
        closedAt: '2026-01-10T00:00:00Z',
        labels: ['lesson-improvement'],
      };

      setMockIssueDetails(456, mockIssue);

      const result = await getIssueDetails(456);

      expect(result.error).toBeNull();
      expect(result.data?.state).toBe('closed');
      expect(result.data?.closedAt).toBe('2026-01-10T00:00:00Z');
    });
  });

  describe('listIssueComments (mock mode)', () => {
    it('should return empty array when no comments exist', async () => {
      const result = await listIssueComments(123);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it('should return all comments for an issue', async () => {
      const mockComments: IssueComment[] = [
        {
          id: 1,
          body: 'First comment',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 2,
          body: 'Second comment',
          createdAt: '2026-01-02T00:00:00Z',
        },
      ];

      setMockIssueComments(123, mockComments);

      const result = await listIssueComments(123);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockComments);
    });
  });

  describe('createIssueComment (mock mode)', () => {
    it('should create a new comment', async () => {
      const commentBody = '## Evaluation Results\n\nFollow-up rate improved!';

      const result = await createIssueComment(123, commentBody);

      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        id: expect.any(Number),
        body: commentBody,
        createdAt: expect.any(String),
      });
    });

    it('should add comment to the issue comments list', async () => {
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      const commentBody = `## Evaluation Results\n\nFollow-up rate improved!\n\n${marker}`;

      await createIssueComment(123, commentBody);

      const comments = getMockIssueComments(123);
      expect(comments).toHaveLength(1);
      expect(comments[0].body).toBe(commentBody);
    });

    it('should append to existing comments', async () => {
      const existingComments: IssueComment[] = [
        {
          id: 1,
          body: 'Existing comment',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];

      setMockIssueComments(123, existingComments);

      await createIssueComment(123, 'New comment');

      const comments = getMockIssueComments(123);
      expect(comments).toHaveLength(2);
      expect(comments[0].body).toBe('Existing comment');
      expect(comments[1].body).toBe('New comment');
    });
  });

  describe('Idempotent comment posting workflow', () => {
    it('should allow creating comment when marker does not exist', async () => {
      // Setup: Issue with some existing comments but no evaluation comment
      const existingComments: IssueComment[] = [
        {
          id: 1,
          body: 'Manual comment from developer',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      setMockIssueComments(123, existingComments);

      // Step 1: List comments
      const listResult = await listIssueComments(123);
      expect(listResult.error).toBeNull();

      // Step 2: Check if evaluation comment exists
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      const exists = hasEvaluationComment(listResult.data!, marker);
      expect(exists).toBe(false);

      // Step 3: Create evaluation comment since it doesn't exist
      const commentBody = `## Evaluation Results\n\nFollow-up rate: 25%\n\n${marker}`;
      const createResult = await createIssueComment(123, commentBody);
      expect(createResult.error).toBeNull();

      // Verify: Comment was added
      const finalComments = getMockIssueComments(123);
      expect(finalComments).toHaveLength(2);
      expect(hasEvaluationComment(finalComments, marker)).toBe(true);
    });

    it('should prevent duplicate comment when marker already exists', async () => {
      // Setup: Issue with existing evaluation comment
      const marker = buildEvaluationMarker('react-refs', 123, 14);
      const existingComments: IssueComment[] = [
        {
          id: 1,
          body: `## Evaluation Results\n\nFollow-up rate: 20%\n\n${marker}`,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      setMockIssueComments(123, existingComments);

      // Step 1: List comments
      const listResult = await listIssueComments(123);
      expect(listResult.error).toBeNull();

      // Step 2: Check if evaluation comment exists
      const exists = hasEvaluationComment(listResult.data!, marker);
      expect(exists).toBe(true);

      // Step 3: Do NOT create comment since it already exists
      // (In actual implementation, the caller would skip this step)

      // Verify: No new comment was added
      const finalComments = getMockIssueComments(123);
      expect(finalComments).toHaveLength(1);
    });

    it('should allow creating comment with different window period', async () => {
      // Setup: Issue with 7-day evaluation comment
      const marker7day = buildEvaluationMarker('react-refs', 123, 7);
      const existingComments: IssueComment[] = [
        {
          id: 1,
          body: `## Evaluation Results (7 days)\n\nFollow-up rate: 20%\n\n${marker7day}`,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ];
      setMockIssueComments(123, existingComments);

      // Check: 14-day evaluation comment does not exist yet
      const marker14day = buildEvaluationMarker('react-refs', 123, 14);
      const listResult = await listIssueComments(123);
      const exists = hasEvaluationComment(listResult.data!, marker14day);
      expect(exists).toBe(false);

      // Create: 14-day evaluation comment
      const commentBody = `## Evaluation Results (14 days)\n\nFollow-up rate: 25%\n\n${marker14day}`;
      await createIssueComment(123, commentBody);

      // Verify: Both comments exist
      const finalComments = getMockIssueComments(123);
      expect(finalComments).toHaveLength(2);
      expect(hasEvaluationComment(finalComments, marker7day)).toBe(true);
      expect(hasEvaluationComment(finalComments, marker14day)).toBe(true);
    });
  });
});
