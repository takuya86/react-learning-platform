#!/usr/bin/env node

/**
 * Lesson Validator (Quality Gate)
 *
 * Validates lessons.backlog.json and MDX files for quality issues
 *
 * Usage:
 *   node tools/validate-lessons.mjs [--strict]
 *
 * Options:
 *   --strict    Treat warnings as errors (for CI)
 *
 * Backlog Checks:
 *   - slug uniqueness
 *   - required frontmatter keys
 *   - tags not empty
 *   - estimatedMinutes is a positive number
 *   - difficulty is valid
 *
 * MDX Quality Gates:
 *   - TODO comments in content (warn)
 *   - Example section has code blocks (error if empty)
 *   - At least 3 Exercises (error if less)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKLOG_PATH = path.join(ROOT_DIR, 'lessons.backlog.json');
const LESSONS_DIR = path.join(ROOT_DIR, 'src', 'content', 'lessons');

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const VALID_STATUSES = ['pending', 'generated', 'published'];

// Parse CLI arguments
const isStrict = process.argv.includes('--strict');

// Validation collectors
const errors = [];
const warnings = [];

function error(slug, message) {
  errors.push({ slug, message });
  console.error(`❌ [${slug}] ${message}`);
}

function warn(slug, message) {
  warnings.push({ slug, message });
  console.warn(`⚠️  [${slug}] ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

// Validate a single backlog lesson entry
function validateBacklogEntry(lesson, index, existingSlugs) {
  const slug = lesson.slug || `index-${index}`;

  // Required fields
  if (!lesson.slug || typeof lesson.slug !== 'string') {
    error(slug, "missing or invalid 'slug'");
  } else {
    if (existingSlugs.has(lesson.slug)) {
      error(slug, `duplicate slug`);
    }
    existingSlugs.add(lesson.slug);
  }

  if (!lesson.title || typeof lesson.title !== 'string') {
    error(slug, "missing or invalid 'title'");
  }

  if (!lesson.description || typeof lesson.description !== 'string') {
    error(slug, "missing or invalid 'description'");
  }

  // Tags validation
  if (!Array.isArray(lesson.tags)) {
    error(slug, "'tags' must be an array");
  } else if (lesson.tags.length === 0) {
    error(slug, "'tags' cannot be empty");
  }

  // Difficulty validation
  if (!VALID_DIFFICULTIES.includes(lesson.difficulty)) {
    error(slug, `invalid 'difficulty' (must be: ${VALID_DIFFICULTIES.join(', ')})`);
  }

  // estimatedMinutes validation
  if (typeof lesson.estimatedMinutes !== 'number' || lesson.estimatedMinutes <= 0) {
    error(slug, "'estimatedMinutes' must be a positive number");
  }

  // Status validation
  if (!VALID_STATUSES.includes(lesson.status)) {
    error(slug, `invalid 'status' (must be: ${VALID_STATUSES.join(', ')})`);
  }
}

// Check if MDX uses new template format (has Objectives section)
function isNewTemplateFormat(content) {
  return content.includes('## 学習目標') ||
         content.includes('## Objectives') ||
         content.includes('## 最小動作例') ||
         content.includes('## よくある落とし穴');
}

// Validate MDX file content (quality gates)
function validateMDXContent(filepath, slug) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const isNewFormat = isNewTemplateFormat(content);

  // 1. Check for TODO comments (applies to all)
  const todoMatches = content.match(/<!--\s*TODO[^>]*-->/g) || [];
  const todoCount = todoMatches.length;
  if (todoCount > 0) {
    warn(slug, `${todoCount} TODO comment(s) remaining in content`);
  }

  // Quality gates below only apply to new template format
  if (!isNewFormat) {
    // Skip strict checks for legacy migrated content
    return;
  }

  // 2. Check Example section has code blocks
  const exampleSection = extractSection(content, '最小動作例') || extractSection(content, 'Example');
  if (exampleSection) {
    const codeBlocks = exampleSection.match(/```[\s\S]*?```/g) || [];
    const hasRealCode = codeBlocks.some(block => {
      // Remove the fence markers and check if there's actual code
      const codeContent = block.replace(/```\w*\n?/g, '').replace(/```/g, '').trim();
      // Check if it's not just TODO comments
      const isOnlyTodo = /^\/\/\s*TODO/.test(codeContent) && codeContent.split('\n').length <= 3;
      return codeContent.length > 0 && !isOnlyTodo;
    });

    if (codeBlocks.length === 0 || !hasRealCode) {
      error(slug, "Example section must contain a working code block");
    }
  }

  // 3. Check for at least 3 exercises
  const exercisesSection = extractSection(content, '練習問題') || extractSection(content, 'Exercises');
  if (exercisesSection) {
    // Count exercises - support multiple formats:
    // - ### 練習1: or ### Exercise 1 (new format with headings)
    // - 1. 2. 3. numbered list items (old format)
    const headingFormat = exercisesSection.match(/^###\s+練習\d*[:：]?/gm) ||
                          exercisesSection.match(/^###\s+Exercise\s*\d*/gmi) || [];
    const listFormat = exercisesSection.match(/^\d+\.\s+/gm) || [];

    // Use whichever format has more items
    const exerciseCount = Math.max(headingFormat.length, listFormat.length);

    if (exerciseCount < 3) {
      error(slug, `Exercises section needs at least 3 exercises (found ${exerciseCount})`);
    }
  }

  // 4. Check for Pitfalls section with at least 2 items
  const pitfallsSection = extractSection(content, '落とし穴') || extractSection(content, 'Pitfalls');
  if (pitfallsSection) {
    const pitfallHeadings = pitfallsSection.match(/^###\s+\d+\./gm) || [];
    if (pitfallHeadings.length < 2) {
      warn(slug, `Pitfalls section should have at least 2 items (found ${pitfallHeadings.length})`);
    }
  }

  // 5. Check for Objectives section with at least 3 items
  const objectivesSection = extractSection(content, '学習目標') || extractSection(content, 'Objectives');
  if (objectivesSection) {
    const objectives = objectivesSection.match(/^\d+\.\s+/gm) || [];
    // Filter out TODO items
    const realObjectives = objectives.filter((_, i) => {
      const lines = objectivesSection.split('\n');
      const objectiveLines = lines.filter(l => /^\d+\.\s+/.test(l));
      return objectiveLines[i] && !objectiveLines[i].includes('TODO');
    });

    if (realObjectives.length < 3) {
      warn(slug, `Objectives section should have at least 3 items (found ${realObjectives.length})`);
    }
  }
}

// Extract a section from MDX content by heading
function extractSection(content, headingText) {
  // Match ## heading or variations
  const regex = new RegExp(`^##\\s+.*${headingText}.*$`, 'im');
  const match = content.match(regex);

  if (!match) return null;

  const startIndex = match.index + match[0].length;

  // Find the next ## heading
  const restContent = content.slice(startIndex);
  const nextHeadingMatch = restContent.match(/^##\s+/m);

  if (nextHeadingMatch) {
    return restContent.slice(0, nextHeadingMatch.index);
  }

  return restContent;
}

// Main function
async function main() {
  console.log('Lesson Validator (Quality Gate)');
  console.log('================================');
  console.log(`Mode: ${isStrict ? 'STRICT (warnings are errors)' : 'Normal'}`);
  console.log('');

  // Read backlog
  if (!fs.existsSync(BACKLOG_PATH)) {
    error('backlog', `Backlog file not found at ${BACKLOG_PATH}`);
    process.exit(1);
  }

  let backlog;
  try {
    backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, 'utf-8'));
  } catch (e) {
    error('backlog', `Failed to parse backlog JSON: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(backlog.lessons)) {
    error('backlog', "'lessons' must be an array");
    process.exit(1);
  }

  console.log('--- Backlog Validation ---');
  const existingSlugs = new Set();
  for (let i = 0; i < backlog.lessons.length; i++) {
    validateBacklogEntry(backlog.lessons[i], i, existingSlugs);
  }

  // Get existing MDX files and validate content
  console.log('');
  console.log('--- MDX Content Validation ---');

  if (fs.existsSync(LESSONS_DIR)) {
    const files = fs.readdirSync(LESSONS_DIR).filter(f => f.endsWith('.mdx'));

    for (const file of files) {
      const slug = file.replace('.mdx', '');
      const filepath = path.join(LESSONS_DIR, file);
      validateMDXContent(filepath, slug);
    }

    if (files.length === 0) {
      console.log('(No MDX files found)');
    }
  } else {
    console.log('(Lessons directory not found)');
  }

  // Summary
  console.log('');
  console.log('--- Summary ---');
  console.log(`Backlog entries: ${backlog.lessons.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  // In strict mode, treat warnings as errors
  const hasFailures = isStrict
    ? errors.length > 0 || warnings.length > 0
    : errors.length > 0;

  if (hasFailures) {
    console.log('');
    console.log('❌ Validation FAILED');

    if (errors.length > 0) {
      console.log('');
      console.log('Failed slugs (errors):');
      const errorSlugs = [...new Set(errors.map(e => e.slug))];
      errorSlugs.forEach(slug => {
        const slugErrors = errors.filter(e => e.slug === slug);
        console.log(`  - ${slug}: ${slugErrors.map(e => e.message).join('; ')}`);
      });
    }

    if (isStrict && warnings.length > 0) {
      console.log('');
      console.log('Failed slugs (warnings in strict mode):');
      const warnSlugs = [...new Set(warnings.map(w => w.slug))];
      warnSlugs.forEach(slug => {
        const slugWarnings = warnings.filter(w => w.slug === slug);
        console.log(`  - ${slug}: ${slugWarnings.map(w => w.message).join('; ')}`);
      });
    }

    process.exit(1);
  }

  console.log('');
  success('All validations passed!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
