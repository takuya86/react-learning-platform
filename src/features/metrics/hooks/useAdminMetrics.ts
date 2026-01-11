/**
 * useAdminMetrics Hook
 *
 * 管理者向けメトリクス取得（全ユーザー集計）
 * mock / supabase 両対応
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isMockMode } from '@/lib/supabase';
import { getAllLessons } from '@/lib/lessons';
import { getUTCDateString, type LearningEvent } from '../services/metricsService';
import {
  type AdminPeriod,
  type AdminSummary,
  type UserLearningMetric,
  type Leaderboards,
  getDateRangeForPeriod,
  buildAdminSummary,
  buildEventsTrend,
  buildEventsHeatmap,
  buildLeaderboards,
  filterEventsByDateRange,
} from '../services/adminMetricsService';
import type { HeatmapDay } from '../services/heatmapService';
import {
  type EffectivenessSummary,
  buildEffectivenessSummary,
} from '../services/effectivenessService';
import {
  type LessonRanking,
  buildLessonRanking,
} from '../services/lessonEffectivenessRankingService';

interface UseAdminMetricsResult {
  period: AdminPeriod;
  setPeriod: (period: AdminPeriod) => void;
  summary: AdminSummary | null;
  trendData: { x: string; y: number }[];
  heatmapData: HeatmapDay[];
  leaderboards: Leaderboards | null;
  effectiveness: EffectivenessSummary | null;
  lessonRanking: LessonRanking | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Mock storage for admin metrics testing
let mockAdminEvents: LearningEvent[] = [];
let mockAdminUserMetrics: UserLearningMetric[] = [];

/**
 * Set mock events for admin metrics testing
 */
export function setMockAdminEvents(events: LearningEvent[]): void {
  mockAdminEvents = [...events];
}

/**
 * Set mock user metrics for admin testing
 */
export function setMockAdminUserMetrics(metrics: UserLearningMetric[]): void {
  mockAdminUserMetrics = [...metrics];
}

/**
 * Reset mock admin data
 */
export function resetMockAdminData(): void {
  mockAdminEvents = [];
  mockAdminUserMetrics = [];
}

const HEATMAP_DAYS = 84; // 12 weeks
const LEADERBOARD_LIMIT = 10;

export function useAdminMetrics(): UseAdminMetricsResult {
  const [period, setPeriod] = useState<AdminPeriod>('30d');
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserLearningMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (isMockMode) {
      // In mock mode, use mock data
      setEvents(mockAdminEvents);
      setUserMetrics(mockAdminUserMetrics);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const today = getUTCDateString();

      // Fetch all events for the past 30 days (for summary/trend)
      // We fetch 84 days for heatmap
      const todayDate = new Date(today + 'T00:00:00Z');
      const heatmapStartDate = new Date(todayDate);
      heatmapStartDate.setUTCDate(heatmapStartDate.getUTCDate() - (HEATMAP_DAYS - 1));
      const heatmapStartStr = getUTCDateString(heatmapStartDate);

      const [eventsResult, metricsResult] = await Promise.all([
        supabase
          .from('learning_events')
          .select('user_id, event_type, event_date, reference_id, created_at')
          .gte('event_date', heatmapStartStr)
          .lte('event_date', today)
          .order('event_date', { ascending: true }),
        supabase
          .from('user_learning_metrics')
          .select('user_id, streak, last_event_date, weekly_goal, weekly_progress, updated_at'),
      ]);

      if (eventsResult.error) {
        throw new Error(eventsResult.error.message);
      }

      if (metricsResult.error) {
        throw new Error(metricsResult.error.message);
      }

      const fetchedEvents: LearningEvent[] = (eventsResult.data || []).map((row) => ({
        user_id: row.user_id,
        event_type: row.event_type,
        event_date: row.event_date,
        reference_id: row.reference_id,
        created_at: row.created_at,
      }));

      const fetchedMetrics: UserLearningMetric[] = (metricsResult.data || []).map((row) => ({
        user_id: row.user_id,
        streak: row.streak,
        last_event_date: row.last_event_date,
        weekly_goal: row.weekly_goal,
        weekly_progress: row.weekly_progress,
        updated_at: row.updated_at,
      }));

      setEvents(fetchedEvents);
      setUserMetrics(fetchedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin metrics');
      setEvents([]);
      setUserMetrics([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = useMemo(() => getUTCDateString(), []);

  const summary = useMemo(() => {
    if (isLoading) return null;
    return buildAdminSummary(events, userMetrics, period, today);
  }, [events, userMetrics, period, today, isLoading]);

  const trendData = useMemo(() => {
    if (isLoading) return [];
    const { startDate, endDate } = getDateRangeForPeriod('30d', today);
    return buildEventsTrend(events, startDate, endDate);
  }, [events, today, isLoading]);

  const heatmapData = useMemo(() => {
    if (isLoading) return [];
    return buildEventsHeatmap(events, HEATMAP_DAYS, today);
  }, [events, today, isLoading]);

  const leaderboards = useMemo(() => {
    if (isLoading) return null;
    return buildLeaderboards(events, userMetrics, today, LEADERBOARD_LIMIT);
  }, [events, userMetrics, today, isLoading]);

  const effectiveness = useMemo(() => {
    if (isLoading) return null;
    // Filter events to selected period for effectiveness calculation
    const { startDate, endDate } = getDateRangeForPeriod(period, today);
    const periodEvents = filterEventsByDateRange(events, startDate, endDate);
    return buildEffectivenessSummary(periodEvents);
  }, [events, period, today, isLoading]);

  const lessonRanking = useMemo(() => {
    if (isLoading) return null;
    // Filter events to selected period for lesson ranking
    const { startDate, endDate } = getDateRangeForPeriod(period, today);
    const periodEvents = filterEventsByDateRange(events, startDate, endDate);
    // Get lesson info for display
    const lessons = getAllLessons().map((lesson) => ({
      slug: lesson.id,
      title: lesson.title,
      difficulty: lesson.difficulty,
    }));
    return buildLessonRanking(periodEvents, lessons);
  }, [events, period, today, isLoading]);

  return {
    period,
    setPeriod,
    summary,
    trendData,
    heatmapData,
    leaderboards,
    effectiveness,
    lessonRanking,
    isLoading,
    error,
    refresh: fetchData,
  };
}
