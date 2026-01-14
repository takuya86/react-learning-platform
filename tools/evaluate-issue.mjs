#!/usr/bin/env node

/**
 * Evaluate Issue CLI Tool
 *
 * Evaluates the effectiveness of a lesson improvement based on GitHub Issue metadata.
 * Fetches learning events from Supabase, calculates before/after snapshots,
 * and posts an evaluation comment to the GitHub Issue.
 *
 * Usage:
 *   node tools/evaluate-issue.mjs --issue=123 [--window=14] [--dry-run]
 *
 * Options:
 *   --issue=N    Issue number to evaluate (required)
 *   --window=N   Evaluation window in days (default: 14)
 *   --dry-run    Show results without posting comment
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
// Constants (from src/features/metrics/constants.ts)
// ============================================================

const FOLLOW_UP_WINDOW_HOURS = 24;
const FOLLOW_UP_EVENT_TYPES = [
  'next_lesson_opened',
  'review_started',
  'quiz_started',
  'note_created',
];
const ORIGIN_EVENT_TYPES = ['lesson_viewed', 'lesson_completed'];
const MIN_ORIGIN_FOR_EVAL = 5;
const EVAL_RATE_DELTA_THRESHOLD = 0.05;

// ============================================================
// CLI Argument Parsing
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    issueNumber: null,
    windowDays: 14,
    dryRun: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--issue=')) {
      options.issueNumber = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--window=')) {
      options.windowDays = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
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

async function fetchIssueDetails(env, issueNumber) {
  const url = `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issueNumber}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch issue #${issueNumber}: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function postIssueComment(env, issueNumber, comment) {
  const url = `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issueNumber}/comments`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: comment }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to post comment to issue #${issueNumber}: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function listIssueComments(env, issueNumber) {
  const url = `https://api.github.com/repos/${env.VITE_GITHUB_OWNER}/${env.VITE_GITHUB_REPO}/issues/${issueNumber}/comments`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list comments for issue #${issueNumber}: ${response.status} ${errorText}`);
  }

  return response.json();
}

// ============================================================
// Issue Metadata Parsing
// ============================================================

const EVALUATION_MARKER = '<!-- EVALUATION_COMMENT -->';

function parseIssueMetadata(issueBody) {
  const metadata = {
    lessonSlug: null,
    hintType: null,
    baselineWindowDays: 30,
    baselineSnapshotAtUtc: null,
    originCount: 0,
    followUpRate: 0,
  };

  // Parse metadata section (YAML-like format at the end)
  const lessonSlugMatch = issueBody.match(/lesson_slug:\s*(\S+)/);
  const hintTypeMatch = issueBody.match(/hint_type:\s*(\S+)/);
  const baselineWindowMatch = issueBody.match(/baseline_window_days:\s*(\d+)/);
  const baselineSnapshotMatch = issueBody.match(/baseline_snapshot_at_utc:\s*(\S+)/);
  const originCountMatch = issueBody.match(/origin_count:\s*(\d+)/);
  const followUpRateMatch = issueBody.match(/follow_up_rate:\s*(\d+)/);

  if (lessonSlugMatch) metadata.lessonSlug = lessonSlugMatch[1];
  if (hintTypeMatch) metadata.hintType = hintTypeMatch[1];
  if (baselineWindowMatch) metadata.baselineWindowDays = parseInt(baselineWindowMatch[1], 10);
  if (baselineSnapshotMatch) metadata.baselineSnapshotAtUtc = baselineSnapshotMatch[1];
  if (originCountMatch) metadata.originCount = parseInt(originCountMatch[1], 10);
  if (followUpRateMatch) metadata.followUpRate = parseInt(followUpRateMatch[1], 10);

  return metadata;
}

// ============================================================
// Effectiveness Calculation (from evaluationService.ts)
// ============================================================

function getEventTimestamp(event) {
  if (event.created_at) {
    return new Date(event.created_at);
  }
  return new Date(event.event_date + 'T00:00:00Z');
}

function isOriginEvent(eventType) {
  return ORIGIN_EVENT_TYPES.includes(eventType);
}

function isFollowUpEvent(eventType) {
  return FOLLOW_UP_EVENT_TYPES.includes(eventType);
}

function buildEffectivenessSnapshot(events, input) {
  const { from, to, lessonSlug } = input;
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const followUpWindowMs = FOLLOW_UP_WINDOW_HOURS * 60 * 60 * 1000;

  // Filter events within window and matching lessonSlug
  const eventsInWindow = events.filter((event) => {
    const eventMs = getEventTimestamp(event).getTime();
    const matchesTime = eventMs >= fromMs && eventMs < toMs;
    const matchesLesson = event.reference_id === lessonSlug;
    return matchesTime && matchesLesson;
  });

  // Group events by user
  const eventsByUser = new Map();
  for (const event of eventsInWindow) {
    if (!eventsByUser.has(event.user_id)) {
      eventsByUser.set(event.user_id, []);
    }
    eventsByUser.get(event.user_id).push(event);
  }

  let originCount = 0;
  let followUpCount = 0;
  const followUpCounts = {};

  // Process each user's events
  for (const userEvents of eventsByUser.values()) {
    // Sort by timestamp
    const sortedEvents = [...userEvents].sort(
      (a, b) => getEventTimestamp(a).getTime() - getEventTimestamp(b).getTime()
    );

    // For each origin event, check if there's a follow-up within 24h
    for (const originEvent of sortedEvents) {
      if (!isOriginEvent(originEvent.event_type)) continue;

      originCount++;

      const originTime = getEventTimestamp(originEvent).getTime();
      const followUpWindowEnd = originTime + followUpWindowMs;

      // Track which follow-up types occurred within window
      const followUpTypesInWindow = new Set();
      let hasFollowUp = false;

      for (const e of sortedEvents) {
        if (!isFollowUpEvent(e.event_type)) continue;
        const eventTime = getEventTimestamp(e).getTime();
        if (eventTime > originTime && eventTime <= followUpWindowEnd) {
          hasFollowUp = true;
          followUpTypesInWindow.add(e.event_type);
        }
      }

      if (hasFollowUp) {
        followUpCount++;
      }

      // Increment counts for each follow-up type found
      for (const eventType of followUpTypesInWindow) {
        followUpCounts[eventType] = (followUpCounts[eventType] || 0) + 1;
      }
    }
  }

  // Calculate rate (0-1), handle 0 origins gracefully
  const followUpRate = originCount > 0 ? followUpCount / originCount : 0;

  return {
    originCount,
    followUpCount,
    followUpRate,
    followUpCounts,
  };
}

function getEvaluationStatus(deltaRate, afterOriginCount) {
  // Check sample size first
  if (afterOriginCount < MIN_ORIGIN_FOR_EVAL) {
    return 'LOW_SAMPLE';
  }

  // Check for significant improvement
  if (deltaRate >= EVAL_RATE_DELTA_THRESHOLD) {
    return 'IMPROVED';
  }

  // Check for significant regression
  if (deltaRate <= -EVAL_RATE_DELTA_THRESHOLD) {
    return 'REGRESSED';
  }

  // No significant change
  return 'NO_CHANGE';
}

function formatPercentagePoints(decimal) {
  const pp = Math.round(decimal * 100);
  return pp >= 0 ? `+${pp}pp` : `${pp}pp`;
}

function formatPercentage(decimal) {
  return `${Math.round(decimal * 100)}%`;
}

function formatDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

function buildEvaluationComment(delta, meta) {
  const { status, before, after, deltaRate, windowDays, note } = delta;
  const { issueNumber, lessonSlug, hintType, prUrl, beforePeriod, afterPeriod } = meta;

  // Status emoji
  const statusEmoji = {
    IMPROVED: '✅',
    REGRESSED: '⚠️',
    NO_CHANGE: 'ℹ️',
    LOW_SAMPLE: '📊',
  }[status];

  // Header
  let comment = `${EVALUATION_MARKER}\n\n`;
  comment += `## ${statusEmoji} Effectiveness Evaluation\n\n`;
  comment += `**Issue:** #${issueNumber}\n`;
  comment += `**Lesson:** \`${lessonSlug}\`\n`;
  comment += `**Hint Type:** \`${hintType}\`\n`;
  if (prUrl) {
    comment += `**PR:** ${prUrl}\n`;
  }
  comment += `**Evaluation Period:** ${windowDays} days (before/after)\n`;
  comment += `**Before Period:** ${beforePeriod}\n`;
  comment += `**After Period:** ${afterPeriod}\n\n`;

  // Status summary
  comment += `### Status: ${status}\n\n`;
  comment += `${note}\n\n`;

  // Before/After comparison table
  comment += `### Before/After Comparison\n\n`;
  comment += `| Metric | Before | After | Delta |\n`;
  comment += `|--------|--------|-------|-------|\n`;
  comment += `| Origin Events | ${before.originCount} | ${after.originCount} | ${formatDelta(
    after.originCount - before.originCount
  )} |\n`;
  comment += `| Follow-up Rate | ${formatPercentage(before.followUpRate)} | ${formatPercentage(
    after.followUpRate
  )} | ${formatPercentagePoints(deltaRate)} |\n`;
  comment += `| Follow-up Count | ${before.followUpCount} | ${after.followUpCount} | ${formatDelta(
    after.followUpCount - before.followUpCount
  )} |\n\n`;

  // Follow-up breakdown (if any)
  if (Object.keys(after.followUpCounts).length > 0) {
    comment += `### Follow-up Event Breakdown (After)\n\n`;
    comment += `| Event Type | Count |\n`;
    comment += `|------------|-------|\n`;
    for (const [eventType, count] of Object.entries(after.followUpCounts)) {
      comment += `| \`${eventType}\` | ${count} |\n`;
    }
    comment += `\n`;
  }

  // Recommendations based on status
  if (status === 'LOW_SAMPLE') {
    comment += `### Recommendation\n\n`;
    comment += `⚠️ Sample size is too small (${after.originCount} origin events). `;
    comment += `Consider waiting for more data (target: ${MIN_ORIGIN_FOR_EVAL}+ events) before evaluating effectiveness.\n\n`;
  } else if (status === 'REGRESSED') {
    comment += `### Recommendation\n\n`;
    comment += `⚠️ The improvement appears to have had a negative effect. `;
    comment += `Consider reverting the change or investigating why engagement decreased.\n\n`;
  } else if (status === 'IMPROVED') {
    comment += `### Recommendation\n\n`;
    comment += `✅ The improvement is effective! Consider applying similar changes to other lessons.\n\n`;
  }

  comment += `---\n\n`;
  comment += `_Auto-generated by evaluate-issue.mjs_\n`;

  return comment;
}

function generateStatusNote(status, deltaRate) {
  switch (status) {
    case 'IMPROVED':
      return `Follow-up rate improved by ${formatPercentagePoints(deltaRate)}`;
    case 'REGRESSED':
      return `Follow-up rate regressed by ${formatPercentagePoints(Math.abs(deltaRate))}`;
    case 'NO_CHANGE':
      return `Follow-up rate change is within ±5pp threshold (${formatPercentagePoints(deltaRate)})`;
    case 'LOW_SAMPLE':
      return 'Sample size too small for reliable evaluation (< 5 origin events)';
  }
}

// ============================================================
// Supabase Functions
// ============================================================

async function fetchLearningEvents(supabase, lessonSlug) {
  const { data, error } = await supabase
    .from('learning_events')
    .select('*')
    .eq('reference_id', lessonSlug)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch learning events: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// Main Evaluation Logic
// ============================================================

async function evaluateIssue(options) {
  const { issueNumber, windowDays, dryRun } = options;

  // Validate environment
  const env = validateEnvironment();

  console.log(`Evaluating Issue #${issueNumber}...`);
  console.log(`Window: ${windowDays} days`);
  console.log(`Dry Run: ${dryRun ? 'Yes' : 'No'}\n`);

  // 1. Fetch issue details
  console.log('Step 1: Fetching issue details...');
  const issue = await fetchIssueDetails(env, issueNumber);
  console.log(`✓ Issue #${issueNumber}: ${issue.title}\n`);

  // 2. Parse metadata from issue body
  console.log('Step 2: Parsing issue metadata...');
  const metadata = parseIssueMetadata(issue.body);

  if (!metadata.lessonSlug || !metadata.hintType) {
    throw new Error('Failed to parse lesson_slug or hint_type from issue body');
  }

  console.log(`✓ Lesson: ${metadata.lessonSlug}`);
  console.log(`✓ Hint Type: ${metadata.hintType}`);
  console.log(`✓ Baseline Snapshot: ${metadata.baselineSnapshotAtUtc || 'Not specified'}\n`);

  // 3. Check for existing evaluation comments (idempotent check)
  console.log('Step 3: Checking for existing evaluation comments...');
  const comments = await listIssueComments(env, issueNumber);
  const hasExistingEvaluation = comments.some((comment) => comment.body.includes(EVALUATION_MARKER));

  if (hasExistingEvaluation) {
    console.log('⚠️ Evaluation comment already exists. Skipping to maintain idempotency.\n');
    return;
  }
  console.log('✓ No existing evaluation found.\n');

  // 4. Determine before/after periods
  console.log('Step 4: Determining before/after periods...');

  const baselineDate = metadata.baselineSnapshotAtUtc
    ? new Date(metadata.baselineSnapshotAtUtc)
    : new Date();

  const beforeStart = new Date(baselineDate);
  beforeStart.setUTCDate(beforeStart.getUTCDate() - windowDays);
  const beforeEnd = baselineDate;

  const afterStart = new Date(baselineDate);
  afterStart.setUTCDate(afterStart.getUTCDate() + 6); // 6 days gap (assuming issue created shortly after baseline)
  const afterEnd = new Date(afterStart);
  afterEnd.setUTCDate(afterEnd.getUTCDate() + windowDays);

  const beforePeriod = `${beforeStart.toISOString().split('T')[0]} ~ ${beforeEnd.toISOString().split('T')[0]}`;
  const afterPeriod = `${afterStart.toISOString().split('T')[0]} ~ ${afterEnd.toISOString().split('T')[0]}`;

  console.log(`✓ Before Period: ${beforePeriod}`);
  console.log(`✓ After Period: ${afterPeriod}\n`);

  // 5. Fetch learning events from Supabase
  console.log('Step 5: Fetching learning events from Supabase...');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const events = await fetchLearningEvents(supabase, metadata.lessonSlug);
  console.log(`✓ Fetched ${events.length} events\n`);

  // 6. Build before/after snapshots
  console.log('Step 6: Building effectiveness snapshots...');
  const beforeSnapshot = buildEffectivenessSnapshot(events, {
    from: beforeStart.toISOString(),
    to: beforeEnd.toISOString(),
    lessonSlug: metadata.lessonSlug,
  });

  const afterSnapshot = buildEffectivenessSnapshot(events, {
    from: afterStart.toISOString(),
    to: afterEnd.toISOString(),
    lessonSlug: metadata.lessonSlug,
  });

  console.log(`✓ Before: ${beforeSnapshot.originCount} origins, ${formatPercentage(beforeSnapshot.followUpRate)} follow-up`);
  console.log(`✓ After: ${afterSnapshot.originCount} origins, ${formatPercentage(afterSnapshot.followUpRate)} follow-up\n`);

  // 7. Calculate delta and status
  console.log('Step 7: Calculating delta and status...');
  const deltaRate = afterSnapshot.followUpRate - beforeSnapshot.followUpRate;
  const status = getEvaluationStatus(deltaRate, afterSnapshot.originCount);
  const note = generateStatusNote(status, deltaRate);

  const delta = {
    status,
    before: beforeSnapshot,
    after: afterSnapshot,
    deltaRate,
    windowDays,
    note,
  };

  console.log(`✓ Status: ${status}`);
  console.log(`✓ Delta: ${formatPercentagePoints(deltaRate)}\n`);

  // 8. Build evaluation comment
  console.log('Step 8: Building evaluation comment...');
  const comment = buildEvaluationComment(delta, {
    issueNumber,
    lessonSlug: metadata.lessonSlug,
    hintType: metadata.hintType,
    prUrl: null, // TODO: Extract from issue body if needed
    beforePeriod,
    afterPeriod,
  });

  if (dryRun) {
    console.log('='.repeat(60));
    console.log('DRY RUN: Comment that would be posted:');
    console.log('='.repeat(60));
    console.log(comment);
    console.log('='.repeat(60));
    return;
  }

  // 9. Post comment to GitHub
  console.log('Step 9: Posting comment to GitHub...');
  await postIssueComment(env, issueNumber, comment);
  console.log(`✓ Comment posted successfully to Issue #${issueNumber}\n`);

  console.log('Evaluation completed successfully!');
}

// ============================================================
// Main Entry Point
// ============================================================

async function main() {
  const options = parseArgs();

  if (!options.issueNumber) {
    console.error('Error: --issue=N is required');
    console.error('');
    console.error('Usage: node tools/evaluate-issue.mjs --issue=123 [--window=14] [--dry-run]');
    process.exit(1);
  }

  try {
    await evaluateIssue(options);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
