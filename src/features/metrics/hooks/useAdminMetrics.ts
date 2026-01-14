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
  type EffectivenessBreakdown,
  buildEffectivenessSummary,
  calculateEffectivenessBreakdown,
} from '../services/effectivenessService';
import {
  type LessonRanking,
  buildLessonRanking,
} from '../services/lessonEffectivenessRankingService';
import {
  listAllOpenImprovementIssues,
  type ImprovementTrackerItem,
} from '@/features/admin/services/githubIssueService';
import {
  rankImprovements,
  type RankedItem,
  type ImprovementItem,
} from '../services/priorityScoreService';
import { generateLessonHint } from '../services/lessonImprovementHintService';

/**
 * Tracker row with baseline and current metrics combined
 */
export interface ImprovementTrackerRow {
  lessonSlug: string;
  lessonTitle: string;
  hintType: string;
  baselineRate: number;
  currentRate: number | null;
  delta: number | null;
  originCount: number;
  isLowSample: boolean;
  issueNumber: number;
  issueUrl: string;
}

interface UseAdminMetricsResult {
  period: AdminPeriod;
  setPeriod: (period: AdminPeriod) => void;
  summary: AdminSummary | null;
  trendData: { x: string; y: number }[];
  heatmapData: HeatmapDay[];
  leaderboards: Leaderboards | null;
  effectiveness: EffectivenessSummary | null;
  /** P3-1: Origin別のfollow-up rate breakdown */
  effectivenessBreakdown: EffectivenessBreakdown | null;
  lessonRanking: LessonRanking | null;
  improvementTracker: ImprovementTrackerRow[];
  priorityRanking: RankedItem[];
  nextBestImprovement: RankedItem | null;
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
  const [trackerItems, setTrackerItems] = useState<ImprovementTrackerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (isMockMode) {
      // In mock mode, use mock data
      setEvents(mockAdminEvents);
      setUserMetrics(mockAdminUserMetrics);
      // Fetch improvement tracker items in mock mode
      const trackerResult = await listAllOpenImprovementIssues();
      if (trackerResult.data) {
        setTrackerItems(trackerResult.data);
      }
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

      const [eventsResult, metricsResult, trackerResult] = await Promise.all([
        supabase
          .from('learning_events')
          .select('user_id, event_type, event_date, reference_id, created_at')
          .gte('event_date', heatmapStartStr)
          .lte('event_date', today)
          .order('event_date', { ascending: true }),
        supabase
          .from('user_learning_metrics')
          .select('user_id, streak, last_event_date, weekly_goal, weekly_progress, updated_at'),
        listAllOpenImprovementIssues(),
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

      // Set tracker items from GitHub API
      if (trackerResult.data) {
        setTrackerItems(trackerResult.data);
      } else if (trackerResult.error) {
        console.warn('Failed to fetch improvement tracker:', trackerResult.error);
        setTrackerItems([]);
      }
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

  /**
   * P3-1: Origin別のfollow-up rate breakdown
   * lesson_viewed, lesson_completed, review_started それぞれの効果を分離して表示
   */
  const effectivenessBreakdown = useMemo(() => {
    if (isLoading) return null;
    const { startDate, endDate } = getDateRangeForPeriod(period, today);
    const periodEvents = filterEventsByDateRange(events, startDate, endDate);
    return calculateEffectivenessBreakdown(periodEvents);
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

  const improvementTracker = useMemo(() => {
    if (isLoading) return [];

    // Get lesson info lookup
    const lessons = getAllLessons();
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    // Calculate current metrics for all lessons
    const { startDate, endDate } = getDateRangeForPeriod(period, today);
    const periodEvents = filterEventsByDateRange(events, startDate, endDate);
    const currentLessonInfo = getAllLessons().map((lesson) => ({
      slug: lesson.id,
      title: lesson.title,
      difficulty: lesson.difficulty,
    }));
    const currentRanking = buildLessonRanking(periodEvents, currentLessonInfo);

    // Build lookup map for current metrics
    const currentMetricsMap = new Map<string, { rate: number; originCount: number }>();
    [...currentRanking.best, ...currentRanking.worst].forEach((row) => {
      currentMetricsMap.set(row.slug, {
        rate: row.followUpRate,
        originCount: row.originCount,
      });
    });

    // Combine tracker items with current metrics
    return trackerItems.map((item) => {
      const lesson = lessonMap.get(item.lessonSlug);
      const current = currentMetricsMap.get(item.lessonSlug);

      return {
        lessonSlug: item.lessonSlug,
        lessonTitle: lesson?.title || item.lessonSlug,
        hintType: item.hintType,
        baselineRate: item.baselineRate,
        currentRate: current?.rate ?? null,
        delta: current ? current.rate - item.baselineRate : null,
        originCount: current?.originCount ?? 0,
        isLowSample: (current?.originCount ?? 0) < 5,
        issueNumber: item.issueNumber,
        issueUrl: item.issueUrl,
      };
    });
  }, [trackerItems, events, period, today, isLoading]);

  const priorityRanking = useMemo(() => {
    if (isLoading || !lessonRanking) return [];

    // Calculate priority items from worst lessons
    const improvementItems: ImprovementItem[] = lessonRanking.worst.map((row) => {
      const hint = generateLessonHint({
        lessonSlug: row.slug,
        originCount: row.originCount,
        followUpRate: row.followUpRate,
        followUpCounts: row.followUpCounts,
      });
      const hintType = hint?.type ?? null;
      const roiScore = 100 - row.followUpRate;

      return {
        lessonSlug: row.slug,
        lessonTitle: row.title,
        roiScore,
        originCount: row.originCount,
        followUpRate: row.followUpRate,
        difficulty: row.difficulty,
        hintType,
      };
    });

    // Rank by priority score
    return rankImprovements(improvementItems);
  }, [lessonRanking, isLoading]);

  const nextBestImprovement = useMemo(() => {
    return priorityRanking.find((item) => !item.isLowSample) ?? null;
  }, [priorityRanking]);

  return {
    period,
    setPeriod,
    summary,
    trendData,
    heatmapData,
    leaderboards,
    effectiveness,
    effectivenessBreakdown,
    lessonRanking,
    improvementTracker,
    priorityRanking,
    nextBestImprovement,
    isLoading,
    error,
    refresh: fetchData,
  };
}
