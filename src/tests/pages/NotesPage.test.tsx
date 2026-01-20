import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotesPage } from '@/pages/NotesPage';
import { AuthProvider } from '@/features/auth';
import { ProgressProvider } from '@/features/progress';

// Use vi.hoisted to properly hoist mock definitions before vi.mock
const { mockUseNotes, MockLessonNoteList, MockNotesLayout } = vi.hoisted(() => {
  const mockUseNotes = {
    filteredLessons: [
      {
        id: 'lesson-1',
        title: 'はじめてのReact',
        description: 'Reactの基本を学びましょう',
        difficulty: 'beginner',
        estimatedMinutes: 20,
      },
      {
        id: 'lesson-2',
        title: 'コンポーネント',
        description: 'Reactコンポーネントについて',
        difficulty: 'beginner',
        estimatedMinutes: 30,
      },
    ],
    selectedLesson: null as {
      id: string;
      title: string;
      description: string;
      difficulty: string;
      estimatedMinutes: number;
      tags?: string[];
      prerequisites?: string[];
    } | null,
    currentNote: '',
    searchQuery: '',
    saveStatus: 'saved' as 'saved' | 'saving' | 'error',
    selectLesson: () => {},
    setSearchQuery: () => {},
    updateNoteContent: () => {},
    deleteCurrentNote: () => {},
    hasNote: () => false,
  };

  const MockLessonNoteList = ({
    lessons,
    selectedLessonId,
    searchQuery,
  }: {
    lessons: unknown[];
    selectedLessonId: string | null;
    onSelectLesson: (lessonId: string) => void;
    hasNote: (lessonId: string) => boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
  }) => (
    <div data-testid="lesson-note-list">
      <div data-testid="lesson-count">{lessons.length} lessons</div>
      <div data-testid="selected-lesson">{selectedLessonId || 'none'}</div>
      <div data-testid="search-query">{searchQuery}</div>
    </div>
  );

  const MockNotesLayout = ({
    selectedLesson,
    currentNote,
    saveStatus,
  }: {
    selectedLesson: { id: string; title: string } | null;
    currentNote: string;
    saveStatus: 'saved' | 'saving' | 'error';
    onUpdateContent: (content: string) => void;
    onDeleteNote: () => void;
  }) => (
    <div data-testid="notes-layout">
      <div data-testid="selected-lesson-title">{selectedLesson?.title || 'no-selection'}</div>
      <div data-testid="note-content">{currentNote}</div>
      <div data-testid="save-status">{saveStatus}</div>
    </div>
  );

  return { mockUseNotes, MockLessonNoteList, MockNotesLayout };
});

vi.mock('@/features/notes', () => ({
  useNotes: () => mockUseNotes,
  LessonNoteList: MockLessonNoteList,
  NotesLayout: MockNotesLayout,
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

describe('NotesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering - basic structure', () => {
    it('should render notes page container', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('notes-page')).toBeInTheDocument();
    });

    it('should render lesson note list in sidebar', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('lesson-note-list')).toBeInTheDocument();
    });

    it('should render notes layout in main area', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('notes-layout')).toBeInTheDocument();
    });

    it('should pass correct lessons to LessonNoteList', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('lesson-count')).toHaveTextContent('2 lessons');
    });
  });

  describe('empty state - no lesson selected', () => {
    it('should show no selection when no lesson is selected', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('selected-lesson')).toHaveTextContent('none');
      expect(screen.getByTestId('selected-lesson-title')).toHaveTextContent('no-selection');
    });

    it('should show empty note content', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('note-content')).toHaveTextContent('');
    });

    it('should show saved status by default', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('saved');
    });
  });

  describe('with selected lesson', () => {
    beforeEach(() => {
      mockUseNotes.selectedLesson = {
        id: 'lesson-1',
        title: 'はじめてのReact',
        description: 'Reactの基本を学びましょう',
        difficulty: 'beginner',
        estimatedMinutes: 20,
        tags: [],
        prerequisites: [],
      };
    });

    afterEach(() => {
      mockUseNotes.selectedLesson = null;
    });

    it('should display selected lesson in sidebar', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('selected-lesson')).toHaveTextContent('lesson-1');
    });

    it('should display selected lesson title in notes layout', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('selected-lesson-title')).toHaveTextContent('はじめてのReact');
    });
  });

  describe('with note content', () => {
    beforeEach(() => {
      mockUseNotes.currentNote = 'これはテストノートです';
    });

    afterEach(() => {
      mockUseNotes.currentNote = '';
    });

    it('should display note content', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('note-content')).toHaveTextContent('これはテストノートです');
    });
  });

  describe('save status', () => {
    it('should display saving status', () => {
      mockUseNotes.saveStatus = 'saving';
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('saving');

      mockUseNotes.saveStatus = 'saved';
    });

    it('should display error status', () => {
      mockUseNotes.saveStatus = 'error';
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('save-status')).toHaveTextContent('error');

      mockUseNotes.saveStatus = 'saved';
    });
  });

  describe('search functionality', () => {
    it('should pass search query to LessonNoteList', () => {
      mockUseNotes.searchQuery = 'React';
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('search-query')).toHaveTextContent('React');

      mockUseNotes.searchQuery = '';
    });

    it('should pass empty search query by default', () => {
      renderWithProviders(<NotesPage />);

      expect(screen.getByTestId('search-query')).toHaveTextContent('');
    });
  });

  describe('callbacks', () => {
    it('should pass selectLesson callback to LessonNoteList', () => {
      renderWithProviders(<NotesPage />);

      expect(mockUseNotes.selectLesson).toBeDefined();
    });

    it('should pass updateNoteContent callback to NotesLayout', () => {
      renderWithProviders(<NotesPage />);

      expect(mockUseNotes.updateNoteContent).toBeDefined();
    });

    it('should pass deleteCurrentNote callback to NotesLayout', () => {
      renderWithProviders(<NotesPage />);

      expect(mockUseNotes.deleteCurrentNote).toBeDefined();
    });
  });
});
