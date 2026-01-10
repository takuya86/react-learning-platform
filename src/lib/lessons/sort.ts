import type { LoadedLesson } from './types';

/**
 * Sort lessons topologically based on prerequisites.
 * Lessons with no prerequisites come first, then lessons whose prerequisites are satisfied.
 * Within the same "level", lessons are sorted by difficulty then title.
 */
export function topologicalSort(lessons: LoadedLesson[]): LoadedLesson[] {
  const lessonMap = new Map(lessons.map((l) => [l.id, l]));
  const result: LoadedLesson[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  // Helper to get difficulty order
  const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };

  // DFS-based topological sort
  function visit(lesson: LoadedLesson): void {
    if (visited.has(lesson.id)) return;
    if (visiting.has(lesson.id)) {
      // Cycle detected - skip to avoid infinite loop
      return;
    }

    visiting.add(lesson.id);

    // Visit prerequisites first
    for (const prereqId of lesson.prerequisites) {
      const prereq = lessonMap.get(prereqId);
      if (prereq) {
        visit(prereq);
      }
    }

    visiting.delete(lesson.id);
    visited.add(lesson.id);
    result.push(lesson);
  }

  // Sort input by difficulty then title for stable ordering
  const sortedInput = [...lessons].sort((a, b) => {
    const diffA = difficultyOrder[a.difficulty];
    const diffB = difficultyOrder[b.difficulty];
    if (diffA !== diffB) return diffA - diffB;
    return a.title.localeCompare(b.title, 'ja');
  });

  for (const lesson of sortedInput) {
    visit(lesson);
  }

  return result;
}

/**
 * Group lessons by difficulty level.
 */
export function groupByDifficulty(
  lessons: LoadedLesson[]
): Record<'beginner' | 'intermediate' | 'advanced', LoadedLesson[]> {
  return {
    beginner: lessons.filter((l) => l.difficulty === 'beginner'),
    intermediate: lessons.filter((l) => l.difficulty === 'intermediate'),
    advanced: lessons.filter((l) => l.difficulty === 'advanced'),
  };
}

/**
 * Get lessons sorted for the roadmap view.
 * Returns lessons sorted topologically within each difficulty group.
 */
export function getLessonsForRoadmap(
  lessons: LoadedLesson[]
): Record<'beginner' | 'intermediate' | 'advanced', LoadedLesson[]> {
  const sorted = topologicalSort(lessons);
  return groupByDifficulty(sorted);
}
