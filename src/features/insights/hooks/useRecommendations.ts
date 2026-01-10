import { useMemo } from 'react';
import { useProgress } from '@/features/progress';
import { getAllLessons } from '@/lib/lessons';
import type { LoadedLesson } from '@/lib/lessons';
import { getRecommendedLessons } from '../services/recommendationService';

interface UseRecommendationsOptions {
  limit?: number;
}

interface UseRecommendationsResult {
  recommendations: LoadedLesson[];
  isLoading: false; // Currently synchronous, but interface allows for async in future
  hasRecommendations: boolean;
}

/**
 * Hook to get personalized lesson recommendations based on user progress.
 *
 * Returns lessons that are incomplete and unlocked, ordered by learning path.
 */
export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsResult {
  const { limit = 5 } = options;
  const { getCompletedLessonIds } = useProgress();

  const recommendations = useMemo(() => {
    const allLessons = getAllLessons();
    const completedIds = new Set(getCompletedLessonIds());
    return getRecommendedLessons(allLessons, completedIds, limit);
  }, [getCompletedLessonIds, limit]);

  return {
    recommendations,
    isLoading: false,
    hasRecommendations: recommendations.length > 0,
  };
}
