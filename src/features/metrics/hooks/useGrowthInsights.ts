/**
 * useGrowthInsights Hook
 *
 * learning_events から成長インサイトデータを取得
 * mock / supabase 両対応
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { supabase, isMockMode } from '@/lib/supabase';
import { MockDataManager } from '@/lib/mock/MockDataManager';
import { getUTCDateString, type LearningEvent } from '../services/metricsService';
import {
  buildGrowthInsights,
  getLastWeekStartUTC,
  type GrowthInsights,
} from '../services/growthInsightsService';

interface UseGrowthInsightsResult {
  insights: GrowthInsights | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Set mock events for testing
 */
export function setMockGrowthEvents(events: LearningEvent[]): void {
  MockDataManager.getInstance().setGrowthEvents(events);
}

/**
 * Reset mock events for testing
 */
export function resetMockGrowthEvents(): void {
  MockDataManager.getInstance().clearGrowthEvents();
}

export function useGrowthInsights(): UseGrowthInsightsResult {
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
      setEvents(MockDataManager.getInstance().getGrowthEvents());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const today = getUTCDateString();
      const todayDate = new Date(today + 'T00:00:00Z');

      // Get last week's start as the minimum date we need
      const lastWeekStart = getLastWeekStartUTC(todayDate);

      // Fetch all events from last week start onwards
      // Also fetch all events to calculate lifetime active days
      const [recentResult, lifetimeResult] = await Promise.all([
        // Recent events for weekly comparison
        supabase
          .from('learning_events')
          .select('event_type, event_date, reference_id')
          .eq('user_id', user.id)
          .gte('event_date', lastWeekStart)
          .lte('event_date', today)
          .order('event_date', { ascending: true }),
        // All events for lifetime count (just need dates)
        supabase.from('learning_events').select('event_date').eq('user_id', user.id),
      ]);

      if (recentResult.error) {
        throw new Error(recentResult.error.message);
      }

      // Combine recent events with full reference data
      const recentEvents = (recentResult.data || []).map((row) => ({
        event_type: row.event_type,
        event_date: row.event_date,
        reference_id: row.reference_id,
        user_id: user.id,
      }));

      // Get all unique dates for lifetime calculation
      const allEventDates = (lifetimeResult.data || []).map((row) => row.event_date);

      // Merge: use recent events but add any missing lifetime dates
      const mergedEvents = [
        ...recentEvents,
        // Add placeholder events for dates not in recent range
        ...allEventDates
          .filter((date) => !recentEvents.some((e) => e.event_date === date))
          .map((date) => ({
            event_type: 'lesson_completed' as const,
            event_date: date,
            user_id: user.id,
          })),
      ];

      setEvents(mergedEvents);
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

  const insights = useMemo(() => {
    if (events.length === 0 && !isLoading) {
      // Return empty insights for no data case
      return buildGrowthInsights({
        eventDates: [],
        referenceIds: [],
      });
    }

    if (events.length === 0) {
      return null;
    }

    return buildGrowthInsights({
      eventDates: events.map((e) => e.event_date),
      referenceIds: events.map((e) => e.reference_id || ''),
    });
  }, [events, isLoading]);

  return {
    insights,
    isLoading,
    error,
    refresh: fetchEvents,
  };
}
