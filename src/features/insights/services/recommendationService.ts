import type { LoadedLesson } from '@/lib/lessons';
import { topologicalSort, isLessonUnlocked } from '@/lib/lessons';

/**
 * Get recommended next lessons based on user progress.
 *
 * ## 推薦ロジック仕様（優先順位）
 *
 * 1. **未完了** - completedLessonIds に含まれないレッスン
 * 2. **アンロック済み** - 全ての prerequisites が完了済み
 * 3. **トポロジカル順** - 難易度・依存関係に基づく学習パス順
 *
 * この順序は仕様として固定されており、変更する場合は
 * 関連テストケースも更新すること。
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
