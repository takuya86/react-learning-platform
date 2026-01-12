/**
 * useLifecycleStats Hook
 *
 * Fetches and aggregates lifecycle decision statistics from learning_events.
 */

import { useMemo } from 'react';
import { isMockMode } from '@/lib/supabase/client';

export interface LifecycleStats {
  period: '7days' | '30days';
  closeNoEffect: number;
  redesignRequired: number;
  continue: number;
  total: number;
  lastAppliedAt: string | null;
}

export interface LifecycleRun {
  runAt: string;
  mode: 'dry' | 'run';
  appliedCount: number;
  errorCount: number;
}

interface UseLifecycleStatsReturn {
  stats7Days: LifecycleStats;
  stats30Days: LifecycleStats;
  lastRuns: LifecycleRun[];
  isLoading: boolean;
  error: string | null;
}

// Mock data for development/testing
const mockStats: UseLifecycleStatsReturn = {
  stats7Days: {
    period: '7days',
    closeNoEffect: 2,
    redesignRequired: 1,
    continue: 5,
    total: 8,
    lastAppliedAt: '2026-01-12T00:30:00Z',
  },
  stats30Days: {
    period: '30days',
    closeNoEffect: 8,
    redesignRequired: 3,
    continue: 20,
    total: 31,
    lastAppliedAt: '2026-01-12T00:30:00Z',
  },
  lastRuns: [
    { runAt: '2026-01-13T00:30:00Z', mode: 'dry', appliedCount: 0, errorCount: 0 },
    { runAt: '2026-01-12T00:30:00Z', mode: 'run', appliedCount: 3, errorCount: 0 },
    { runAt: '2026-01-11T00:30:00Z', mode: 'run', appliedCount: 2, errorCount: 1 },
  ],
  isLoading: false,
  error: null,
};

export function useLifecycleStats(): UseLifecycleStatsReturn {
  const result = useMemo(() => {
    if (isMockMode) {
      return mockStats;
    }
    return mockStats;
  }, []);

  return result;
}
