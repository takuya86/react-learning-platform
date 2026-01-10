#!/usr/bin/env node

/**
 * Lesson Statistics
 *
 * Displays statistics about lessons from backlog and MDX files
 *
 * Usage:
 *   node tools/lessons-stats.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BACKLOG_PATH = path.join(ROOT_DIR, 'lessons.backlog.json');
const LESSONS_DIR = path.join(ROOT_DIR, 'src', 'content', 'lessons');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('');
  console.log(c('bold', `━━━ ${title} ━━━`));
}

function printRow(label, value, color = 'white') {
  const paddedLabel = label.padEnd(25);
  console.log(`  ${paddedLabel} ${c(color, value)}`);
}

function printBar(value, total, width = 30) {
  const filled = Math.round((value / total) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return `${bar} ${percent}%`;
}

// Get start of current week (Monday 00:00:00)
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Main function
async function main() {
  console.log(c('bold', '\n📊 Lesson Statistics'));
  console.log(c('dim', '═'.repeat(50)));

  // Read backlog
  if (!fs.existsSync(BACKLOG_PATH)) {
    console.error('Error: Backlog file not found');
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(BACKLOG_PATH, 'utf-8'));
  const lessons = backlog.lessons;

  // Get existing MDX files
  const existingFiles = new Set();
  if (fs.existsSync(LESSONS_DIR)) {
    fs.readdirSync(LESSONS_DIR).forEach(f => {
      if (f.endsWith('.mdx')) {
        existingFiles.add(f.replace('.mdx', ''));
      }
    });
  }

  // === Status Summary ===
  printHeader('Status Summary');

  const pending = lessons.filter(l => l.status === 'pending');
  const generated = lessons.filter(l => l.status === 'generated');
  const published = lessons.filter(l => l.status === 'published');
  const total = lessons.length;

  printRow('Pending', `${pending.length}`, 'yellow');
  printRow('Generated', `${generated.length}`, 'cyan');
  printRow('Published', `${published.length}`, 'green');
  printRow('Total in Backlog', `${total}`, 'bold');
  printRow('MDX Files Exist', `${existingFiles.size}`, 'blue');

  // Progress bar
  const completedCount = generated.length + published.length;
  console.log('');
  console.log(`  Progress: ${printBar(completedCount, total)}`);

  // === This Week's Generation ===
  printHeader('This Week');

  const weekStart = getWeekStart();
  const thisWeek = lessons.filter(l => {
    if (!l.generatedAt) return false;
    return new Date(l.generatedAt) >= weekStart;
  });

  printRow('Generated this week', `${thisWeek.length}`, 'green');
  if (thisWeek.length > 0) {
    console.log(c('dim', '  → ' + thisWeek.map(l => l.slug).join(', ')));
  }

  // === Difficulty Breakdown ===
  printHeader('By Difficulty');

  const byDifficulty = {
    beginner: lessons.filter(l => l.difficulty === 'beginner'),
    intermediate: lessons.filter(l => l.difficulty === 'intermediate'),
    advanced: lessons.filter(l => l.difficulty === 'advanced'),
  };

  printRow('Beginner', `${byDifficulty.beginner.length}`, 'green');
  printRow('Intermediate', `${byDifficulty.intermediate.length}`, 'yellow');
  printRow('Advanced', `${byDifficulty.advanced.length}`, 'cyan');

  // === Tag Breakdown ===
  printHeader('By Tag (Top 10)');

  const tagCounts = {};
  lessons.forEach(lesson => {
    lesson.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedTags.forEach(([tag, count]) => {
    printRow(tag, `${count}`, 'blue');
  });

  // === Estimated Reading Time ===
  printHeader('Estimated Time');

  const totalMinutes = lessons.reduce((sum, l) => sum + (l.estimatedMinutes || 0), 0);
  const avgMinutes = total > 0 ? Math.round(totalMinutes / total) : 0;

  printRow('Total', `${totalMinutes} min (${Math.round(totalMinutes / 60)} hrs)`);
  printRow('Average per lesson', `${avgMinutes} min`);

  // === Pending Queue ===
  printHeader('Pending Queue (Next 5)');

  const next5 = pending.slice(0, 5);
  if (next5.length === 0) {
    console.log(c('dim', '  (none)'));
  } else {
    next5.forEach((lesson, i) => {
      console.log(`  ${i + 1}. ${c('cyan', lesson.slug)} - ${lesson.title}`);
    });
  }

  console.log('');
  console.log(c('dim', '═'.repeat(50)));
  console.log('');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
