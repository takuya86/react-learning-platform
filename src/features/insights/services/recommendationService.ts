import type { LoadedLesson } from '@/lib/lessons';
import { topologicalSort, isLessonUnlocked } from '@/lib/lessons';

/**
 * Get recommended next lessons based on user progress.
 *
 * Returns lessons that are:
 * 1. Not completed (not in completedLessonIds)
 * 2. Unlocked (all prerequisites completed)
 *
 * Ordered by topological sort (learning path order) to prioritize
 * lessons that are earlier in the learning sequence.
 *
 * @param allLessons - All available lessons
 * @param completedLessonIds - Set of completed lesson IDs
 * @param limit - Maximum number of recommendations (default: 5)
 */
export function getRecommendedLessons(
  allLessons: LoadedLesson[],
  completedLessonIds: Set<string>,
  limit: number = 5
): LoadedLesson[] {
  if (allLessons.length === 0) {
    return [];
  }

  // Get topologically sorted lessons for consistent ordering
  const sortedLessons = topologicalSort(allLessons);

  // Filter to incomplete and unlocked lessons
  const recommendations = sortedLessons.filter((lesson) => {
    // Exclude completed lessons
    if (completedLessonIds.has(lesson.id)) {
      return false;
    }

    // Only include unlocked lessons (prerequisites satisfied)
    return isLessonUnlocked(lesson.id, completedLessonIds);
  });

  return recommendations.slice(0, limit);
}

/**
 * Check if there are any recommended lessons available.
 */
export function hasRecommendations(
  allLessons: LoadedLesson[],
  completedLessonIds: Set<string>
): boolean {
  return getRecommendedLessons(allLessons, completedLessonIds, 1).length > 0;
}

/**
 * Get the count of available recommended lessons (for display purposes).
 */
export function getRecommendationCount(
  allLessons: LoadedLesson[],
  completedLessonIds: Set<string>,
  maxCount: number = 10
): number {
  return getRecommendedLessons(allLessons, completedLessonIds, maxCount).length;
}
