#!/usr/bin/env node

/**
 * Lifecycle Runner CLI Tool
 *
 * Runs lifecycle evaluation on all open improvement issues.
 * Applies decisions (close/label) and records them for idempotency.
 *
 * Usage:
 *   node tools/run-lifecycle.mjs [--dry-run] [--label=lesson-improvement]
 *
 * Environment Variables:
 *   GITHUB_TOKEN           GitHub API token
 *   VITE_GITHUB_OWNER      Repository owner
 *   VITE_GITHUB_REPO       Repository name
 *   SUPABASE_URL           Supabase project URL
 *   SUPABASE_SERVICE_KEY   Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// Constants
// ============================================================

const LIFECYCLE_APPLIED_EVENT_TYPE = 'lifecycle_applied';
const SYSTEM_USER_ID = 'system';

// ============================================================
// CLI Argument Parsing
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    label: 'lesson-improvement',
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--label=')) {
      options.label = arg.split('=')[1];
    }
  }

  return options;
}

// ============================================================
// Environment Validation
// ============================================================

function validateEnvironment() {
  const required = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    VITE_GITHUB_OWNER: process.env.VITE_GITHUB_OWNER,
    VITE_GITHUB_REPO: process.env.VITE_GITHUB_REPO,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return required;
}

// ============================================================
// GitHub API Functions
// ============================================================

async function listOpenIssues(env, label) {
  const url = `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues?state=open&labels=${encodeURIComponent(label)}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list issues: ${response.status}`);
  }

  return response.json();
}

async function closeIssue(env, issueNumber, comment) {
  // Post comment first
  if (comment) {
    await fetch(
      `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: comment }),
      }
    );
  }

  // Then close
  const response = await fetch(
    `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'closed' }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to close issue #${issueNumber}: ${response.status}`);
  }
}

async function addLabel(env, issueNumber, label) {
  const response = await fetch(
    `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issueNumber}/labels`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labels: [label] }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add label to issue #${issueNumber}: ${response.status}`);
  }
}

// ============================================================
// Issue Metadata Parsing
// ============================================================

function parseIssueMetadata(issueBody) {
  const metadata = {
    lessonSlug: null,
    hintType: null,
  };

  const lessonSlugMatch = issueBody.match(/lesson_slug:\s*(\S+)/);
  const hintTypeMatch = issueBody.match(/hint_type:\s*(\S+)/);

  if (lessonSlugMatch) metadata.lessonSlug = lessonSlugMatch[1];
  if (hintTypeMatch) metadata.hintType = hintTypeMatch[1];

  return metadata;
}

// ============================================================
// Lifecycle Decision Logic (from improvementLifecycleService.ts)
// ============================================================

function determineLifecycle(status) {
  // Minimum 2 evaluations required
  if (status.evaluationCount < 2) {
    return {
      decision: 'CONTINUE',
      reason: '評価回数が不足',
      shouldClose: false,
      shouldAddLabel: false,
      labelToAdd: null,
    };
  }

  // No effect & no ROI → close
  if (status.effectivenessDelta <= 0 && status.roi <= 0) {
    return {
      decision: 'CLOSE_NO_EFFECT',
      reason: '効果指標の改善が見られない',
      shouldClose: true,
      shouldAddLabel: false,
      labelToAdd: null,
    };
  }

  // Effect exists but ROI negative → redesign required
  if (status.effectivenessDelta > 0 && status.roi < 0) {
    return {
      decision: 'REDESIGN_REQUIRED',
      reason: '効果はあるがROIが負',
      shouldClose: false,
      shouldAddLabel: true,
      labelToAdd: 'needs-redesign',
    };
  }

  return {
    decision: 'CONTINUE',
    reason: '継続監視',
    shouldClose: false,
    shouldAddLabel: false,
    labelToAdd: null,
  };
}

function buildCloseComment(status) {
  return `## 🔒 自動クローズ

この改善は以下の理由により自動クローズされました。

- 評価回数: ${status.evaluationCount}回
- 効果指標の改善が見られない
- ROIが正または中立に転じなかった

本判断は自動評価によるものであり、設計の失敗を責める意図はありません。

---
_Auto-closed by P5-2.3 Lifecycle Runner_`;
}

function buildRedesignComment(status, result) {
  return `## ⚠️ 再設計が必要です

この改善について、以下の状況が検出されました:

- 評価回数: ${status.evaluationCount}回
- 効果指標の改善: ${status.effectivenessDelta > 0 ? 'あり' : 'なし'} (Δ = ${status.effectivenessDelta.toFixed(2)})
- ROI: ${status.roi.toFixed(2)} (負の値)

効果は見られるものの、投資対効果が負の状態です。
実装コストや運用コストの見直しをご検討ください。

ラベル \`${result.labelToAdd}\` を付与しました。

---
_Auto-labeled by P5-2.3 Lifecycle Runner_`;
}

// ============================================================
// Supabase Functions
// ============================================================

async function fetchAppliedDecisions(supabase) {
  const { data, error } = await supabase
    .from('learning_events')
    .select('reference_id')
    .eq('event_type', LIFECYCLE_APPLIED_EVENT_TYPE);

  if (error) {
    throw new Error(`Failed to fetch applied decisions: ${error.message}`);
  }

  return new Set((data || []).map((row) => row.reference_id));
}

async function recordAppliedDecision(supabase, issueNumber, decision) {
  const today = new Date().toISOString().split('T')[0];
  const referenceId = `issue:${issueNumber}:${decision}`;

  const { error } = await supabase.from('learning_events').upsert(
    {
      user_id: SYSTEM_USER_ID,
      event_type: LIFECYCLE_APPLIED_EVENT_TYPE,
      reference_id: referenceId,
      event_date: today,
    },
    { onConflict: 'user_id,event_type,reference_id,event_date' }
  );

  if (error) {
    throw new Error(`Failed to record applied decision: ${error.message}`);
  }
}

async function fetchIssueMetrics(supabase, lessonSlug) {
  // For now, return mock data
  // In production, query learning_events and calculate delta/roi
  // This would use evaluationService and improvementRoiService logic
  return {
    effectivenessDelta: 0.03, // 3pp improvement (below threshold)
    roi: 0.5,
    evaluationCount: 2,
  };
}

// ============================================================
// Main Logic
// ============================================================

async function runLifecycle(options) {
  const { dryRun, label } = options;

  const env = validateEnvironment();
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  console.log('='.repeat(60));
  console.log('Lifecycle Runner');
  console.log('='.repeat(60));
  console.log(`Dry Run: ${dryRun ? 'Yes' : 'No'}`);
  console.log(`Label Filter: ${label}`);
  console.log('');

  // Fetch already applied decisions
  console.log('Fetching applied decisions...');
  const appliedSet = await fetchAppliedDecisions(supabase);
  console.log(`✓ Found ${appliedSet.size} previously applied decisions\n`);

  // Fetch open issues
  console.log('Fetching open issues...');
  const issues = await listOpenIssues(env, label);
  console.log(`✓ Found ${issues.length} open issues\n`);

  const summary = {
    processed: 0,
    skipped: 0,
    closed: 0,
    redesign: 0,
    continued: 0,
    errors: 0,
  };

  for (const issue of issues) {
    console.log(`\n--- Issue #${issue.number}: ${issue.title} ---`);

    try {
      // Parse metadata
      const metadata = parseIssueMetadata(issue.body || '');
      if (!metadata.lessonSlug) {
        console.log('⚠️ No lesson_slug found, skipping');
        summary.skipped++;
        continue;
      }
      console.log(`Lesson: ${metadata.lessonSlug}`);

      // Fetch metrics for the lesson
      const metrics = await fetchIssueMetrics(supabase, metadata.lessonSlug);
      console.log(`Metrics: delta=${metrics.effectivenessDelta.toFixed(2)}, roi=${metrics.roi.toFixed(2)}, count=${metrics.evaluationCount}`);

      // Determine lifecycle decision
      const status = {
        improvementId: metadata.lessonSlug,
        priorityScore: 0,
        effectivenessDelta: metrics.effectivenessDelta,
        roi: metrics.roi,
        evaluationCount: metrics.evaluationCount,
        lastEvaluatedAt: null,
      };

      const result = determineLifecycle(status);
      console.log(`Decision: ${result.decision} (${result.reason})`);

      // Check idempotency
      const referenceId = `issue:${issue.number}:${result.decision}`;
      if (result.decision !== 'CONTINUE' && appliedSet.has(referenceId)) {
        console.log('⏭️ Already applied, skipping');
        summary.skipped++;
        continue;
      }

      summary.processed++;

      // Execute decision
      if (result.decision === 'CONTINUE') {
        summary.continued++;
        console.log('✓ Continuing monitoring');
      } else if (result.decision === 'CLOSE_NO_EFFECT') {
        if (dryRun) {
          console.log('[DRY RUN] Would close issue');
        } else {
          const comment = buildCloseComment(status);
          await closeIssue(env, issue.number, comment);
          await recordAppliedDecision(supabase, issue.number, result.decision);
          console.log('✓ Issue closed');
        }
        summary.closed++;
      } else if (result.decision === 'REDESIGN_REQUIRED') {
        if (dryRun) {
          console.log('[DRY RUN] Would add needs-redesign label');
        } else {
          const comment = buildRedesignComment(status, result);
          // Comment first, then label (order matters)
          await fetch(
            `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issue.number}/comments`,
            {
              method: 'POST',
              headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${env.GITHUB_TOKEN}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ body: comment }),
            }
          );
          await addLabel(env, issue.number, result.labelToAdd);
          await recordAppliedDecision(supabase, issue.number, result.decision);
          console.log('✓ Label added');
        }
        summary.redesign++;
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      summary.errors++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Processed: ${summary.processed}`);
  console.log(`Skipped (idempotent): ${summary.skipped}`);
  console.log(`Closed: ${summary.closed}`);
  console.log(`Redesign: ${summary.redesign}`);
  console.log(`Continued: ${summary.continued}`);
  console.log(`Errors: ${summary.errors}`);
}

async function main() {
  const options = parseArgs();

  try {
    await runLifecycle(options);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
