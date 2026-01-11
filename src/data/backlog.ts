import type { BacklogData, BacklogEntry, BacklogStatus, Difficulty } from '@/domain/types';
import backlogJson from '../../lessons.backlog.json';

const backlogData = backlogJson as BacklogData;

/**
 * Get all backlog entries
 */
export function getAllBacklogEntries(): BacklogEntry[] {
  return backlogData.lessons;
}

/**
 * Get backlog entries filtered by criteria
 */
export function getFilteredBacklogEntries(filters: {
  status?: BacklogStatus[];
  difficulty?: Difficulty[];
  tags?: string[];
}): BacklogEntry[] {
  let entries = backlogData.lessons;

  if (filters.status && filters.status.length > 0) {
    entries = entries.filter((e) => filters.status!.includes(e.status));
  }

  if (filters.difficulty && filters.difficulty.length > 0) {
    entries = entries.filter((e) => filters.difficulty!.includes(e.difficulty));
  }

  if (filters.tags && filters.tags.length > 0) {
    entries = entries.filter((e) => e.tags.some((tag) => filters.tags!.includes(tag)));
  }

  return entries;
}

/**
 * Get all unique tags from backlog
 */
export function getAllBacklogTags(): string[] {
  const tags = new Set<string>();
  backlogData.lessons.forEach((entry) => {
    entry.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Get top N generation candidates
 * Priority:
 * 1. Status is 'pending'
 * 2. All prerequisites are already published/generated or not in backlog (exist in lessons)
 * 3. Beginner difficulty first, then intermediate, then advanced
 */
export function getTopGenerationCandidates(
  entries: BacklogEntry[],
  publishedSlugs: Set<string>,
  count: number = 5
): BacklogEntry[] {
  // Only pending entries
  const pending = entries.filter((e) => e.status === 'pending');

  // Check if prerequisites are satisfied
  const backlogSlugs = new Set(entries.map((e) => e.slug));

  const canGenerate = pending.filter((entry) => {
    return entry.prerequisites.every((prereq) => {
      // Prerequisite is either published or not in backlog (meaning it's already a lesson)
      return publishedSlugs.has(prereq) || !backlogSlugs.has(prereq);
    });
  });

  // Sort by difficulty
  const difficultyOrder: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  return canGenerate
    .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
    .slice(0, count);
}

/**
 * Get backlog statistics
 */
export function getBacklogStats(entries: BacklogEntry[]): {
  total: number;
  byStatus: Record<BacklogStatus, number>;
  byDifficulty: Record<Difficulty, number>;
} {
  const byStatus: Record<BacklogStatus, number> = {
    pending: 0,
    generated: 0,
    published: 0,
  };

  const byDifficulty: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };

  entries.forEach((entry) => {
    byStatus[entry.status]++;
    byDifficulty[entry.difficulty]++;
  });

  return {
    total: entries.length,
    byStatus,
    byDifficulty,
  };
}

/**
 * Generate updated BacklogData JSON
 */
export function generateBacklogJson(entries: BacklogEntry[]): string {
  const data: BacklogData = {
    version: backlogData.version,
    lessons: entries,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Get the backlog version
 */
export function getBacklogVersion(): number {
  return backlogData.version;
}
