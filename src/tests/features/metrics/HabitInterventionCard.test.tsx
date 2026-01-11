import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { HabitInterventionCard } from '@/features/metrics/components/HabitInterventionCard';

// Mock the hooks
const mockRecordEvent = vi.fn();
const mockMetrics = {
  streak: 5,
  lastActivityDate: '2024-01-15',
  weeklyGoal: {
    type: 'days' as const,
    target: 5,
    progress: 2,
    weekStartDate: '2024-01-15',
  },
};

const mockStreakExplain = {
  currentStreak: 5,
  todayCount: 0,
  lastActiveDateUTC: '2024-01-15',
  reasonCode: 'ACTIVE_YESTERDAY' as const,
  message: '',
  details: [],
};

const mockWeeklyExplain = {
  goalPerWeek: 5,
  completedDaysThisWeek: 2,
  weekStartUTC: '2024-01-15',
  weekEndUTC: '2024-01-21',
  reasonCode: 'BEHIND' as const,
  message: '',
  details: [],
};

// Module mocks
vi.mock('@/features/metrics/hooks/useLearningMetrics', () => ({
  useLearningMetrics: () => ({
    metrics: mockMetrics,
    streakExplain: mockStreakExplain,
    weeklyExplain: mockWeeklyExplain,
    isLoading: false,
    error: null,
    recordEvent: mockRecordEvent,
    refreshMetrics: vi.fn(),
  }),
  resetMockMetricsState: vi.fn(),
}));

vi.mock('@/features/insights', () => ({
  useRecommendations: () => ({
    recommendations: [{ id: 'lesson-1', title: 'Test Lesson', score: 100, reasons: [] }],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/actionable/services/actionRecommendationService', () => ({
  selectBestLesson: () => ({ id: 'lesson-1', title: 'Test Lesson' }),
}));

// Wrapper with router
const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('HabitInterventionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('intervention logging', () => {
    it('logs STREAK_RESCUE intervention when displayed (danger state)', async () => {
      // The mock already sets up ACTIVE_YESTERDAY with streak > 0
      // This with danger state should trigger STREAK_RESCUE
      vi.doMock('@/features/metrics/services/habitScoreService', async () => {
        const actual = await vi.importActual('@/features/metrics/services/habitScoreService');
        return {
          ...actual,
          buildHabitScore: () => 30, // danger score
          getHabitState: () => 'danger',
        };
      });

      render(<HabitInterventionCard recentActiveDays={2} />, { wrapper });

      await waitFor(() => {
        expect(mockRecordEvent).toHaveBeenCalledWith('intervention_shown', 'STREAK_RESCUE');
      });
    });

    it('does not log duplicate events on re-render', async () => {
      vi.doMock('@/features/metrics/services/habitScoreService', async () => {
        const actual = await vi.importActual('@/features/metrics/services/habitScoreService');
        return {
          ...actual,
          buildHabitScore: () => 30,
          getHabitState: () => 'danger',
        };
      });

      const { rerender } = render(<HabitInterventionCard recentActiveDays={2} />, { wrapper });

      await waitFor(() => {
        expect(mockRecordEvent).toHaveBeenCalledTimes(1);
      });

      // Re-render the component
      rerender(<HabitInterventionCard recentActiveDays={2} />);

      // Should still only have 1 call
      await waitFor(() => {
        expect(mockRecordEvent).toHaveBeenCalledTimes(1);
      });
    });
  });
});
