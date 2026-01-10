import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { supabase, isMockMode } from '@/lib/supabase';
import {
  type LearningMetrics,
  type LearningEventType,
  createInitialMetrics,
  updateMetricsOnEvent,
  getUTCDateString,
  getWeekStartUTC,
} from '../services/metricsService';

interface UseLearningMetricsResult {
  metrics: LearningMetrics;
  isLoading: boolean;
  error: string | null;
  recordEvent: (eventType: LearningEventType, referenceId?: string) => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

// Mock storage for E2E/development
let mockMetrics: LearningMetrics = createInitialMetrics();
let mockEventDates: string[] = [];

/**
 * Reset mock state (for testing)
 */
export function resetMockMetricsState(): void {
  mockMetrics = createInitialMetrics();
  mockEventDates = [];
}

/**
 * Hook to manage learning metrics (streak and weekly goal)
 */
export function useLearningMetrics(): UseLearningMetricsResult {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<LearningMetrics>(createInitialMetrics());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics from Supabase or mock
  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(createInitialMetrics());
      setIsLoading(false);
      return;
    }

    if (isMockMode) {
      // In mock mode, return current mock state
      // Recalculate to ensure week is current
      const today = getUTCDateString();
      const weekStart = getWeekStartUTC();
      if (mockMetrics.weeklyGoal.weekStartDate !== weekStart) {
        // Week changed, reset weekly progress
        mockMetrics = {
          ...mockMetrics,
          weeklyGoal: {
            ...mockMetrics.weeklyGoal,
            progress: 0,
            weekStartDate: weekStart,
          },
        };
      }
      // Check if streak should be reset (missed days)
      if (mockMetrics.lastActivityDate) {
        const lastDate = new Date(mockMetrics.lastActivityDate + 'T00:00:00Z');
        const todayDate = new Date(today + 'T00:00:00Z');
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        if (diffDays > 1) {
          // Missed more than a day, reset streak
          mockMetrics = {
            ...mockMetrics,
            streak: 0,
          };
        }
      }
      setMetrics(mockMetrics);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_learning_metrics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data) {
        const weekStart = getWeekStartUTC();
        const isNewWeek = data.week_start_date !== weekStart;

        setMetrics({
          streak: isNewWeek ? 0 : data.streak,
          lastActivityDate: data.last_activity_date,
          weeklyGoal: {
            type: data.weekly_goal_type,
            target: data.weekly_goal_target,
            progress: isNewWeek ? 0 : data.weekly_goal_progress,
            weekStartDate: weekStart,
          },
        });
      } else {
        // No metrics yet, use initial
        setMetrics(createInitialMetrics());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      setMetrics(createInitialMetrics());
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Record a new learning event
  const recordEvent = useCallback(
    async (eventType: LearningEventType, referenceId?: string) => {
      if (!user) return;

      const today = getUTCDateString();

      if (isMockMode) {
        // Update mock state
        const newMetrics = updateMetricsOnEvent(mockMetrics, today);
        mockMetrics = newMetrics;
        mockEventDates.push(today);
        setMetrics(newMetrics);
        return;
      }

      try {
        // Insert event
        const { error: eventError } = await supabase.from('learning_events').insert({
          user_id: user.id,
          event_type: eventType,
          event_date: today,
          reference_id: referenceId,
        });

        if (eventError) {
          console.error('Failed to insert learning event:', eventError);
        }

        // Update metrics
        const newMetrics = updateMetricsOnEvent(metrics, today);

        const { error: metricsError } = await supabase.from('user_learning_metrics').upsert({
          user_id: user.id,
          streak: newMetrics.streak,
          last_activity_date: newMetrics.lastActivityDate,
          weekly_goal_type: newMetrics.weeklyGoal.type,
          weekly_goal_target: newMetrics.weeklyGoal.target,
          weekly_goal_progress: newMetrics.weeklyGoal.progress,
          week_start_date: newMetrics.weeklyGoal.weekStartDate,
        });

        if (metricsError) {
          console.error('Failed to update metrics:', metricsError);
        }

        setMetrics(newMetrics);
      } catch (err) {
        console.error('Error recording event:', err);
      }
    },
    [user, metrics]
  );

  // Refresh metrics on mount and when user changes
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    recordEvent,
    refreshMetrics: fetchMetrics,
  };
}
