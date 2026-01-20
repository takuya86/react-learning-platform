import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProgressPage } from '@/pages/ProgressPage';
import { AuthProvider } from '@/features/auth';
import { ProgressProvider } from '@/features/progress';
import userEvent from '@testing-library/user-event';

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
}));

// Mock SyncStatusIndicator
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    SyncStatusIndicator: () => <div data-testid="sync-status-indicator">Synced</div>,
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProgressProvider>{ui}</ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProgressPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - basic display', () => {
    it('should render page title and subtitle', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.getByText('学習の進捗')).toBeInTheDocument();
      expect(screen.getByText('あなたの学習状況を確認しましょう')).toBeInTheDocument();
    });

    it('should render statistics cards', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.getByText('完了したレッスン')).toBeInTheDocument();
      expect(screen.getByText('進捗率')).toBeInTheDocument();
      expect(screen.getByText('連続学習日数')).toBeInTheDocument();
      expect(screen.getByText('学習中のレッスン')).toBeInTheDocument();
    });

    it('should display correct initial statistics', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.getByTestId('completed-lessons-value')).toHaveTextContent('0 / 3');
      expect(screen.getByLabelText(/進捗率 0パーセント/)).toHaveTextContent('0%');
      expect(screen.getByLabelText(/連続0日間/)).toHaveTextContent('0 日');
    });

    it('should render progress bar with correct attributes', () => {
      renderWithProviders(<ProgressPage />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-labelledby', 'overall-progress-label');
    });

    it('should render recent history section', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.getByText('最近の学習履歴')).toBeInTheDocument();
    });

    it('should render reset button', () => {
      renderWithProviders(<ProgressPage />);

      const resetButton = screen.getByRole('button', { name: /進捗をリセット/ });
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no learning history', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.getByText(/まだ学習履歴がありません/)).toBeInTheDocument();
      expect(screen.getByText('レッスンを始めましょう！')).toBeInTheDocument();
    });

    it('should have link to lessons page in empty state', () => {
      renderWithProviders(<ProgressPage />);

      const link = screen.getByRole('link', { name: /レッスン一覧ページへ移動/ });
      expect(link).toHaveAttribute('href', '/lessons');
    });

    it('should not display recent history list when empty', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.queryByTestId('recent-history-list')).not.toBeInTheDocument();
    });
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      localStorage.setItem('e2e_mock_authenticated', 'true');
      localStorage.setItem('e2e_mock_role', 'user');
    });

    it('should render sync status indicator when authenticated', async () => {
      renderWithProviders(<ProgressPage />);

      await waitFor(() => {
        expect(screen.getByTestId('sync-status-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('reset functionality', () => {
    it('should show confirmation dialog when reset button is clicked', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProviders(<ProgressPage />);

      const resetButton = screen.getByRole('button', { name: /進捗をリセット/ });
      await user.click(resetButton);

      expect(confirmSpy).toHaveBeenCalledWith('進捗をリセットしますか？この操作は取り消せません。');

      confirmSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<ProgressPage />);

      const title = screen.getByRole('heading', { level: 1, name: '学習の進捗' });
      expect(title).toBeInTheDocument();
    });

    it('should have aria-labels for statistics', () => {
      renderWithProviders(<ProgressPage />);

      expect(screen.getByLabelText(/0レッスン完了、全3レッスン中/)).toBeInTheDocument();
      expect(screen.getByLabelText(/進捗率 0パーセント/)).toBeInTheDocument();
      expect(screen.getByLabelText(/連続0日間/)).toBeInTheDocument();
    });

    it('should have proper banner role', () => {
      renderWithProviders(<ProgressPage />);

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
    });

    it('should have aria-label for sections', () => {
      renderWithProviders(<ProgressPage />);

      const statsSection = screen.getByLabelText('学習統計');
      expect(statsSection).toBeInTheDocument();

      const resetSection = screen.getByLabelText('進捗リセット操作');
      expect(resetSection).toBeInTheDocument();
    });
  });
});
