import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { useLearningMetrics, resetMockMetricsState } from '@/features/metrics';

// Mock isMockMode
vi.mock('@/lib/supabase/client', () => ({
  isMockMode: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
  },
}));

// Wrapper with providers
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('useLearningMetrics', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockMetricsState();
  });

  it('should return initial metrics when not logged in', async () => {
    const { result } = renderHook(() => useLearningMetrics(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.metrics.streak).toBe(0);
    expect(result.current.metrics.lastActivityDate).toBeNull();
    expect(result.current.metrics.weeklyGoal.progress).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should update metrics when recording an event (mock mode)', async () => {
    // Set up mock auth
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'user');

    const { result } = renderHook(() => useLearningMetrics(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Record an event
    await act(async () => {
      await result.current.recordEvent('lesson_completed', 'lesson-1');
    });

    expect(result.current.metrics.streak).toBe(1);
    expect(result.current.metrics.lastActivityDate).not.toBeNull();
    expect(result.current.metrics.weeklyGoal.progress).toBe(1);
  });

  it('should not increase weekly progress on same day (mock mode)', async () => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'user');

    const { result } = renderHook(() => useLearningMetrics(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Record first event
    await act(async () => {
      await result.current.recordEvent('lesson_completed', 'lesson-1');
    });

    const firstProgress = result.current.metrics.weeklyGoal.progress;

    // Record second event on same day
    await act(async () => {
      await result.current.recordEvent('quiz_completed', 'quiz-1');
    });

    // Progress should not increase (same day)
    expect(result.current.metrics.weeklyGoal.progress).toBe(firstProgress);
  });
});
