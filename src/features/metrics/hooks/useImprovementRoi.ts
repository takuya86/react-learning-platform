/**
 * useImprovementRoi Hook
 *
 * P4-2.2: Hook to calculate ROI for closed improvement issues
 * Fetches closed issues and calculates before/after metrics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isMockMode } from '@/lib/supabase/client';
import { getAllLessons } from '@/lib/lessons';
import { getUTCDateString, type LearningEvent } from '../services/metricsService';
import { buildLessonRanking } from '../services/lessonEffectivenessRankingService';
import {
  listAllClosedImprovementIssues,
  type ImprovementTrackerItem,
} from '@/features/admin/services/githubIssueService';
import { logger } from '@/lib/logger';

/**
 * ROI calculation status
 */
export type RoiStatus = 'IMPROVED' | 'REGRESSED' | 'NO_CHANGE' | 'INSUFFICIENT_DATA';

/**
 * ROI item with before/after metrics
 */
export interface ImprovementRoiItem {
  lessonSlug: string;
  lessonTitle: string;
  issueNumber: number;
  issueUrl: string;
  deltaFollowUpRate: number | null;
  deltaCompletionRate: number | null;
  status: RoiStatus;
  beforePeriod: string;
  afterPeriod: string;
  beforeOriginCount: number;
  afterOriginCount: number;
}

interface UseImprovementRoiResult {
  roiList: ImprovementRoiItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Calculate ROI status based on deltas
 */
function calculateRoiStatus(deltaFollowUpRate: number | null, afterOriginCount: number): RoiStatus {
  if (afterOriginCount < 5) {
    return 'INSUFFICIENT_DATA';
  }
  if (deltaFollowUpRate === null) {
    return 'INSUFFICIENT_DATA';
  }
  if (deltaFollowUpRate > 1) {
    return 'IMPROVED';
  }
  if (deltaFollowUpRate < -1) {
    return 'REGRESSED';
  }
  return 'NO_CHANGE';
}

/**
 * Format period string for display
 */
function formatPeriod(startDate: string, endDate: string): string {
  return `${startDate.slice(5)} ~ ${endDate.slice(5)}`;
}

/**
 * Calculate before/after metrics for a lesson
 * Before: baseline_window_days before baseline_snapshot_at_utc
 * After: 30 days after issue closed_at
 */
function calculateBeforeAfterMetrics(
  trackerItem: ImprovementTrackerItem,
  allEvents: LearningEvent[],
  issueClosedAt: string | null
): {
  deltaFollowUpRate: number | null;
  deltaCompletionRate: number | null;
  beforePeriod: string;
  afterPeriod: string;
  beforeOriginCount: number;
  afterOriginCount: number;
} {
  const { lessonSlug, baselineRate, baselineOriginCount } = trackerItem;

  // Calculate before period (use baseline values from issue)
  const beforeOriginCount = baselineOriginCount;
  const beforeFollowUpRate = baselineRate;

  // Calculate after period (30 days from issue closed date)
  let afterFollowUpRate: number | null = null;
  let afterOriginCount = 0;
  let afterPeriod = 'N/A';

  if (issueClosedAt) {
    const closedDate = new Date(issueClosedAt);
    const afterStartDate = new Date(closedDate);
    afterStartDate.setUTCDate(afterStartDate.getUTCDate() + 1); // Start from next day
    const afterEndDate = new Date(afterStartDate);
    afterEndDate.setUTCDate(afterEndDate.getUTCDate() + 29); // 30 days total

    const afterStartStr = getUTCDateString(afterStartDate);
    const afterEndStr = getUTCDateString(afterEndDate);
    afterPeriod = formatPeriod(afterStartStr, afterEndStr);

    // Filter events for after period and this lesson
    const afterEvents = allEvents.filter((event) => {
      return (
        event.event_date >= afterStartStr &&
        event.event_date <= afterEndStr &&
        event.reference_id === lessonSlug
      );
    });

    // Calculate metrics for after period
    const lessons = getAllLessons();
    const lessonInfo = lessons.map((l) => ({
      slug: l.id,
      title: l.title,
      difficulty: l.difficulty,
    }));
    const afterRanking = buildLessonRanking(afterEvents, lessonInfo);

    // Find this lesson in ranking
    const allLessons = [...afterRanking.best, ...afterRanking.worst];
    const lessonMetrics = allLessons.find((l) => l.slug === lessonSlug);

    if (lessonMetrics) {
      afterFollowUpRate = lessonMetrics.followUpRate;
      afterOriginCount = lessonMetrics.originCount;
    }
  }

  // Calculate deltas
  const deltaFollowUpRate =
    afterFollowUpRate !== null ? afterFollowUpRate - beforeFollowUpRate : null;

  // For now, deltaCompletionRate is null (we don't track completion rate in issues)
  const deltaCompletionRate = null;

  // Before period format (use baseline snapshot date from issue metadata)
  // For simplicity, use a fixed 30-day window before baseline
  const beforePeriod = 'Baseline (30d)';

  return {
    deltaFollowUpRate,
    deltaCompletionRate,
    beforePeriod,
    afterPeriod,
    beforeOriginCount,
    afterOriginCount,
  };
}

/**
 * Hook to calculate and display ROI for closed improvement issues
 */
export function useImprovementRoi(): UseImprovementRoiResult {
  const [closedIssues, setClosedIssues] = useState<ImprovementTrackerItem[]>([]);
  const [allEvents, setAllEvents] = useState<LearningEvent[]>([]);
  const [issueClosedDates, setIssueClosedDates] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch closed issues
      const closedResult = await listAllClosedImprovementIssues();
      if (closedResult.error) {
        throw new Error(closedResult.error);
      }

      const closedIssuesData = closedResult.data || [];
      setClosedIssues(closedIssuesData);

      // In mock mode, set dummy closed dates
      if (isMockMode) {
        const mockClosedDates = new Map<number, string>();
        closedIssuesData.forEach((issue) => {
          // Mock closed date: 30 days ago
          const closedDate = new Date();
          closedDate.setUTCDate(closedDate.getUTCDate() - 30);
          mockClosedDates.set(issue.issueNumber, closedDate.toISOString());
        });
        setIssueClosedDates(mockClosedDates);
        setAllEvents([]); // Mock mode doesn't need real events
        setIsLoading(false);
        return;
      }

      // Fetch all events for the past 120 days (enough for before/after analysis)
      const today = getUTCDateString();
      const todayDate = new Date(today + 'T00:00:00Z');
      const startDate = new Date(todayDate);
      startDate.setUTCDate(startDate.getUTCDate() - 120);
      const startStr = getUTCDateString(startDate);

      const eventsResult = await supabase
        .from('learning_events')
        .select('user_id, event_type, event_date, reference_id, created_at')
        .gte('event_date', startStr)
        .lte('event_date', today)
        .order('event_date', { ascending: true });

      if (eventsResult.error) {
        throw new Error(eventsResult.error.message);
      }

      const fetchedEvents: LearningEvent[] = (eventsResult.data || []).map((row) => ({
        user_id: row.user_id,
        event_type: row.event_type,
        event_date: row.event_date,
        reference_id: row.reference_id,
        created_at: row.created_at,
      }));

      setAllEvents(fetchedEvents);

      // Fetch closed dates for issues (this would require GitHub API call in real mode)
      // For now, we'll use a placeholder
      const closedDates = new Map<number, string>();
      // In production, you would fetch issue details from GitHub API to get closed_at
      // For now, we'll set a dummy date
      closedIssuesData.forEach((issue) => {
        const closedDate = new Date();
        closedDate.setUTCDate(closedDate.getUTCDate() - 30);
        closedDates.set(issue.issueNumber, closedDate.toISOString());
      });
      setIssueClosedDates(closedDates);
    } catch (err) {
      logger.error('Failed to fetch ROI data', {
        category: 'metrics',
        context: {
          function: 'useImprovementRoi.fetchData',
          error: err instanceof Error ? err.message : String(err),
        },
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch ROI data');
      setClosedIssues([]);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const roiList = useMemo(() => {
    if (isLoading) return [];

    const lessons = getAllLessons();
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    return closedIssues.map((issue) => {
      const lesson = lessonMap.get(issue.lessonSlug);
      const closedAt = issueClosedDates.get(issue.issueNumber) || null;

      const metrics = calculateBeforeAfterMetrics(issue, allEvents, closedAt);

      const status = calculateRoiStatus(metrics.deltaFollowUpRate, metrics.afterOriginCount);

      return {
        lessonSlug: issue.lessonSlug,
        lessonTitle: lesson?.title || issue.lessonSlug,
        issueNumber: issue.issueNumber,
        issueUrl: issue.issueUrl,
        deltaFollowUpRate: metrics.deltaFollowUpRate,
        deltaCompletionRate: metrics.deltaCompletionRate,
        status,
        beforePeriod: metrics.beforePeriod,
        afterPeriod: metrics.afterPeriod,
        beforeOriginCount: metrics.beforeOriginCount,
        afterOriginCount: metrics.afterOriginCount,
      };
    });
  }, [closedIssues, allEvents, issueClosedDates, isLoading]);

  return {
    roiList,
    isLoading,
    error,
    refresh: fetchData,
  };
}
