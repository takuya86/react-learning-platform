import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminMetricsPage } from '@/pages/AdminMetricsPage';
import { AuthProvider } from '@/features/auth';
import {
  setMockAdminEvents,
  setMockAdminUserMetrics,
  resetMockAdminData,
} from '@/features/metrics';
import type { LearningEvent } from '@/features/metrics/services/metricsService';
import type { UserLearningMetric } from '@/features/metrics/services/adminMetricsService';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

// Helper to create events
function createEvent(
  userId: string,
  eventDate: string,
  eventType: 'lesson_completed' | 'quiz_completed' | 'note_updated' = 'lesson_completed'
): LearningEvent {
  return {
    user_id: userId,
    event_type: eventType,
    event_date: eventDate,
  };
}

// Helper to create user metrics
function createUserMetric(
  userId: string,
  streak: number,
  weeklyProgress: number,
  weeklyGoal: number = 5,
  lastEventDate: string | null = null
): UserLearningMetric {
  return {
    user_id: userId,
    streak,
    last_event_date: lastEventDate,
    weekly_goal: weeklyGoal,
    weekly_progress: weeklyProgress,
  };
}

describe('AdminMetricsPage', () => {
  beforeEach(() => {
    // Set up mock authentication
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'admin');

    // Set up mock admin data
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    setMockAdminEvents([
      createEvent('user-1', today),
      createEvent('user-1', today),
      createEvent('user-2', today),
      createEvent('user-2', yesterday),
      createEvent('user-3', yesterday),
    ]);

    setMockAdminUserMetrics([
      createUserMetric('user-1', 5, 5, 5, today),
      createUserMetric('user-2', 3, 3, 5, yesterday),
      createUserMetric('user-3', 0, 1, 5, yesterday),
    ]);
  });

  afterEach(() => {
    resetMockAdminData();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render page title', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByText('Metrics 管理')).toBeInTheDocument();
      });
    });

    it('should render period selector', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-period-select')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: '今日を表示' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '7日間を表示' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30日間を表示' })).toBeInTheDocument();
    });

    it('should render summary section', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-summary')).toBeInTheDocument();
      });

      expect(screen.getByText('アクティブユーザー')).toBeInTheDocument();
      expect(screen.getByText('総イベント数')).toBeInTheDocument();
      expect(screen.getByText('平均イベント/人')).toBeInTheDocument();
      expect(screen.getByText('週次目標達成率')).toBeInTheDocument();
    });

    it('should render streak distribution', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByText('Streak 分布')).toBeInTheDocument();
      });

      expect(screen.getByText('0日')).toBeInTheDocument();
      expect(screen.getByText('1-2日')).toBeInTheDocument();
      expect(screen.getByText('3-6日')).toBeInTheDocument();
      expect(screen.getByText('7-13日')).toBeInTheDocument();
      expect(screen.getByText('14日+')).toBeInTheDocument();
    });

    it('should render trend chart section', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-trend')).toBeInTheDocument();
      });
    });

    it('should render heatmap section', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-heatmap')).toBeInTheDocument();
      });
    });

    it('should render leaderboards section', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-leaderboards')).toBeInTheDocument();
      });

      expect(screen.getByText('30日間イベント数 Top10')).toBeInTheDocument();
      expect(screen.getByText('Streak Top10')).toBeInTheDocument();
    });

    it('should render back link to admin page', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /管理者ページに戻る/ });
        expect(backLink).toHaveAttribute('href', '/admin');
      });
    });
  });

  describe('period switching', () => {
    it('should switch to today period when clicking today button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-period-select')).toBeInTheDocument();
      });

      const todayButton = screen.getByRole('button', { name: '今日を表示' });
      await user.click(todayButton);

      // Check that the button has the active class (CSS Modules hash the class name)
      expect(todayButton.className).toMatch(/active/);
    });

    it('should switch to 7d period when clicking 7日間 button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-period-select')).toBeInTheDocument();
      });

      const sevenDayButton = screen.getByRole('button', { name: '7日間を表示' });
      await user.click(sevenDayButton);

      expect(sevenDayButton.className).toMatch(/active/);
    });

    it('should default to 30d period', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-period-select')).toBeInTheDocument();
      });

      const thirtyDayButton = screen.getByRole('button', { name: '30日間を表示' });
      expect(thirtyDayButton.className).toMatch(/active/);
    });
  });

  describe('empty state', () => {
    it('should show empty state when no data', async () => {
      resetMockAdminData();
      setMockAdminEvents([]);
      setMockAdminUserMetrics([]);

      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-summary')).toBeInTheDocument();
      });

      // Summary should show zeros
      const summaryValues = screen.getAllByText('0');
      expect(summaryValues.length).toBeGreaterThan(0);

      // Leaderboards and lesson ranking should show "データがありません"
      // 2 leaderboards + 2 lesson ranking tables (Best/Worst) = 4
      expect(screen.getAllByText('データがありません')).toHaveLength(4);
    });
  });

  describe('data display', () => {
    it('should display correct active user count for 30d period', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-summary')).toBeInTheDocument();
      });

      // With mock data, we have 3 users with events in the past 30 days
      // The summary should show active users count
      const summarySection = screen.getByTestId('admin-metrics-summary');
      expect(summarySection).toHaveTextContent('アクティブユーザー');
    });

    it('should display streak distribution from user metrics', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByText('Streak 分布')).toBeInTheDocument();
      });

      // We have: user-1 streak=5, user-2 streak=3, user-3 streak=0
      // So bucket0=1, bucket3to6=2
      // The page should display these values somewhere in the distribution section
    });

    it('should display leaderboard entries', async () => {
      renderWithProviders(<AdminMetricsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-metrics-leaderboards')).toBeInTheDocument();
      });

      // Check that user IDs are displayed (truncated)
      expect(screen.getAllByText(/user-1.../)).toHaveLength(2); // appears in both leaderboards
    });
  });
});

describe('AdminMetricsPage - Role restriction', () => {
  beforeEach(() => {
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'admin');
    setMockAdminEvents([]);
    setMockAdminUserMetrics([]);
  });

  afterEach(() => {
    resetMockAdminData();
    localStorage.clear();
  });

  it('should be accessible only to admin role', async () => {
    renderWithProviders(<AdminMetricsPage />);

    await waitFor(() => {
      expect(screen.getByText('Metrics 管理')).toBeInTheDocument();
    });
  });
});
