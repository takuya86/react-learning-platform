import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  buildMetricsExplain,
  type StreakExplain,
  type WeeklyGoalExplain,
} from '../services/metricsExplainService';

interface UseLearningMetricsResult {
  metrics: LearningMetrics;
  streakExplain: StreakExplain;
  weeklyExplain: WeeklyGoalExplain;
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
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics from Supabase or mock
  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(createInitialMetrics());
      setTodayCount(0);
      setIsLoading(false);
      return;
    }

    const today = getUTCDateString();

    if (isMockMode) {
      // In mock mode, return current mock state
      // Recalculate to ensure week is current
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
      // Count today's events
      const todayEventCount = mockEventDates.filter((d) => d === today).length;
      setTodayCount(todayEventCount);
      setMetrics(mockMetrics);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch metrics and today's event count in parallel
      const [metricsResult, eventsResult] = await Promise.all([
        supabase.from('user_learning_metrics').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('learning_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_date', today),
      ]);

      if (metricsResult.error) {
        throw new Error(metricsResult.error.message);
      }

      // Set today's event count
      setTodayCount(eventsResult.data?.length || 0);

      if (metricsResult.data) {
        const weekStart = getWeekStartUTC();
        const isNewWeek = metricsResult.data.week_start_date !== weekStart;

        setMetrics({
          streak: isNewWeek ? 0 : metricsResult.data.streak,
          lastActivityDate: metricsResult.data.last_activity_date,
          weeklyGoal: {
            type: metricsResult.data.weekly_goal_type,
            target: metricsResult.data.weekly_goal_target,
            progress: isNewWeek ? 0 : metricsResult.data.weekly_goal_progress,
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
      setTodayCount(0);
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
        setTodayCount((prev) => prev + 1);
        return;
      }

      try {
        // Upsert event with ignoreDuplicates to prevent duplicate entries
        // UNIQUE constraint on (user_id, event_type, reference_id, event_date) ensures idempotency
        // 同一日・同一対象のイベントは1件のみ保存される（DB側で担保）
        const { error: eventError } = await supabase.from('learning_events').upsert(
          {
            user_id: user.id,
            event_type: eventType,
            event_date: today,
            reference_id: referenceId || '',
          },
          {
            onConflict: 'user_id,event_type,reference_id,event_date',
            ignoreDuplicates: true,
          }
        );

        if (eventError) {
          console.error('Failed to upsert learning event:', eventError);
        }

        // Update metrics
        const newMetrics = updateMetricsOnEvent(metrics, today);

        const { error: metricsError } = await supabase.from('user_learning_metrics').upsert(
          {
            user_id: user.id,
            streak: newMetrics.streak,
            last_activity_date: newMetrics.lastActivityDate,
            weekly_goal_type: newMetrics.weeklyGoal.type,
            weekly_goal_target: newMetrics.weeklyGoal.target,
            weekly_goal_progress: newMetrics.weeklyGoal.progress,
            week_start_date: newMetrics.weeklyGoal.weekStartDate,
          },
          { onConflict: 'user_id' }
        );

        if (metricsError) {
          console.error('Failed to update metrics:', metricsError);
        }

        setMetrics(newMetrics);
        setTodayCount((prev) => prev + 1);
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

  // Build explanations
  const { streak: streakExplain, weekly: weeklyExplain } = useMemo(() => {
    return buildMetricsExplain({
      metrics,
      todayCount,
    });
  }, [metrics, todayCount]);

  return {
    metrics,
    streakExplain,
    weeklyExplain,
    isLoading,
    error,
    recordEvent,
    refreshMetrics: fetchMetrics,
  };
}
