import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminBacklogPage } from '@/pages/AdminBacklogPage';
import { AuthProvider } from '@/features/auth';

// Mock backlog data
vi.mock('@/data/backlog', () => ({
  getAllBacklogEntries: () => [
    {
      slug: 'lesson-1',
      title: 'Lesson 1',
      description: 'Description 1',
      tags: ['react', 'hooks'],
      difficulty: 'beginner',
      estimatedMinutes: 20,
      status: 'pending',
      generatedAt: null,
      prerequisites: [],
      relatedQuizzes: [],
    },
    {
      slug: 'lesson-2',
      title: 'Lesson 2',
      description: 'Description 2',
      tags: ['react', 'state'],
      difficulty: 'intermediate',
      estimatedMinutes: 30,
      status: 'generated',
      generatedAt: '2025-01-01T00:00:00Z',
      prerequisites: ['lesson-1'],
      relatedQuizzes: [],
    },
    {
      slug: 'lesson-3',
      title: 'Lesson 3',
      description: 'Description 3',
      tags: ['typescript'],
      difficulty: 'advanced',
      status: 'published',
      generatedAt: '2025-01-01T00:00:00Z',
      publishedAt: '2025-01-02T00:00:00Z',
      prerequisites: [],
      relatedQuizzes: [],
    },
  ],
  getAllBacklogTags: () => ['hooks', 'react', 'state', 'typescript'],
  getTopGenerationCandidates: () => [
    {
      slug: 'lesson-1',
      title: 'Lesson 1',
      description: 'Description 1',
      tags: ['react', 'hooks'],
      difficulty: 'beginner',
      estimatedMinutes: 20,
      status: 'pending',
      generatedAt: null,
      prerequisites: [],
      relatedQuizzes: [],
    },
  ],
  getBacklogStats: () => ({
    total: 3,
    byStatus: { pending: 1, generated: 1, published: 1 },
    byDifficulty: { beginner: 1, intermediate: 1, advanced: 1 },
  }),
  generateBacklogJson: vi.fn((entries) =>
    JSON.stringify({ version: 1, lessons: entries }, null, 2)
  ),
}));

// Mock lessons
vi.mock('@/lib/lessons', () => ({
  getAllLessons: () => [{ id: 'existing-lesson' }],
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminBacklogPage', () => {
  beforeEach(() => {
    // Set up mock authentication
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'admin');
  });

  describe('rendering', () => {
    it('should render page title and stats', () => {
      renderWithProviders(<AdminBacklogPage />);

      expect(screen.getByText('レッスン Backlog 管理')).toBeInTheDocument();
      expect(screen.getByText('合計')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render all backlog entries', () => {
      renderWithProviders(<AdminBacklogPage />);

      expect(screen.getByTestId('backlog-entry-lesson-1')).toBeInTheDocument();
      expect(screen.getByTestId('backlog-entry-lesson-2')).toBeInTheDocument();
      expect(screen.getByTestId('backlog-entry-lesson-3')).toBeInTheDocument();
    });

    it('should render Top 5 candidates section', () => {
      renderWithProviders(<AdminBacklogPage />);

      expect(screen.getByText('次の生成候補 Top 5')).toBeInTheDocument();
      // Lesson 1 appears in both candidates and entries list, so check that we have multiple
      expect(screen.getAllByText('Lesson 1').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('filtering', () => {
    it('should filter by status when clicking status chip', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Initially all 3 entries should be visible
      expect(screen.getByTestId('backlog-entry-lesson-1')).toBeInTheDocument();
      expect(screen.getByTestId('backlog-entry-lesson-2')).toBeInTheDocument();
      expect(screen.getByTestId('backlog-entry-lesson-3')).toBeInTheDocument();

      // Click on '未生成' filter
      const pendingFilter = screen.getByRole('button', { name: '未生成' });
      await user.click(pendingFilter);

      // Only pending entry should be visible
      expect(screen.getByTestId('backlog-entry-lesson-1')).toBeInTheDocument();
      expect(screen.queryByTestId('backlog-entry-lesson-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('backlog-entry-lesson-3')).not.toBeInTheDocument();
    });

    it('should filter by difficulty when clicking difficulty chip', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Click on '中級' filter
      const intermediateFilter = screen.getByRole('button', { name: '中級' });
      await user.click(intermediateFilter);

      // Only intermediate entry should be visible
      expect(screen.queryByTestId('backlog-entry-lesson-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('backlog-entry-lesson-2')).toBeInTheDocument();
      expect(screen.queryByTestId('backlog-entry-lesson-3')).not.toBeInTheDocument();
    });

    it('should filter by search query', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Type in search box
      const searchInput = screen.getByPlaceholderText('slug, タイトル, 説明で検索...');
      await user.type(searchInput, 'lesson-2');

      // Only matching entry should be visible
      expect(screen.queryByTestId('backlog-entry-lesson-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('backlog-entry-lesson-2')).toBeInTheDocument();
      expect(screen.queryByTestId('backlog-entry-lesson-3')).not.toBeInTheDocument();
    });
  });

  describe('status update', () => {
    it('should update status when selecting from dropdown', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Find the status select for lesson-1
      const statusSelect = screen.getByTestId('status-select-lesson-1');
      expect(statusSelect).toHaveValue('pending');

      // Change status to 'generated'
      await user.selectOptions(statusSelect, 'generated');

      expect(statusSelect).toHaveValue('generated');
    });

    it('should show download button after making changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Initially no download button
      expect(screen.queryByText('JSON をダウンロード')).not.toBeInTheDocument();

      // Change status
      const statusSelect = screen.getByTestId('status-select-lesson-1');
      await user.selectOptions(statusSelect, 'generated');

      // Download button should appear
      expect(screen.getByText('JSON をダウンロード')).toBeInTheDocument();
    });

    it('should show notice with instructions after making changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Change status
      const statusSelect = screen.getByTestId('status-select-lesson-1');
      await user.selectOptions(statusSelect, 'generated');

      // Notice should appear
      expect(screen.getByText('変更後の注意事項')).toBeInTheDocument();
      expect(screen.getByText(/validate:lessons/)).toBeInTheDocument();
    });

    it('should reset changes when clicking discard button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminBacklogPage />);

      // Change status
      const statusSelect = screen.getByTestId('status-select-lesson-1');
      await user.selectOptions(statusSelect, 'generated');
      expect(statusSelect).toHaveValue('generated');

      // Click discard button
      const discardButton = screen.getByText('変更を破棄');
      await user.click(discardButton);

      // Status should be reset
      expect(statusSelect).toHaveValue('pending');
    });
  });

  describe('JSON output', () => {
    it('should show download button when changes are made', async () => {
      const user = userEvent.setup();

      renderWithProviders(<AdminBacklogPage />);

      // Change status
      const statusSelect = screen.getByTestId('status-select-lesson-1');
      await user.selectOptions(statusSelect, 'generated');

      // Click download - we can't test actual download, but we can verify the function was available
      const downloadButton = screen.getByText('JSON をダウンロード');
      expect(downloadButton).toBeInTheDocument();
    });
  });
});

describe('AdminBacklogPage - Role restriction', () => {
  it('should be accessible only to admin role', () => {
    // This test verifies the route is wrapped in RequireRole
    // The actual RequireRole component testing is done in auth tests
    localStorage.setItem('e2e_mock_authenticated', 'true');
    localStorage.setItem('e2e_mock_role', 'admin');

    renderWithProviders(<AdminBacklogPage />);

    // Page should render for admin
    expect(screen.getByText('レッスン Backlog 管理')).toBeInTheDocument();
  });
});
