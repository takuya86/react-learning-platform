#!/usr/bin/env node

/**
 * Lesson MDX Generator
 *
 * Generates MDX scaffold files from lessons.backlog.json
 *
 * Usage:
 *   node tools/generate-lessons.mjs [--max=N] [--dry-run] [--slugs=slug1,slug2,...]
 *
 * Options:
 *   --max=N              Maximum number of lessons to generate (default: 3)
 *   --dry-run            Show what would be generated without writing files
 *   --slugs=slug1,slug2  Comma-separated slugs to generate (overrides auto-selection)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKLOG_PATH = path.join(ROOT_DIR, 'lessons.backlog.json');
const LESSONS_DIR = path.join(ROOT_DIR, 'src', 'content', 'lessons');

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    max: 3,
    dryRun: false,
    slugs: [],
  };

  for (const arg of args) {
    if (arg.startsWith('--max=')) {
      options.max = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--slugs=')) {
      const slugsStr = arg.split('=')[1];
      options.slugs = slugsStr ? slugsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
  }

  return options;
}

// Generate MDX content from lesson metadata
function generateMDXContent(lesson) {
  const prerequisites = lesson.prerequisites || [];
  const relatedQuizzes = lesson.relatedQuizzes || [];

  const frontmatter = [
    '---',
    `title: '${lesson.title}'`,
    `slug: '${lesson.slug}'`,
    `description: '${lesson.description}'`,
    `tags: [${lesson.tags.map(t => `'${t}'`).join(', ')}]`,
    `difficulty: '${lesson.difficulty}'`,
    `estimatedMinutes: ${lesson.estimatedMinutes}`,
    `prerequisites: [${prerequisites.map(p => `'${p}'`).join(', ')}]`,
    `relatedQuizzes: [${relatedQuizzes.map(q => `'${q}'`).join(', ')}]`,
    '---',
  ].join('\n');

  const body = `
# ${lesson.title}

## 学習目標（Objectives）

このレッスンを完了すると、以下ができるようになります：

1. <!-- TODO: 学習目標1 -->
2. <!-- TODO: 学習目標2 -->
3. <!-- TODO: 学習目標3 -->

## 概要

${lesson.description}

## 本文

<!-- TODO: レッスンの本文をここに記述 -->

### セクション1

内容をここに記述...

### セクション2

内容をここに記述...

## 最小動作例（Example）

以下は動作する最小のコード例です：

\`\`\`tsx
// TODO: 動作する最小コード例を記述
import { useState } from 'react';

function Example() {
  // 実装をここに
  return <div>Example</div>;
}
\`\`\`

## よくある落とし穴（Pitfalls）

### 1. <!-- TODO: 落とし穴1のタイトル -->

<!-- TODO: 落とし穴1の説明と回避方法 -->

\`\`\`tsx
// ❌ 間違い
// TODO: 間違ったコード例

// ✅ 正しい
// TODO: 正しいコード例
\`\`\`

### 2. <!-- TODO: 落とし穴2のタイトル -->

<!-- TODO: 落とし穴2の説明と回避方法 -->

## まとめ

このレッスンで学んだこと:

1. <!-- TODO: ポイント1 -->
2. <!-- TODO: ポイント2 -->
3. <!-- TODO: ポイント3 -->

## 練習問題（Exercises）

### 練習1: <!-- TODO: タイトル -->

<!-- TODO: 問題文 -->

### 練習2: <!-- TODO: タイトル -->

<!-- TODO: 問題文 -->

### 練習3: <!-- TODO: タイトル -->

<!-- TODO: 問題文 -->
`;

  return frontmatter + '\n' + body;
}

// Main function
async function main() {
  const options = parseArgs();

  console.log('Lesson Generator');
  console.log('================');
  console.log(`Max lessons: ${options.max}`);
  console.log(`Dry run: ${options.dryRun}`);
  if (options.slugs.length > 0) {
    console.log(`Selected slugs: ${options.slugs.join(', ')}`);
  }
  console.log('');

  // Read backlog
  if (!fs.existsSync(BACKLOG_PATH)) {
    console.error(`Error: Backlog file not found at ${BACKLOG_PATH}`);
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, 'utf-8'));

  // Filter pending lessons
  let pendingLessons = backlog.lessons.filter(l => l.status === 'pending');
  console.log(`Found ${pendingLessons.length} pending lessons`);

  // If specific slugs are provided, filter to only those
  if (options.slugs.length > 0) {
    pendingLessons = pendingLessons.filter(l => options.slugs.includes(l.slug));
    console.log(`Filtered to ${pendingLessons.length} matching slugs`);
  }

  if (pendingLessons.length === 0) {
    console.log('No pending lessons to generate.');
    return;
  }

  // Select lessons to generate (up to max)
  const lessonsToGenerate = pendingLessons.slice(0, options.max);
  console.log(`Will generate ${lessonsToGenerate.length} lessons`);
  console.log('');

  // Ensure lessons directory exists
  if (!options.dryRun && !fs.existsSync(LESSONS_DIR)) {
    fs.mkdirSync(LESSONS_DIR, { recursive: true });
  }

  // Generate each lesson
  const generated = [];
  for (const lesson of lessonsToGenerate) {
    const filename = `${lesson.slug}.mdx`;
    const filepath = path.join(LESSONS_DIR, filename);

    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`Skipping ${filename} (already exists)`);
      continue;
    }

    const content = generateMDXContent(lesson);

    if (options.dryRun) {
      console.log(`Would create: ${filename}`);
      console.log('---');
      console.log(content.slice(0, 500) + '...');
      console.log('---');
    } else {
      fs.writeFileSync(filepath, content, 'utf-8');
      console.log(`Created: ${filename}`);
      generated.push(lesson.slug);
    }
  }

  // Update backlog if not dry run
  if (!options.dryRun && generated.length > 0) {
    const now = new Date().toISOString();
    for (const lesson of backlog.lessons) {
      if (generated.includes(lesson.slug)) {
        lesson.status = 'generated';
        lesson.generatedAt = now;
      }
    }
    fs.writeFileSync(BACKLOG_PATH, JSON.stringify(backlog, null, 2) + '\n', 'utf-8');
    console.log('');
    console.log(`Updated backlog: ${generated.length} lessons marked as generated`);
  }

  console.log('');
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
