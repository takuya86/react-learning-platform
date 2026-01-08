import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useNotes } from '@/features/notes/hooks/useNotes';
import { saveNote, clearNotesData } from '@/features/notes/utils/storage';
import type { Note } from '@/domain/types';

const wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useNotes', () => {
  beforeEach(() => {
    // Clear localStorage completely between tests
    localStorage.clear();
    clearNotesData();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  const createNote = (lessonId: string, markdown: string = 'test note'): Note => ({
    lessonId,
    markdown,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  });

  describe('initial state', () => {
    it('should return all lessons', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.allLessons.length).toBeGreaterThan(0);
    });

    it('should have no selected lesson initially', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.selectedLesson).toBeNull();
      expect(result.current.currentNote).toBeNull();
    });

    it('should have empty search query', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.debouncedSearchQuery).toBe('');
    });

    it('should have idle save status', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.saveStatus).toBe('idle');
    });
  });

  describe('search filtering', () => {
    it('should filter lessons by title after debounce', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });
      const initialCount = result.current.allLessons.length;

      act(() => {
        result.current.setSearchQuery('useState');
      });

      // Before debounce, filtered list should still be all lessons
      expect(result.current.filteredLessons.length).toBe(initialCount);

      // After debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.filteredLessons.length).toBeLessThan(initialCount);
      expect(
        result.current.filteredLessons.every(
          (l) =>
            l.title.toLowerCase().includes('usestate') ||
            l.tags.some((t) => t.toLowerCase().includes('usestate'))
        )
      ).toBe(true);
    });

    it('should filter lessons by tags', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });

      act(() => {
        result.current.setSearchQuery('hooks');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(
        result.current.filteredLessons.every(
          (l) =>
            l.title.toLowerCase().includes('hooks') ||
            l.tags.some((t) => t.toLowerCase().includes('hooks'))
        )
      ).toBe(true);
    });

    it('should return all lessons when search is cleared', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });
      const initialCount = result.current.allLessons.length;

      // First set a search query
      act(() => {
        result.current.setSearchQuery('useState');
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Then clear it
      act(() => {
        result.current.setSearchQuery('');
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.filteredLessons.length).toBe(initialCount);
    });
  });

  describe('hasNote', () => {
    it('should return false when no note exists', () => {
      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.hasNote('react-basics')).toBe(false);
    });

    it('should return true when note exists with content', () => {
      saveNote(createNote('react-basics', 'some content'));

      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.hasNote('react-basics')).toBe(true);
    });

    it('should return false when note exists but is empty', () => {
      saveNote(createNote('react-basics', '   '));

      const { result } = renderHook(() => useNotes(), { wrapper });

      expect(result.current.hasNote('react-basics')).toBe(false);
    });
  });

  describe('getAllNotes', () => {
    it('should return saved notes', () => {
      // Save unique notes for this test
      const uniqueId1 = `getAllNotes-test-${Date.now()}-1`;
      const uniqueId2 = `getAllNotes-test-${Date.now()}-2`;

      saveNote(createNote(uniqueId1, 'note 1'));
      saveNote(createNote(uniqueId2, 'note 2'));

      const { result } = renderHook(() => useNotes(), { wrapper });
      const notes = result.current.getAllNotes();

      // Check that our specific notes exist
      expect(notes[uniqueId1]).toBeDefined();
      expect(notes[uniqueId1].markdown).toBe('note 1');
      expect(notes[uniqueId2]).toBeDefined();
      expect(notes[uniqueId2].markdown).toBe('note 2');
    });
  });

  describe('deleteCurrentNote', () => {
    it('should clear the note when called', () => {
      saveNote(createNote('react-basics', 'my note'));

      const { result } = renderHook(() => useNotes(), { wrapper });

      // Select the lesson first
      act(() => {
        result.current.selectLesson('react-basics');
      });

      act(() => {
        result.current.deleteCurrentNote();
      });

      expect(result.current.hasNote('react-basics')).toBe(false);
    });
  });
});
