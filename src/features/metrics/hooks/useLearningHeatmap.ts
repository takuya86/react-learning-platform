/**
 * useLearningHeatmap Hook
 *
 * learning_events から直近84日間のヒートマップデータを取得
 * mock / supabase 両対応
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { supabase, isMockMode } from '@/lib/supabase';
import { MockDataManager } from '@/lib/mock/MockDataManager';
import { getUTCDateString, type LearningEvent } from '../services/metricsService';
import { getHeatmapData, type HeatmapDay } from '../services/heatmapService';

interface UseLearningHeatmapResult {
  heatmapData: HeatmapDay[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Add mock event for testing
 */
export function addMockLearningEvent(event: LearningEvent): void {
  MockDataManager.getInstance().addLearningEvent(event);
}

/**
 * Reset mock events for testing
 */
export function resetMockLearningEvents(): void {
  MockDataManager.getInstance().clearLearningEvents();
}

/**
 * Set mock events for testing
 */
export function setMockLearningEvents(events: LearningEvent[]): void {
  MockDataManager.getInstance().setLearningEvents(events);
}

const HEATMAP_DAYS = 84; // 12 weeks

export function useLearningHeatmap(): UseLearningHeatmapResult {
  const { user } = useAuth();
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    if (isMockMode) {
      // In mock mode, return mock events
      setEvents(MockDataManager.getInstance().getLearningEvents());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calculate date range for query
      const today = getUTCDateString();
      const todayDate = new Date(today + 'T00:00:00Z');
      const startDate = new Date(todayDate);
      startDate.setUTCDate(startDate.getUTCDate() - (HEATMAP_DAYS - 1));
      const startDateStr = getUTCDateString(startDate);

      const { data, error: fetchError } = await supabase
        .from('learning_events')
        .select('event_type, event_date, reference_id')
        .eq('user_id', user.id)
        .gte('event_date', startDateStr)
        .lte('event_date', today)
        .order('event_date', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setEvents(
        (data || []).map((row) => ({
          event_type: row.event_type,
          event_date: row.event_date,
          reference_id: row.reference_id,
          user_id: user.id,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch learning events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const heatmapData = useMemo(() => {
    return getHeatmapData(events, HEATMAP_DAYS);
  }, [events]);

  return {
    heatmapData,
    isLoading,
    error,
    refresh: fetchEvents,
  };
}
