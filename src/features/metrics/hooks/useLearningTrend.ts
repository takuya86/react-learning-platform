/**
 * useLearningTrend Hook
 *
 * 学習量推移データを取得するhook
 * - 30日（日単位）と12週（週単位）の切り替えをサポート
 * - mock / supabase 両対応
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { supabase, isMockMode } from '@/lib/supabase';
import { MockDataManager } from '@/lib/mock/MockDataManager';
import { getUTCDateString, type LearningEvent } from '../services/metricsService';
import {
  getTrendData,
  generateDailyRangeUTC,
  generateWeeklyRangeUTC,
  type TrendMode,
} from '../services/trendService';

interface UseLearningTrendResult {
  mode: TrendMode;
  data: { x: string; y: number }[];
  isLoading: boolean;
  error: string | null;
  setMode: (mode: TrendMode) => void;
  refresh: () => Promise<void>;
}

/**
 * Set mock events for testing
 */
export function setMockTrendEvents(events: LearningEvent[]): void {
  MockDataManager.getInstance().setTrendEvents(events);
}

/**
 * Reset mock events for testing
 */
export function resetMockTrendEvents(): void {
  MockDataManager.getInstance().clearTrendEvents();
}

export function useLearningTrend(): UseLearningTrendResult {
  const { user } = useAuth();
  const [mode, setMode] = useState<TrendMode>('daily');
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range based on mode
  const dateRange = useMemo(() => {
    const today = getUTCDateString();
    if (mode === 'daily') {
      const range = generateDailyRangeUTC(30, today);
      return { start: range[0], end: today };
    } else {
      const range = generateWeeklyRangeUTC(12, today);
      // For weekly, we need to include events up to the end of the current week
      const lastWeekStart = range[range.length - 1];
      const lastWeekEnd = new Date(lastWeekStart + 'T00:00:00Z');
      lastWeekEnd.setUTCDate(lastWeekEnd.getUTCDate() + 6);
      return { start: range[0], end: getUTCDateString(lastWeekEnd) };
    }
  }, [mode]);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    if (isMockMode) {
      // In mock mode, filter mock events to date range
      const mockEvents = MockDataManager.getInstance().getTrendEvents();
      const filtered = mockEvents.filter(
        (e) => e.event_date >= dateRange.start && e.event_date <= dateRange.end
      );
      setEvents(filtered);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('learning_events')
        .select('event_type, event_date, reference_id')
        .eq('user_id', user.id)
        .gte('event_date', dateRange.start)
        .lte('event_date', dateRange.end)
        .order('event_date', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setEvents(
        (data || []).map((row) => ({
          user_id: user.id,
          event_type: row.event_type,
          event_date: row.event_date,
          reference_id: row.reference_id,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch learning events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const data = useMemo(() => {
    return getTrendData(events, mode);
  }, [events, mode]);

  return {
    mode,
    data,
    isLoading,
    error,
    setMode,
    refresh: fetchEvents,
  };
}
