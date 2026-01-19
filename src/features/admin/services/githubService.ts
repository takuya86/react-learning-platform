import { isMockMode } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// Environment variables for GitHub API
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

const WORKFLOW_FILE = 'lesson-scheduler.yml';
const LESSON_PR_LABEL = 'lesson';

interface WorkflowDispatchResult {
  data: { triggered: boolean } | null;
  error: string | null;
}

interface PRInfo {
  exists: boolean;
  url?: string;
  number?: number;
  title?: string;
}

interface PRCheckResult {
  data: PRInfo | null;
  error: string | null;
}

/**
 * Trigger the lesson generation workflow via GitHub API workflow_dispatch
 */
export async function triggerLessonWorkflow(
  slugs: string[],
  maxLessons: number
): Promise<WorkflowDispatchResult> {
  // Mock mode: return success immediately
  if (isMockMode) {
    return { data: { triggered: true }, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error:
        'GitHub API credentials not configured (VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, VITE_GITHUB_REPO)',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          max_lessons: String(maxLessons),
          selected_slugs: slugs.join(','),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: `Failed to trigger workflow: ${response.status} ${errorText}`,
      };
    }

    // workflow_dispatch returns 204 No Content on success
    return { data: { triggered: true }, error: null };
  } catch (err) {
    logger.error('Failed to trigger lesson workflow', {
      category: 'github',
      context: {
        function: 'triggerLessonWorkflow',
        slugs,
        maxLessons,
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
 * Check if there's an existing open PR with the lesson label
 */
export async function checkExistingLessonPR(): Promise<PRCheckResult> {
  // Mock mode: return no existing PR
  if (isMockMode) {
    return { data: { exists: false }, error: null };
  }

  // Check for required env vars
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return {
      data: null,
      error: 'GitHub API credentials not configured',
    };
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=open&labels=${LESSON_PR_LABEL}`;

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
        error: `Failed to check existing PRs: ${response.status} ${errorText}`,
      };
    }

    const prs = await response.json();

    if (prs.length > 0) {
      const pr = prs[0];
      return {
        data: {
          exists: true,
          url: pr.html_url,
          number: pr.number,
          title: pr.title,
        },
        error: null,
      };
    }

    return { data: { exists: false }, error: null };
  } catch (err) {
    logger.error('Failed to check existing lesson PR', {
      category: 'github',
      context: {
        function: 'checkExistingLessonPR',
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
