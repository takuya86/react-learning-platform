/**
 * GitHub Issue Service for Lesson Improvement Automation
 *
 * P3-2.3: Automatically creates GitHub Issues for lessons needing improvement.
 * P5-2.2: Extended with Issue lifecycle management (close, label, process decisions)
 *
 * ## 発火条件（spec-lock）
 * - originCount >= 5
 * - improvementHint !== null
 * - hintType !== 'LOW_SAMPLE'
 * - 同一 lesson + hintType の Issue が Open で存在しない
 *
 * ## P5-2.2 新機能
 * - closeIssue: Issue をクローズ（コメント付き可能）
 * - addLabelToIssue: Issue にラベルを追加
 * - processLifecycleDecision: ライフサイクル判定に基づいて適切な処理を実行
 *   - CLOSE_NO_EFFECT: コメント + close
 *   - REDESIGN_REQUIRED: コメント + label追加
 *   - CONTINUE: 何もしない
 * - すべての操作は冪等性を持つ（重複実行されない）
 */

import { isMockMode } from '@/lib/supabase/client';
import { MockDataManager } from '@/lib/mock/MockDataManager';
import type { HintType } from '@/features/metrics';
import { logger } from '@/lib/logger';

// Environment variables for GitHub API
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

const ISSUE_LABEL_PREFIX = 'lesson-improvement';
const METRICS_LABEL = 'metrics';

/**
 * Parameters for creating a lesson improvement issue
 */
export interface CreateIssueParams {
  lessonSlug: string;
  lessonTitle: string;
  hintType: HintType;
  hintMessage: string;
  followUpRate: number;
  originCount: number;
  baselineWindowDays?: number;
  baselineSnapshotAtUtc?: string;
}

/**
 * Created issue info
 */
export interface CreatedIssue {
  number: number;
  url: string;
  title: string;
}

/**
 * Result type for API calls
 */
export interface IssueResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Lifecycle decision types for issue processing
 */
export type LifecycleDecision = 'CLOSE_NO_EFFECT' | 'REDESIGN_REQUIRED' | 'CONTINUE';

/**
 * Lifecycle evaluation result
 */
export interface LifecycleResult {
  decision: LifecycleDecision;
  comment: string;
  label?: string;
}

/**
 * Open issue info for duplicate checking
 */
export interface OpenIssue {
  number: number;
  url: string;
  title: string;
  labels: string[];
}

/**
 * Set mock open issues for testing
 */
export function setMockOpenIssues(issues: OpenIssue[]): void {
  MockDataManager.getInstance().setOpenIssues(issues);
}

/**
 * Set mock closed issues for testing
 */
export function setMockClosedIssues(issues: OpenIssue[]): void {
  MockDataManager.getInstance().setClosedIssues(issues);
}

/**
 * Get mock created issues for testing
 */
export function getMockCreatedIssues(): CreatedIssue[] {
  return MockDataManager.getInstance().getCreatedIssues();
}

/**
 * Reset mock data
 */
export function resetMockIssueData(): void {
  MockDataManager.getInstance().clearIssueData();
}

/**
 * Set mock issue state for testing (mock mode only)
 */
export function setMockIssueState(issueNumber: number, state: 'open' | 'closed'): void {
  MockDataManager.getInstance().setIssueState(issueNumber, state);
}

/**
 * Get mock issue state for testing (mock mode only)
 */
export function getMockIssueState(issueNumber: number): 'open' | 'closed' | null {
  return MockDataManager.getInstance().getIssueState(issueNumber) || null;
}

/**
 * Get mock issue labels for testing (mock mode only)
 */
export function getMockIssueLabels(issueNumber: number): string[] {
  return MockDataManager.getInstance().getIssueLabels(issueNumber);
}

/**
 * Get hint reason text for issue body
 */
function getHintReasonText(hintType: HintType): string {
  const reasons: Record<HintType, string> = {
    LOW_SAMPLE: 'サンプル数が少ないため判断保留中です。',
    NEXT_LESSON_WEAK:
      'Follow-up率が20%未満で、かつ next_lesson_opened が0件です。次のレッスンへの導線が弱い可能性があります。',
    CTA_MISSING:
      'review_started、quiz_started、note_created がすべて0件です。復習・クイズ・ノートへの導線が不足しています。',
    LOW_ENGAGEMENT:
      'Follow-up率が30%未満です。内容理解後の行動につながっていない可能性があります。',
  };
  return reasons[hintType];
}

/**
 * Get recommended actions for issue body
 */
function getRecommendedActions(hintType: HintType): string {
  const actions: Record<HintType, string> = {
    LOW_SAMPLE: '- より多くのユーザーにレッスンを閲覧してもらう施策を検討',
    NEXT_LESSON_WEAK: `- Next Lessons の関連を追加
- レッスン末尾に「次は○○を読む」文言を追加
- prerequisites / 関連レッスンの設定を確認`,
    CTA_MISSING: `- 「この内容をノートにまとめよう」CTAを追加
- クイズ・復習ボタンを本文下に配置
- Exercises の最後に行動を促す文言を追加`,
    LOW_ENGAGEMENT: `- Example を1つ追加（コピペで動くもの）
- Pitfalls を実例ベースに書き直す
- Exercises を3段階構成（易→中→難）に修正`,
  };
  return actions[hintType];
}

/**
 * Build issue body from params
 */
function buildIssueBody(params: CreateIssueParams): string {
  const {
    lessonTitle,
    lessonSlug,
    hintType,
    followUpRate,
    originCount,
    baselineWindowDays = 30,
    baselineSnapshotAtUtc = new Date().toISOString().split('T')[0] + 'T00:00:00Z',
  } = params;

  return `## 📉 検知された改善ヒント

- Lesson: **${lessonTitle}**
- Slug: \`${lessonSlug}\`
- Hint Type: **${hintType}**
- Follow-up Rate: **${followUpRate}%**
- Origin Count: ${originCount}

---

## 🔍 判定理由

${getHintReasonText(hintType)}

---

## 🛠 推奨アクション

${getRecommendedActions(hintType)}

---

## ✅ 改善チェックリスト

- [ ] Example を追加 / 改善
- [ ] 次のレッスン導線を追加
- [ ] CTA（復習 / クイズ / ノート）を配置
- [ ] validate:lessons を通過
- [ ] 改善後 7 日で followUpRate を再確認

---

## 📊 検証指標（改善後）

- Follow-up Rate が **+10%以上**
- next_lesson_opened / review / quiz / note のいずれかが増加

---

_Auto-generated by P3-2.3 Lesson Improvement Automation_

---
lesson_slug: ${lessonSlug}
hint_type: ${hintType}
baseline_window_days: ${baselineWindowDays}
baseline_snapshot_at_utc: ${baselineSnapshotAtUtc}
origin_count: ${originCount}
follow_up_rate: ${followUpRate}
---`;
}

/**
 * Build issue title
 * @note slug is included in parentheses for duplicate detection
 */
function buildIssueTitle(lessonSlug: string, lessonTitle: string, hintType: HintType): string {
  return `[Lesson Improvement] ${lessonTitle} (${lessonSlug}) - ${hintType}`;
}

/**
 * Get labels for the issue
 */
function getIssueLabels(lessonSlug: string, hintType: HintType): string[] {
  return [ISSUE_LABEL_PREFIX, METRICS_LABEL, `hint:${hintType}`, `lesson:${lessonSlug}`];
}

/**
 * Check if an issue with the same lesson and hint type already exists
 *
 * @spec-lock 同一 lesson + hintType の Issue が Open で存在しない
 */
export async function isDuplicateIssue(
  lessonSlug: string,
  hintType: HintType
): Promise<IssueResult<boolean>> {
  // Mock mode
  if (isMockMode) {
    const expectedTitle = `[Lesson Improvement]`;
    const hintLabel = `hint:${hintType}`;
    const mockOpenIssues = MockDataManager.getInstance().getOpenIssues();
    const isDuplicate = mockOpenIssues.some(
      (issue) =>
        issue.title.includes(expectedTitle) &&
        issue.title.includes(lessonSlug) &&
        issue.labels.includes(hintLabel)
    );
    return { data: isDuplicate, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const hintLabel = `hint:${hintType}`;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&labels=${ISSUE_LABEL_PREFIX},${hintLabel}`;

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
        error: `Failed to check issues: ${response.status} ${errorText}`,
      };
    }

    const issues = await response.json();

    // Check if any issue contains the lesson slug in title
    const isDuplicate = issues.some((issue: { title: string }) => issue.title.includes(lessonSlug));

    return { data: isDuplicate, error: null };
  } catch (err) {
    logger.error('Failed to check duplicate issue', {
      category: 'github',
      context: {
        function: 'isDuplicateIssue',
        lessonSlug,
        hintType,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * List open issues for a specific lesson
 */
export async function listOpenIssuesByLesson(
  lessonSlug: string
): Promise<IssueResult<OpenIssue[]>> {
  // Mock mode
  if (isMockMode) {
    const mockOpenIssues = MockDataManager.getInstance().getOpenIssues();
    const filtered = mockOpenIssues.filter((issue) => issue.title.includes(lessonSlug));
    return { data: filtered, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&labels=${ISSUE_LABEL_PREFIX}`;

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
        error: `Failed to list issues: ${response.status} ${errorText}`,
      };
    }

    const issues = await response.json();

    const filtered: OpenIssue[] = issues
      .filter((issue: { title: string }) => issue.title.includes(lessonSlug))
      .map(
        (issue: {
          number: number;
          html_url: string;
          title: string;
          labels: { name: string }[];
        }) => ({
          number: issue.number,
          url: issue.html_url,
          title: issue.title,
          labels: issue.labels.map((l) => l.name),
        })
      );

    return { data: filtered, error: null };
  } catch (err) {
    logger.error('Failed to list open issues by lesson', {
      category: 'github',
      context: {
        function: 'listOpenIssuesByLesson',
        lessonSlug,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create a lesson improvement issue
 *
 * @spec-lock
 * - originCount >= 5
 * - hintType !== 'LOW_SAMPLE'
 * - 重複チェック済みであること
 */
export async function createIssue(params: CreateIssueParams): Promise<IssueResult<CreatedIssue>> {
  const { lessonSlug, lessonTitle, hintType, originCount } = params;

  // Validate preconditions
  if (originCount < 5) {
    return {
      data: null,
      error: 'Cannot create issue: originCount must be >= 5',
    };
  }

  if (hintType === 'LOW_SAMPLE') {
    return {
      data: null,
      error: 'Cannot create issue for LOW_SAMPLE hint type',
    };
  }

  // Mock mode
  if (isMockMode) {
    const mockManager = MockDataManager.getInstance();
    const title = buildIssueTitle(lessonSlug, lessonTitle, hintType);
    const issueNumber = mockManager.getCreatedIssues().length + 1;
    const issue: CreatedIssue = {
      number: issueNumber,
      url: `https://github.com/mock/repo/issues/${issueNumber}`,
      title,
    };
    mockManager.addCreatedIssue(issue);

    const labels = getIssueLabels(lessonSlug, hintType);

    // Also add to open issues for duplicate detection
    const currentOpenIssues = mockManager.getOpenIssues();
    mockManager.setOpenIssues([
      ...currentOpenIssues,
      {
        ...issue,
        labels,
      },
    ]);

    // Initialize mock state and labels
    mockManager.setIssueState(issueNumber, 'open');
    mockManager.setIssueLabels(issueNumber, labels);

    return { data: issue, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const title = buildIssueTitle(lessonSlug, lessonTitle, hintType);
    const body = buildIssueBody(params);
    const labels = getIssueLabels(lessonSlug, hintType);

    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to create issue: ${response.status} ${errorText}`,
      };
    }

    const created = await response.json();

    return {
      data: {
        number: created.number,
        url: created.html_url,
        title: created.title,
      },
      error: null,
    };
  } catch (err) {
    logger.error('Failed to create issue', {
      category: 'github',
      context: {
        function: 'createIssue',
        lessonSlug: params.lessonSlug,
        hintType: params.hintType,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if issue creation is allowed for given params
 *
 * @spec-lock 発火条件チェック
 */
export function canCreateIssue(originCount: number, hintType: HintType | null): boolean {
  if (originCount < 5) return false;
  if (hintType === null) return false;
  if (hintType === 'LOW_SAMPLE') return false;
  return true;
}

/**
 * Improvement tracker item with baseline and current metrics
 */
export interface ImprovementTrackerItem {
  lessonSlug: string;
  hintType: HintType;
  baselineRate: number;
  baselineOriginCount: number;
  issueNumber: number;
  issueUrl: string;
}

/**
 * Parse baseline metrics from issue body
 *
 * Extracts baseline data from markdown format:
 * - Follow-up Rate: **XX%**
 * - Origin Count: XX
 * Also tries to parse from metadata section at the end
 */
function parseBaselineFromIssueBody(body: string): {
  baselineRate: number;
  baselineOriginCount: number;
} {
  // Try to parse from metadata section first (more reliable)
  const metadataRateMatch = body.match(/follow_up_rate:\s*(\d+)/);
  const metadataCountMatch = body.match(/origin_count:\s*(\d+)/);

  if (metadataRateMatch && metadataCountMatch) {
    return {
      baselineRate: parseInt(metadataRateMatch[1], 10),
      baselineOriginCount: parseInt(metadataCountMatch[1], 10),
    };
  }

  // Fallback to parsing from main content
  const rateMatch = body.match(/Follow-up Rate:\s*\*\*(\d+)%\*\*/);
  const countMatch = body.match(/Origin Count:\s*(\d+)/);

  return {
    baselineRate: rateMatch ? parseInt(rateMatch[1], 10) : 0,
    baselineOriginCount: countMatch ? parseInt(countMatch[1], 10) : 0,
  };
}

/**
 * List all open improvement issues with their baseline metrics
 *
 * This function retrieves all open issues with the lesson-improvement label
 * and extracts baseline metrics from the issue body.
 *
 * @returns Array of improvement tracker items
 */
export async function listAllOpenImprovementIssues(): Promise<
  IssueResult<ImprovementTrackerItem[]>
> {
  // Mock mode
  if (isMockMode) {
    const mockOpenIssues = MockDataManager.getInstance().getOpenIssues();
    const trackerItems: ImprovementTrackerItem[] = mockOpenIssues
      .filter((issue) => issue.labels.includes(ISSUE_LABEL_PREFIX))
      .map((issue) => {
        // Extract lesson slug from title: "[Lesson Improvement] Title (slug) - HINT_TYPE"
        const slugMatch = issue.title.match(/\(([^)]+)\)/);
        const lessonSlug = slugMatch ? slugMatch[1] : '';

        // Extract hint type from labels
        const hintLabel = issue.labels.find((label) => label.startsWith('hint:'));
        const hintType = (hintLabel?.replace('hint:', '') || 'LOW_ENGAGEMENT') as HintType;

        // For mock mode, use dummy baseline values
        return {
          lessonSlug,
          hintType,
          baselineRate: 15,
          baselineOriginCount: 10,
          issueNumber: issue.number,
          issueUrl: issue.url,
        };
      });

    return { data: trackerItems, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open&labels=${ISSUE_LABEL_PREFIX}`;

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
        error: `Failed to list improvement issues: ${response.status} ${errorText}`,
      };
    }

    const issues = await response.json();

    const trackerItems: ImprovementTrackerItem[] = issues.map(
      (issue: {
        number: number;
        html_url: string;
        title: string;
        body: string;
        labels: { name: string }[];
      }) => {
        // Extract lesson slug from title
        const slugMatch = issue.title.match(/\(([^)]+)\)/);
        const lessonSlug = slugMatch ? slugMatch[1] : '';

        // Extract hint type from labels
        const hintLabel = issue.labels.find((label) => label.name.startsWith('hint:'));
        const hintType = (hintLabel?.name.replace('hint:', '') || 'LOW_ENGAGEMENT') as HintType;

        // Parse baseline from issue body
        const { baselineRate, baselineOriginCount } = parseBaselineFromIssueBody(issue.body || '');

        return {
          lessonSlug,
          hintType,
          baselineRate,
          baselineOriginCount,
          issueNumber: issue.number,
          issueUrl: issue.html_url,
        };
      }
    );

    return { data: trackerItems, error: null };
  } catch (err) {
    logger.error('Failed to list open improvement issues', {
      category: 'github',
      context: {
        function: 'listAllOpenImprovementIssues',
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * List all closed improvement issues with their baseline metrics
 *
 * This function retrieves all closed issues with the lesson-improvement label
 * and extracts baseline metrics and metadata from the issue body.
 *
 * @returns Array of improvement tracker items for closed issues
 */
export async function listAllClosedImprovementIssues(): Promise<
  IssueResult<ImprovementTrackerItem[]>
> {
  // Mock mode
  if (isMockMode) {
    const mockClosedIssues = MockDataManager.getInstance().getClosedIssues();
    const trackerItems: ImprovementTrackerItem[] = mockClosedIssues
      .filter((issue) => issue.labels.includes(ISSUE_LABEL_PREFIX))
      .map((issue) => {
        // Extract lesson slug from title: "[Lesson Improvement] Title (slug) - HINT_TYPE"
        const slugMatch = issue.title.match(/\(([^)]+)\)/);
        const lessonSlug = slugMatch ? slugMatch[1] : '';

        // Extract hint type from labels
        const hintLabel = issue.labels.find((label) => label.startsWith('hint:'));
        const hintType = (hintLabel?.replace('hint:', '') || 'LOW_ENGAGEMENT') as HintType;

        // For mock mode, use dummy baseline values
        return {
          lessonSlug,
          hintType,
          baselineRate: 15,
          baselineOriginCount: 10,
          issueNumber: issue.number,
          issueUrl: issue.url,
        };
      });

    return { data: trackerItems, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=closed&labels=${ISSUE_LABEL_PREFIX}`;

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
        error: `Failed to list closed improvement issues: ${response.status} ${errorText}`,
      };
    }

    const issues = await response.json();

    const trackerItems: ImprovementTrackerItem[] = issues.map(
      (issue: {
        number: number;
        html_url: string;
        title: string;
        body: string;
        labels: { name: string }[];
      }) => {
        // Extract lesson slug from title
        const slugMatch = issue.title.match(/\(([^)]+)\)/);
        const lessonSlug = slugMatch ? slugMatch[1] : '';

        // Extract hint type from labels
        const hintLabel = issue.labels.find((label) => label.name.startsWith('hint:'));
        const hintType = (hintLabel?.name.replace('hint:', '') || 'LOW_ENGAGEMENT') as HintType;

        // Parse baseline from issue body
        const { baselineRate, baselineOriginCount } = parseBaselineFromIssueBody(issue.body || '');

        return {
          lessonSlug,
          hintType,
          baselineRate,
          baselineOriginCount,
          issueNumber: issue.number,
          issueUrl: issue.html_url,
        };
      }
    );

    return { data: trackerItems, error: null };
  } catch (err) {
    logger.error('Failed to list closed improvement issues', {
      category: 'github',
      context: {
        function: 'listAllClosedImprovementIssues',
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Close a GitHub issue with an optional comment
 *
 * P5-2.2: Close issue functionality for lifecycle automation
 *
 * @param issueNumber - GitHub issue number to close
 * @param comment - Optional comment to post before closing
 * @returns Success or error result
 */
export async function closeIssue(
  issueNumber: number,
  comment?: string
): Promise<IssueResult<void>> {
  // Mock mode
  if (isMockMode) {
    const mockManager = MockDataManager.getInstance();
    const currentState = mockManager.getIssueState(issueNumber);
    if (currentState === 'closed') {
      // Already closed - idempotent behavior
      return { data: undefined, error: null };
    }

    // Post comment first if provided
    if (comment) {
      const { createIssueComment } = await import('./githubIssueCommentService');
      const commentResult = await createIssueComment(issueNumber, comment);
      if (commentResult.error) {
        return { data: null, error: commentResult.error };
      }
    }

    // Update state to closed
    setMockIssueState(issueNumber, 'closed');
    return { data: undefined, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    // Post comment first if provided
    if (comment) {
      const { createIssueComment } = await import('./githubIssueCommentService');
      const commentResult = await createIssueComment(issueNumber, comment);
      if (commentResult.error) {
        return { data: null, error: commentResult.error };
      }
    }

    // Close the issue
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: 'closed',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to close issue: ${response.status} ${errorText}`,
      };
    }

    return { data: undefined, error: null };
  } catch (err) {
    logger.error('Failed to close issue', {
      category: 'github',
      context: {
        function: 'closeIssue',
        issueNumber,
        hasComment: !!comment,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Add a label to a GitHub issue
 *
 * P5-2.2: Add label functionality for lifecycle automation
 *
 * @param issueNumber - GitHub issue number
 * @param label - Label to add
 * @returns Success or error result
 */
export async function addLabelToIssue(
  issueNumber: number,
  label: string
): Promise<IssueResult<void>> {
  // Mock mode
  if (isMockMode) {
    const mockManager = MockDataManager.getInstance();
    const existingLabels = mockManager.getIssueLabels(issueNumber);

    // Idempotent - don't add if already present
    if (existingLabels.includes(label)) {
      return { data: undefined, error: null };
    }

    mockManager.addIssueLabel(issueNumber, label);

    // Also update the mockOpenIssues or mockClosedIssues
    const updateIssueLabels = (issues: OpenIssue[]) => {
      const issue = issues.find((i) => i.number === issueNumber);
      if (issue && !issue.labels.includes(label)) {
        issue.labels.push(label);
      }
    };

    const mockOpenIssues = mockManager.getOpenIssues();
    const mockClosedIssues = mockManager.getClosedIssues();
    updateIssueLabels(mockOpenIssues);
    updateIssueLabels(mockClosedIssues);
    // Update the manager with modified arrays
    mockManager.setOpenIssues(mockOpenIssues);
    mockManager.setClosedIssues(mockClosedIssues);

    return { data: undefined, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/labels`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labels: [label],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to add label: ${response.status} ${errorText}`,
      };
    }

    return { data: undefined, error: null };
  } catch (err) {
    logger.error('Failed to add label to issue', {
      category: 'github',
      context: {
        function: 'addLabelToIssue',
        issueNumber,
        label,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Process a lifecycle decision and take appropriate action
 *
 * P5-2.2: Process lifecycle evaluation results
 *
 * Actions by decision:
 * - CLOSE_NO_EFFECT: Post comment and close issue
 * - REDESIGN_REQUIRED: Post comment and add label
 * - CONTINUE: Do nothing
 *
 * This function is idempotent - it can be called multiple times with the same result.
 *
 * @param issueNumber - GitHub issue number
 * @param result - Lifecycle evaluation result
 * @returns Success or error result
 */
export async function processLifecycleDecision(
  issueNumber: number,
  result: LifecycleResult
): Promise<IssueResult<void>> {
  switch (result.decision) {
    case 'CLOSE_NO_EFFECT':
      // Close with comment
      return await closeIssue(issueNumber, result.comment);

    case 'REDESIGN_REQUIRED': {
      // Add label and comment
      if (result.label) {
        const labelResult = await addLabelToIssue(issueNumber, result.label);
        if (labelResult.error) {
          return labelResult;
        }
      }

      // Post comment
      const { createIssueComment } = await import('./githubIssueCommentService');
      const commentResult = await createIssueComment(issueNumber, result.comment);
      if (commentResult.error) {
        return { data: null, error: commentResult.error };
      }

      return { data: undefined, error: null };
    }

    case 'CONTINUE':
      // Do nothing
      return { data: undefined, error: null };

    default:
      return {
        data: null,
        error: `Unknown lifecycle decision: ${result.decision}`,
      };
  }
}
