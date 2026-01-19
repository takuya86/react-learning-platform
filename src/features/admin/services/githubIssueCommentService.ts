/**
 * GitHub Issue Comment Service for Idempotent Evaluation Comment Posting
 *
 * P4-1.2: Provides functionality to post evaluation comments to GitHub issues
 * with built-in duplicate prevention using HTML comment markers.
 *
 * ## Features
 * - Get issue details (created_at, closed_at, body, etc.)
 * - List issue comments
 * - Create issue comments
 * - Check for existing evaluation comments using markers
 * - Generate unique evaluation markers
 * - Mock mode support for testing
 */

import { isMockMode } from '@/lib/supabase/client';
import { MockDataManager } from '@/lib/mock/MockDataManager';

// Environment variables for GitHub API
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

/**
 * Issue details with metadata
 */
export interface IssueDetails {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  createdAt: string; // ISO8601
  closedAt: string | null;
  labels: string[];
}

/**
 * Issue comment
 */
export interface IssueComment {
  id: number;
  body: string;
  createdAt: string;
}

/**
 * Result type for API calls
 */
export interface CommentResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Set mock issue details for testing
 */
export function setMockIssueDetails(issueNumber: number, details: IssueDetails): void {
  MockDataManager.getInstance().setIssueDetails(issueNumber, details);
}

/**
 * Set mock issue comments for testing
 */
export function setMockIssueComments(issueNumber: number, comments: IssueComment[]): void {
  MockDataManager.getInstance().setIssueComments(issueNumber, comments);
}

/**
 * Get mock issue comments for testing
 */
export function getMockIssueComments(issueNumber: number): IssueComment[] {
  return MockDataManager.getInstance().getIssueComments(issueNumber);
}

/**
 * Reset mock data
 */
export function resetMockCommentData(): void {
  MockDataManager.getInstance().clearCommentData();
}

/**
 * Get issue details including metadata
 *
 * @param issueNumber - GitHub issue number
 * @returns Issue details or error
 */
export async function getIssueDetails(issueNumber: number): Promise<CommentResult<IssueDetails>> {
  // Mock mode
  if (isMockMode) {
    const details = MockDataManager.getInstance().getIssueDetails(issueNumber);
    if (!details) {
      return {
        data: null,
        error: `Issue #${issueNumber} not found in mock data`,
      };
    }
    return { data: details, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to get issue details: ${response.status} ${errorText}`,
      };
    }

    const issue = await response.json();

    return {
      data: {
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state,
        createdAt: issue.created_at,
        closedAt: issue.closed_at,
        labels: issue.labels.map((label: { name: string }) => label.name),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * List all comments on an issue
 *
 * @param issueNumber - GitHub issue number
 * @returns Array of comments or error
 */
export async function listIssueComments(
  issueNumber: number
): Promise<CommentResult<IssueComment[]>> {
  // Mock mode
  if (isMockMode) {
    const comments = MockDataManager.getInstance().getIssueComments(issueNumber);
    return { data: comments, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to list issue comments: ${response.status} ${errorText}`,
      };
    }

    const comments = await response.json();

    return {
      data: comments.map((comment: { id: number; body: string; created_at: string }) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
      })),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create a comment on an issue
 *
 * @param issueNumber - GitHub issue number
 * @param body - Comment body (markdown supported)
 * @returns Created comment or error
 */
export async function createIssueComment(
  issueNumber: number,
  body: string
): Promise<CommentResult<IssueComment>> {
  // Mock mode
  if (isMockMode) {
    const newComment = MockDataManager.getInstance().addIssueComment(issueNumber, {
      body,
      createdAt: new Date().toISOString(),
    });

    return { data: newComment, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/comments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to create issue comment: ${response.status} ${errorText}`,
      };
    }

    const comment = await response.json();

    return {
      data: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if an evaluation comment with the given marker exists in the comments
 *
 * This is a pure function that searches for the marker in comment bodies.
 * The marker is an HTML comment that should be at the end of evaluation comments.
 *
 * @param comments - Array of issue comments to search
 * @param marker - The HTML comment marker to search for
 * @returns True if a comment with the marker exists
 *
 * @example
 * const marker = buildEvaluationMarker('react-refs', 123, 14);
 * const exists = hasEvaluationComment(comments, marker);
 */
export function hasEvaluationComment(comments: IssueComment[], marker: string): boolean {
  return comments.some((comment) => comment.body.includes(marker));
}

/**
 * Build an evaluation marker for idempotent comment posting
 *
 * The marker is an HTML comment that identifies a unique evaluation context:
 * - lesson_slug: Which lesson was evaluated
 * - issue: Which GitHub issue this relates to
 * - window: The evaluation window in days
 *
 * This marker should be appended to evaluation comments to prevent duplicates.
 *
 * @param lessonSlug - Lesson identifier
 * @param issueNumber - GitHub issue number
 * @param windowDays - Evaluation window in days
 * @returns HTML comment marker string
 *
 * @example
 * const marker = buildEvaluationMarker('react-refs', 123, 14);
 * // Returns: "<!-- eval:lesson_slug=react-refs issue=123 window=14 -->"
 */
export function buildEvaluationMarker(
  lessonSlug: string,
  issueNumber: number,
  windowDays: number
): string {
  return `<!-- eval:lesson_slug=${lessonSlug} issue=${issueNumber} window=${windowDays} -->`;
}
