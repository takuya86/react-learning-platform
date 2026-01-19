import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LessonsPage } from '@/pages/LessonsPage';
import { ProgressProvider } from '@/features/progress';

// Mock lessons data
const mockLessons = [
  {
    id: 'lesson-1',
    title: 'はじめてのReact',
    description: 'Reactの基本を学びましょう',
    tags: ['react', 'basics'],
    difficulty: 'beginner' as const,
    estimatedMinutes: 20,
    prerequisites: [],
  },
  {
    id: 'lesson-2',
    title: 'コンポーネントの基礎',
    description: 'Reactコンポーネントについて学びます',
    tags: ['react', 'component'],
    difficulty: 'beginner' as const,
    estimatedMinutes: 30,
    prerequisites: ['lesson-1'],
  },
  {
    id: 'lesson-3',
    title: 'State管理',
    description: 'Stateの使い方を学びます',
    tags: ['react', 'state', 'hooks'],
    difficulty: 'intermediate' as const,
    estimatedMinutes: 40,
    prerequisites: ['lesson-1', 'lesson-2'],
  },
  {
    id: 'lesson-4',
    title: '高度なパターン',
    description: '高度な設計パターンを学びます',
    tags: ['react', 'patterns', 'advanced'],
    difficulty: 'advanced' as const,
    estimatedMinutes: 60,
    prerequisites: ['lesson-3'],
  },
];

vi.mock('@/lib/lessons', () => ({
  getAllLessons: () => mockLessons,
  getAllTags: () => ['react', 'basics', 'component', 'state', 'hooks', 'patterns', 'advanced'],
}));

interface MockLesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

// Mock topological sort
vi.mock('@/lib/lessons/sort', () => ({
  topologicalSort: <T,>(lessons: T[]) => lessons,
}));

// Mock LessonFilter component
vi.mock('@/features/lessons', () => ({
  LessonFilter: ({
    searchQuery,
    onSearchChange,
    selectedTag,
    onTagChange,
    selectedDifficulty,
    onDifficultyChange,
    availableTags,
  }: {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedTag: string;
    onTagChange: (value: string) => void;
    selectedDifficulty: string;
    onDifficultyChange: (value: string) => void;
    availableTags: string[];
  }) => (
    <div data-testid="lesson-filter">
      <input
        type="text"
        placeholder="レッスンを検索..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="レッスン検索"
      />
      <select
        value={selectedTag}
        onChange={(e) => onTagChange(e.target.value)}
        aria-label="タグでフィルター"
      >
        <option value="">すべてのタグ</option>
        {availableTags.map((tag: string) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
      <select
        value={selectedDifficulty}
        onChange={(e) => onDifficultyChange(e.target.value)}
        aria-label="難易度でフィルター"
      >
        <option value="">すべての難易度</option>
        <option value="beginner">初級</option>
        <option value="intermediate">中級</option>
        <option value="advanced">上級</option>
      </select>
    </div>
  ),
  LessonList: ({ lessons }: { lessons: MockLesson[] }) => (
    <div data-testid="lesson-list">
      {lessons.length === 0 ? (
        <p>レッスンが見つかりません</p>
      ) : (
        <ul>
          {lessons.map((lesson) => (
            <li key={lesson.id} data-testid={`lesson-item-${lesson.id}`}>
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <span>{lesson.difficulty}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ProgressProvider>{ui}</ProgressProvider>
    </BrowserRouter>
  );
};

describe('LessonsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render page title and subtitle', () => {
      renderWithProviders(<LessonsPage />);

      expect(screen.getByText('レッスン一覧')).toBeInTheDocument();
      expect(
        screen.getByText(/Reactの基礎から実践までを学びましょう。全4レッスン/)
      ).toBeInTheDocument();
    });

    it('should render lesson filter', () => {
      renderWithProviders(<LessonsPage />);

      expect(screen.getByTestId('lesson-filter')).toBeInTheDocument();
      expect(screen.getByLabelText('レッスン検索')).toBeInTheDocument();
      expect(screen.getByLabelText('タグでフィルター')).toBeInTheDocument();
      expect(screen.getByLabelText('難易度でフィルター')).toBeInTheDocument();
    });

    it('should render lesson list with all lessons initially', () => {
      renderWithProviders(<LessonsPage />);

      expect(screen.getByTestId('lesson-list')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-item-lesson-1')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-item-lesson-3')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-item-lesson-4')).toBeInTheDocument();
    });

    it('should display lesson details', () => {
      renderWithProviders(<LessonsPage />);

      expect(screen.getByText('はじめてのReact')).toBeInTheDocument();
      expect(screen.getByText('Reactの基本を学びましょう')).toBeInTheDocument();
      expect(screen.getByText('コンポーネントの基礎')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should filter lessons by search query', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');
      await user.type(searchInput, 'コンポーネント');

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-item-lesson-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-3')).not.toBeInTheDocument();
      });
    });

    it('should filter lessons by tag in search query', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');
      await user.type(searchInput, 'hooks');

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-item-lesson-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-3')).toBeInTheDocument();
      });
    });

    it('should show empty state when no matches', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');
      await user.type(searchInput, 'xyz-non-existent');

      await waitFor(() => {
        expect(screen.getByText('レッスンが見つかりません')).toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');
      await user.type(searchInput, 'REACT');

      await waitFor(() => {
        // All lessons have 'react' tag, so all should be visible
        expect(screen.getByTestId('lesson-item-lesson-1')).toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
      });
    });
  });

  describe('tag filtering', () => {
    it('should filter lessons by selected tag', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const tagSelect = screen.getByLabelText('タグでフィルター');
      await user.selectOptions(tagSelect, 'state');

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-item-lesson-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-3')).toBeInTheDocument();
      });
    });

    it('should show all lessons when tag is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const tagSelect = screen.getByLabelText('タグでフィルター');

      // Select a tag
      await user.selectOptions(tagSelect, 'basics');

      await waitFor(() => {
        expect(screen.getByTestId('lesson-item-lesson-1')).toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-2')).not.toBeInTheDocument();
      });

      // Clear tag
      await user.selectOptions(tagSelect, '');

      await waitFor(() => {
        expect(screen.getByTestId('lesson-item-lesson-1')).toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
      });
    });
  });

  describe('difficulty filtering', () => {
    it('should filter lessons by beginner difficulty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      await user.selectOptions(difficultySelect, 'beginner');

      await waitFor(() => {
        expect(screen.getByTestId('lesson-item-lesson-1')).toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-3')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-4')).not.toBeInTheDocument();
      });
    });

    it('should filter lessons by intermediate difficulty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      await user.selectOptions(difficultySelect, 'intermediate');

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-item-lesson-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-3')).toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-4')).not.toBeInTheDocument();
      });
    });

    it('should filter lessons by advanced difficulty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const difficultySelect = screen.getByLabelText('難易度でフィルター');
      await user.selectOptions(difficultySelect, 'advanced');

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-item-lesson-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-3')).not.toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-4')).toBeInTheDocument();
      });
    });
  });

  describe('combined filtering', () => {
    it('should apply search and tag filters together', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');
      const tagSelect = screen.getByLabelText('タグでフィルター');

      await user.type(searchInput, 'react');
      await user.selectOptions(tagSelect, 'state');

      await waitFor(() => {
        expect(screen.queryByTestId('lesson-item-lesson-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-3')).toBeInTheDocument();
      });
    });

    it('should apply all three filters together', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');
      const tagSelect = screen.getByLabelText('タグでフィルター');
      const difficultySelect = screen.getByLabelText('難易度でフィルター');

      await user.type(searchInput, 'react');
      await user.selectOptions(tagSelect, 'react');
      await user.selectOptions(difficultySelect, 'beginner');

      await waitFor(() => {
        expect(screen.getByTestId('lesson-item-lesson-1')).toBeInTheDocument();
        expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-3')).not.toBeInTheDocument();
        expect(screen.queryByTestId('lesson-item-lesson-4')).not.toBeInTheDocument();
      });
    });
  });

  describe('a11y attributes', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<LessonsPage />);

      const title = screen.getByRole('heading', { level: 1, name: 'レッスン一覧' });
      expect(title).toBeInTheDocument();
    });

    it('should have proper banner role', () => {
      renderWithProviders(<LessonsPage />);

      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toContainElement(screen.getByText('レッスン一覧'));
    });

    it('should have aria-label for filter section', () => {
      renderWithProviders(<LessonsPage />);

      const filterSection = screen.getByLabelText('レッスンフィルター');
      expect(filterSection).toBeInTheDocument();
    });

    it('should have aria-live for lesson list', () => {
      renderWithProviders(<LessonsPage />);

      const listSection = screen.getByLabelText('レッスンリスト');
      expect(listSection).toHaveAttribute('aria-live', 'polite');
      expect(listSection).toHaveAttribute('aria-atomic', 'false');
    });

    it('should have accessible form controls', () => {
      renderWithProviders(<LessonsPage />);

      expect(screen.getByLabelText('レッスン検索')).toBeInTheDocument();
      expect(screen.getByLabelText('タグでフィルター')).toBeInTheDocument();
      expect(screen.getByLabelText('難易度でフィルター')).toBeInTheDocument();
    });
  });

  describe('debounced search', () => {
    it('should debounce search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LessonsPage />);

      const searchInput = screen.getByLabelText('レッスン検索');

      // Type quickly
      await user.type(searchInput, 'component');

      // Results should update after debounce
      await waitFor(
        () => {
          expect(screen.getByTestId('lesson-item-lesson-2')).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });
});
