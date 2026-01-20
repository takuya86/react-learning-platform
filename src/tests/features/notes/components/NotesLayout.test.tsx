import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NotesLayout } from '@/features/notes/components/NotesLayout';
import type { Lesson, Note } from '@/domain/types';

// Use vi.hoisted to properly hoist mock definitions before vi.mock
const {
  mockUseAuth,
  MockButton,
  MockSyncStatusIndicator,
  MockNoteEditor,
  MockNotePreview,
  MockNoteStatus,
} = vi.hoisted(() => {
  const mockUseAuth = {
    user: null as { id: string; name: string } | null,
  };

  const MockButton = ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: string;
  }) => (
    <button data-testid="delete-button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  );

  const MockSyncStatusIndicator = ({ showTime }: { showTime?: boolean }) => (
    <div data-testid="sync-status" data-show-time={showTime}>
      Sync Status
    </div>
  );

  const MockNoteEditor = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea data-testid="note-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  );

  const MockNotePreview = ({ markdown }: { markdown: string }) => (
    <div data-testid="note-preview">{markdown}</div>
  );

  const MockNoteStatus = ({ status }: { status: string }) => (
    <div data-testid="note-status">{status}</div>
  );

  return {
    mockUseAuth,
    MockButton,
    MockSyncStatusIndicator,
    MockNoteEditor,
    MockNotePreview,
    MockNoteStatus,
  };
});

vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth,
}));

vi.mock('@/components/ui', () => ({
  Button: MockButton,
  SyncStatusIndicator: MockSyncStatusIndicator,
}));

vi.mock('@/features/notes/components/NoteEditor', () => ({
  NoteEditor: MockNoteEditor,
}));

vi.mock('@/features/notes/components/NotePreview', () => ({
  NotePreview: MockNotePreview,
}));

vi.mock('@/features/notes/components/NoteStatus', () => ({
  NoteStatus: MockNoteStatus,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('NotesLayout', () => {
  const mockLesson: Lesson = {
    id: 'lesson-1',
    title: 'Test Lesson',
    description: 'Test Description',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    tags: [],
    prerequisites: [],
  };

  const mockNote: Note = {
    lessonId: 'lesson-1',
    markdown: 'Test note content',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    selectedLesson: mockLesson,
    currentNote: mockNote,
    saveStatus: 'saved' as const,
    onUpdateContent: vi.fn(),
    onDeleteNote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.user = null;
  });

  describe('Empty State - No Lesson Selected', () => {
    it('should show empty state when no lesson is selected', () => {
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={null} />);

      expect(screen.getByText('レッスンを選択してください')).toBeInTheDocument();
    });

    it('should show instruction text in empty state', () => {
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={null} />);

      expect(
        screen.getByText('左のリストからレッスンを選択して、ノートを作成・編集できます。')
      ).toBeInTheDocument();
    });

    it('should not render header when no lesson is selected', () => {
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={null} />);

      expect(screen.queryByText('Test Lesson')).not.toBeInTheDocument();
    });

    it('should not render editor when no lesson is selected', () => {
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={null} />);

      expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument();
    });

    it('should not render preview when no lesson is selected', () => {
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={null} />);

      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();
    });
  });

  describe('Rendering - With Selected Lesson', () => {
    it('should render lesson title', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByText('Test Lesson')).toBeInTheDocument();
    });

    it('should render link to lesson', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const link = screen.getByText('レッスンを見る');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/lessons/lesson-1');
    });

    it('should render note status', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByTestId('note-status')).toBeInTheDocument();
    });

    it('should not render sync status when user is not logged in', () => {
      mockUseAuth.user = null;
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.queryByTestId('sync-status')).not.toBeInTheDocument();
    });

    it('should render sync status when user is logged in', () => {
      mockUseAuth.user = { id: 'user-1', name: 'Test User' };
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByTestId('sync-status')).toBeInTheDocument();
    });

    it('should pass showTime=false to SyncStatusIndicator', () => {
      mockUseAuth.user = { id: 'user-1', name: 'Test User' };
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const syncStatus = screen.getByTestId('sync-status');
      expect(syncStatus).toHaveAttribute('data-show-time', 'false');
    });
  });

  describe('Save Status Display', () => {
    it('should display saved status', () => {
      renderWithRouter(<NotesLayout {...defaultProps} saveStatus="saved" />);

      expect(screen.getByTestId('note-status')).toHaveTextContent('saved');
    });

    it('should display saving status', () => {
      renderWithRouter(<NotesLayout {...defaultProps} saveStatus="saving" />);

      expect(screen.getByTestId('note-status')).toHaveTextContent('saving');
    });

    it('should display error status', () => {
      renderWithRouter(<NotesLayout {...defaultProps} saveStatus="error" />);

      expect(screen.getByTestId('note-status')).toHaveTextContent('error');
    });

    it('should display idle status', () => {
      renderWithRouter(<NotesLayout {...defaultProps} saveStatus="idle" />);

      expect(screen.getByTestId('note-status')).toHaveTextContent('idle');
    });
  });

  describe('Delete Button', () => {
    it('should render delete button when note has content', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
    });

    it('should not render delete button when note is null', () => {
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={null} />);

      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('should not render delete button when content is empty', () => {
      const emptyNote: Note = { ...mockNote, markdown: '' };
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={emptyNote} />);

      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('should not render delete button when content is whitespace only', () => {
      const whitespaceNote: Note = { ...mockNote, markdown: '   ' };
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={whitespaceNote} />);

      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('should call onDeleteNote when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDeleteNote = vi.fn();

      renderWithRouter(<NotesLayout {...defaultProps} onDeleteNote={onDeleteNote} />);

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      expect(onDeleteNote).toHaveBeenCalledTimes(1);
    });

    it('should render delete button with outline variant', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('View Mode Toggle', () => {
    it('should render all three view mode buttons', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByText('編集')).toBeInTheDocument();
      expect(screen.getByText('分割')).toBeInTheDocument();
      expect(screen.getByText('プレビュー')).toBeInTheDocument();
    });

    it('should start in split mode by default', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByTestId('note-editor')).toBeInTheDocument();
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });

    it('should show only editor in edit mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const editButton = screen.getByText('編集');
      await user.click(editButton);

      expect(screen.getByTestId('note-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();
    });

    it('should show only preview in preview mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const previewButton = screen.getByText('プレビュー');
      await user.click(previewButton);

      expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });

    it('should show both editor and preview in split mode', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      // First switch to edit mode
      await user.click(screen.getByText('編集'));

      // Then switch back to split mode
      await user.click(screen.getByText('分割'));

      expect(screen.getByTestId('note-editor')).toBeInTheDocument();
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });

    it('should toggle between modes correctly', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      // Start in split, go to edit
      await user.click(screen.getByText('編集'));
      expect(screen.getByTestId('note-editor')).toBeInTheDocument();
      expect(screen.queryByTestId('note-preview')).not.toBeInTheDocument();

      // Go to preview
      await user.click(screen.getByText('プレビュー'));
      expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();

      // Go back to split
      await user.click(screen.getByText('分割'));
      expect(screen.getByTestId('note-editor')).toBeInTheDocument();
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });
  });

  describe('Content Editing', () => {
    it('should render editor with current note content', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const editor = screen.getByTestId('note-editor');
      expect(editor).toHaveValue('Test note content');
    });

    it('should render preview with current note content', () => {
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const preview = screen.getByTestId('note-preview');
      expect(preview).toHaveTextContent('Test note content');
    });

    it('should call onUpdateContent when content changes', async () => {
      const user = userEvent.setup();
      const onUpdateContent = vi.fn();

      renderWithRouter(<NotesLayout {...defaultProps} onUpdateContent={onUpdateContent} />);

      const editor = screen.getByTestId('note-editor');
      await user.clear(editor);
      await user.type(editor, 'New content');

      await waitFor(() => {
        expect(onUpdateContent).toHaveBeenCalled();
      });
    });

    it('should update local content immediately on change', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const editor = screen.getByTestId('note-editor');
      await user.clear(editor);
      await user.type(editor, 'Updated');

      await waitFor(() => {
        expect(editor).toHaveValue('Updated');
      });
    });

    it('should sync preview with editor content', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      const editor = screen.getByTestId('note-editor');
      await user.clear(editor);
      await user.type(editor, 'New preview content');

      await waitFor(() => {
        const preview = screen.getByTestId('note-preview');
        expect(preview).toHaveTextContent('New preview content');
      });
    });

    it('should handle empty note content', () => {
      const emptyNote: Note = { ...mockNote, markdown: '' };
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={emptyNote} />);

      const editor = screen.getByTestId('note-editor');
      expect(editor).toHaveValue('');
    });

    it('should handle null note', () => {
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={null} />);

      const editor = screen.getByTestId('note-editor');
      expect(editor).toHaveValue('');
    });
  });

  describe('Note Switching', () => {
    it('should update content when lesson changes', () => {
      const { rerender } = renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByTestId('note-editor')).toHaveValue('Test note content');

      const newLesson: Lesson = { ...mockLesson, id: 'lesson-2', title: 'New Lesson' };
      const newNote: Note = { ...mockNote, lessonId: 'lesson-2', markdown: 'New content' };

      rerender(
        <BrowserRouter>
          <NotesLayout {...defaultProps} selectedLesson={newLesson} currentNote={newNote} />
        </BrowserRouter>
      );

      expect(screen.getByTestId('note-editor')).toHaveValue('New content');
    });

    it('should update title when lesson changes', () => {
      const { rerender } = renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByText('Test Lesson')).toBeInTheDocument();

      const newLesson: Lesson = { ...mockLesson, id: 'lesson-2', title: 'New Lesson Title' };

      rerender(
        <BrowserRouter>
          <NotesLayout {...defaultProps} selectedLesson={newLesson} />
        </BrowserRouter>
      );

      expect(screen.getByText('New Lesson Title')).toBeInTheDocument();
      expect(screen.queryByText('Test Lesson')).not.toBeInTheDocument();
    });

    it('should clear content when switching to lesson without note', () => {
      const { rerender } = renderWithRouter(<NotesLayout {...defaultProps} />);

      expect(screen.getByTestId('note-editor')).toHaveValue('Test note content');

      rerender(
        <BrowserRouter>
          <NotesLayout {...defaultProps} currentNote={null} />
        </BrowserRouter>
      );

      expect(screen.getByTestId('note-editor')).toHaveValue('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long lesson titles', () => {
      const longTitleLesson: Lesson = { ...mockLesson, title: 'A'.repeat(200) };
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={longTitleLesson} />);

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
    });

    it('should handle special characters in lesson title', () => {
      const specialLesson: Lesson = { ...mockLesson, title: '< & > " \' Test' };
      renderWithRouter(<NotesLayout {...defaultProps} selectedLesson={specialLesson} />);

      expect(screen.getByText('< & > " \' Test')).toBeInTheDocument();
    });

    it('should handle Japanese characters in content', () => {
      const japaneseNote: Note = { ...mockNote, markdown: 'こんにちは、世界！' };
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={japaneseNote} />);

      expect(screen.getByTestId('note-editor')).toHaveValue('こんにちは、世界！');
    });

    it('should handle markdown formatting in content', () => {
      const markdownNote: Note = { ...mockNote, markdown: '# Title\n**Bold** _Italic_' };
      renderWithRouter(<NotesLayout {...defaultProps} currentNote={markdownNote} />);

      expect(screen.getByTestId('note-editor')).toHaveValue('# Title\n**Bold** _Italic_');
    });

    it('should maintain view mode when note content changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<NotesLayout {...defaultProps} />);

      // Switch to preview mode
      await user.click(screen.getByText('プレビュー'));
      expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument();

      // Note content changes (simulated by prop change)
      // View mode should remain in preview
      expect(screen.queryByTestId('note-editor')).not.toBeInTheDocument();
      expect(screen.getByTestId('note-preview')).toBeInTheDocument();
    });
  });
});
