/**
 * useDailyEvents Hook
 *
 * 指定日の learning_events を取得
 * mock / supabase 両対応
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { supabase, isMockMode } from '@/lib/supabase';
import type { LearningEvent } from '@/features/metrics/services/metricsService';
import { buildDailyEventsResult, type DailyEventsResult } from '../services/dailyEventsService';

interface UseDailyEventsResult {
  result: DailyEventsResult | null;
  isLoading: boolean;
  error: string | null;
  fetchEvents: (date: string) => Promise<void>;
}

// Mock storage for daily events
let mockDailyEvents: LearningEvent[] = [];

/**
 * Set mock daily events for testing
 */
export function setMockDailyEvents(events: LearningEvent[]): void {
  mockDailyEvents = [...events];
}

/**
 * Reset mock daily events
 */
export function resetMockDailyEvents(): void {
  mockDailyEvents = [];
}

/**
 * Hook to fetch learning events for a specific date
 */
export function useDailyEvents(): UseDailyEventsResult {
  const { user } = useAuth();
  const [result, setResult] = useState<DailyEventsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(
    async (date: string) => {
      if (!user) {
        setResult(buildDailyEventsResult(date, []));
        return;
      }

      if (isMockMode) {
        // Filter mock events by date
        const dayEvents = mockDailyEvents.filter((e) => e.event_date === date);
        setResult(buildDailyEventsResult(date, dayEvents));
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('learning_events')
          .select('id, user_id, event_type, event_date, reference_id, created_at')
          .eq('user_id', user.id)
          .eq('event_date', date)
          .order('created_at', { ascending: true });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        const events: LearningEvent[] = (data || []).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          event_type: row.event_type,
          event_date: row.event_date,
          reference_id: row.reference_id,
          created_at: row.created_at,
        }));

        setResult(buildDailyEventsResult(date, events));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch daily events');
        setResult(buildDailyEventsResult(date, []));
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    result,
    isLoading,
    error,
    fetchEvents,
  };
}
