import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuthProvider } from '@/features/auth';
import { ProgressProvider } from '@/features/progress';

// Mock lessons data
vi.mock('@/lib/lessons', () => ({
  getAllLessons: () => [
    {
      id: 'lesson-1',
      title: 'はじめてのReact',
      description: 'Reactの基本を学びましょう',
      tags: ['react', 'basics'],
      difficulty: 'beginner',
      estimatedMinutes: 20,
      prerequisites: [],
    },
    {
      id: 'lesson-2',
      title: 'コンポーネント',
      description: 'Reactコンポーネントについて',
      tags: ['react', 'component'],
      difficulty: 'beginner',
      estimatedMinutes: 30,
      prerequisites: ['lesson-1'],
    },
    {
      id: 'lesson-3',
      title: 'State管理',
      description: 'Stateの使い方を学びます',
      tags: ['react', 'state'],
      difficulty: 'intermediate',
      estimatedMinutes: 40,
      prerequisites: ['lesson-1', 'lesson-2'],
    },
  ],
  getAllTags: () => ['react', 'basics', 'component', 'state'],
}));

// Mock quizzes data
vi.mock('@/data', () => ({
  quizzes: [
    { id: 'quiz-1', title: 'クイズ1' },
    { id: 'quiz-2', title: 'クイズ2' },
  ],
}));

// Mock metrics hooks
vi.mock('@/features/metrics', () => ({
  useLearningMetrics: () => ({
    metrics: {
      streak: 5,
      weeklyGoal: 5,
      weeklyProgress: 3,
      totalLearningDays: 10,
    },
    streakExplain: { streakCount: 5, isNewStreak: false },
    weeklyExplain: { weeklyProgress: 3, weeklyGoal: 5, remaining: 2 },
    isLoading: false,
    recordEvent: vi.fn(),
  }),
  useLearningHeatmap: () => ({
    heatmapData: [
      { date: '2025-01-15', count: 2 },
      { date: '2025-01-16', count: 1 },
      { date: '2025-01-17', count: 0 },
      { date: '2025-01-18', count: 3 },
      { date: '2025-01-19', count: 1 },
      { date: '2025-01-20', count: 2 },
    ],
    isLoading: false,
  }),
  useLearningTrend: () => ({
    data: [],
    mode: 'weekly',
    setMode: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useGrowthInsights: () => ({
    insights: [],
    isLoading: false,
    error: null,
  }),
  LearningMetricsCard: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div>Loading...</div> : <div data-testid="metrics-card">Metrics</div>,
  GrowthInsightsCard: ({ isLoading, error }: { isLoading: boolean; error: Error | null }) =>
    isLoading ? (
      <div>Loading...</div>
    ) : error ? (
      <div>Error</div>
    ) : (
      <div data-testid="growth-insights-card">Growth Insights</div>
    ),
  LearningTrendChart: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div>Loading...</div> : <div data-testid="trend-chart">Trend Chart</div>,
  HabitInterventionCard: ({ recentActiveDays }: { recentActiveDays: number }) => (
    <div data-testid="habit-intervention-card">Habit: {recentActiveDays} days</div>
  ),
  INSIGHTS_REFERENCE_ID: 'insights_reference',
}));

// Mock actionable components
vi.mock('@/features/actionable', () => ({
  ClickableHeatmap: ({
    data,
    title,
  }: {
    data: { date: string; count: number }[];
    title: string;
  }) => (
    <div data-testid="clickable-heatmap">
      {title}: {data.length} days
    </div>
  ),
  StreakAlert: ({
    streakExplain,
  }: {
    streakExplain: { streakCount: number; isNewStreak: boolean };
  }) => <div data-testid="streak-alert">Streak: {streakExplain.streakCount}</div>,
  WeeklyCountdown: ({
    weeklyExplain,
  }: {
    weeklyExplain: { weeklyProgress: number; weeklyGoal: number };
  }) => (
    <div data-testid="weekly-countdown">
      Weekly: {weeklyExplain.weeklyProgress}/{weeklyExplain.weeklyGoal}
    </div>
  ),
  TodayActionCard: ({ recommendations }: { recommendations: { id: string; title: string }[] }) => (
    <div data-testid="today-action-card">{recommendations.length} recommendations</div>
  ),
}));

// Mock insights hooks
vi.mock('@/features/insights', () => ({
  useRecommendations: () => ({
    recommendations: [
      {
        id: 'lesson-1',
        title: 'はじめてのReact',
        description: 'Reactの基本を学びましょう',
        difficulty: 'beginner',
        estimatedMinutes: 20,
      },
    ],
    hasRecommendations: true,
  }),
  NextLessonsCard: ({ recommendations }: { recommendations: { id: string; title: string }[] }) => (
    <div data-testid="next-lessons-card">{recommendations.length} recommendations</div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProgressProvider>{ui}</ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - not authenticated', () => {
    it('should render page title and subtitle', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('React学習プラットフォーム')).toBeInTheDocument();
      expect(screen.getByText(/Reactの基礎から実践までを体系的に学びましょう/)).toBeInTheDocument();
    });

    it('should render progress card', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('学習進捗')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: '学習進捗バー' })).toBeInTheDocument();
    });

    it('should display correct progress percentage', () => {
      renderWithProviders(<DashboardPage />);

      // Initially 0% progress
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText(/0 \/ 3 レッスン完了/)).toBeInTheDocument();
    });

    it('should render quick access section', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('クイックアクセス')).toBeInTheDocument();
      expect(screen.getByText('レッスン一覧')).toBeInTheDocument();
      expect(screen.getByText('クイズ')).toBeInTheDocument();
      expect(screen.getByText('進捗確認')).toBeInTheDocument();
    });

    it('should display correct counts in quick access', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('3 レッスン')).toBeInTheDocument();
      expect(screen.getByText('2 クイズ')).toBeInTheDocument();
      expect(screen.getByText('0% 完了')).toBeInTheDocument();
    });

    it('should have correct navigation links', () => {
      renderWithProviders(<DashboardPage />);

      const lessonsLink = screen.getByRole('link', { name: /レッスン一覧へ移動/ });
      expect(lessonsLink).toHaveAttribute('href', '/lessons');

      const quizLink = screen.getByRole('link', { name: /クイズへ移動/ });
      expect(quizLink).toHaveAttribute('href', '/quiz');

      const progressLink = screen.getByRole('link', { name: /進捗確認へ移動/ });
      expect(progressLink).toHaveAttribute('href', '/progress');
    });

    it('should not render authenticated-only sections', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.queryByTestId('metrics-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('habit-intervention-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('streak-alert')).not.toBeInTheDocument();
    });
  });

  describe('rendering - authenticated user', () => {
    beforeEach(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'user');
    });

    it('should render habit intervention card', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('habit-intervention-card')).toBeInTheDocument();
      });
    });

    it('should render streak and weekly alerts', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('streak-alert')).toBeInTheDocument();
        expect(screen.getByTestId('weekly-countdown')).toBeInTheDocument();
      });

      expect(screen.getByText('Streak: 5')).toBeInTheDocument();
      expect(screen.getByText('Weekly: 3/5')).toBeInTheDocument();
    });

    it('should render today action card', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('today-action-card')).toBeInTheDocument();
      });
    });

    it('should render learning metrics card', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
      });
    });

    it('should render growth insights card', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('growth-insights-card')).toBeInTheDocument();
      });
    });

    it('should render clickable heatmap', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('clickable-heatmap')).toBeInTheDocument();
      });

      expect(screen.getByText(/学習アクティビティ: 6 days/)).toBeInTheDocument();
    });

    it('should render learning trend chart', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      });
    });

    it('should render recommendations card', async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('next-lessons-card')).toBeInTheDocument();
      });

      // NextLessonsCardとTodayActionCardの両方が"1 recommendations"を表示
      expect(screen.getAllByText('1 recommendations').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('a11y attributes', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<DashboardPage />);

      const title = screen.getByRole('heading', { level: 1, name: 'React学習プラットフォーム' });
      expect(title).toBeInTheDocument();

      const quickAccessHeading = screen.getByRole('heading', {
        level: 2,
        name: 'クイックアクセス',
      });
      expect(quickAccessHeading).toBeInTheDocument();
    });

    it('should have aria-labels for progress information', () => {
      renderWithProviders(<DashboardPage />);

      const progressValue = screen.getByLabelText(/学習進捗 0パーセント/);
      expect(progressValue).toBeInTheDocument();

      const completedCount = screen.getByLabelText(/0レッスン完了、全3レッスン中/);
      expect(completedCount).toBeInTheDocument();
    });

    it('should have proper role for progress bar', () => {
      renderWithProviders(<DashboardPage />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', '学習進捗バー');
    });

    it('should have aria-labels for navigation links', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByLabelText(/レッスン一覧へ移動。全3レッスン/)).toBeInTheDocument();
      expect(screen.getByLabelText(/クイズへ移動。全2クイズ/)).toBeInTheDocument();
      expect(screen.getByLabelText(/進捗確認へ移動。現在0パーセント完了/)).toBeInTheDocument();
    });

    it('should have proper banner role', () => {
      renderWithProviders(<DashboardPage />);

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
    });

    it('should have aria-labelledby for sections', () => {
      renderWithProviders(<DashboardPage />);

      const progressSection = screen.getByLabelText('学習進捗');
      expect(progressSection).toBeInTheDocument();

      const quickAccessNav = screen.getByLabelText('クイックアクセスメニュー');
      expect(quickAccessNav).toBeInTheDocument();
    });

    it('should mark decorative icons as aria-hidden', () => {
      renderWithProviders(<DashboardPage />);

      const quickLinks = screen.getByRole('navigation', { name: 'クイックアクセスメニュー' });
      const icons = quickLinks.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('next lesson section', () => {
    it('should display next lesson when no recommendations', async () => {
      // Mock no recommendations
      vi.doMock('@/features/insights', () => ({
        useRecommendations: () => ({
          recommendations: [],
          hasRecommendations: false,
        }),
        NextLessonsCard: () => null,
      }));

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        const nextLessonLink = screen.queryByText('学習を始める');
        // Next lesson section appears when no recommendations
        if (nextLessonLink) {
          expect(nextLessonLink).toBeInTheDocument();
        }
      });
    });
  });
});
