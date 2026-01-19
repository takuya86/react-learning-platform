import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotesSync } from '@/features/sync/hooks/useNotesSync';
import type { Note } from '@/domain/types';
import * as notesService from '@/features/sync/services/notesService';
import * as mergeStrategy from '@/features/sync/services/mergeStrategy';

// Define mock user and getter before vi.mock (hoisting workaround)
const mockUser = vi.hoisted(() => ({
  value: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user' as const,
  } as { id: string; email: string; role: 'user' } | null,
}));

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {},
  isMockMode: false,
}));

vi.mock('@/features/sync/services/notesService');
vi.mock('@/features/sync/services/mergeStrategy');

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockUser.value,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const createNote = (lessonId: string, markdown: string, updatedAt: string): Note => ({
  lessonId,
  markdown,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt,
});

describe('useNotesSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user' as const,
    };
  });

  describe('initial state', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useNotesSync());

      expect(result.current.syncState.status).toBe('idle');
      expect(result.current.syncState.lastSyncedAt).toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should provide all sync functions', () => {
      const { result } = renderHook(() => useNotesSync());

      expect(typeof result.current.pullNotes).toBe('function');
      expect(typeof result.current.pushNote).toBe('function');
      expect(typeof result.current.pushNoteImmediate).toBe('function');
      expect(typeof result.current.pushAllNotes).toBe('function');
      expect(typeof result.current.mergeWithRemote).toBe('function');
    });
  });

  describe('pullNotes', () => {
    it('should fetch all notes successfully', async () => {
      const remoteNotes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'note 1', '2025-01-01T00:00:00Z'),
        'lesson-2': createNote('lesson-2', 'note 2', '2025-01-02T00:00:00Z'),
      };

      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: remoteNotes,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      let pulledNotes: Record<string, Note> | null = null;

      await act(async () => {
        pulledNotes = await result.current.pullNotes();
      });

      expect(result.current.syncState.status).toBe('idle');
      expect(pulledNotes).toEqual(remoteNotes);
      expect(result.current.syncState.lastSyncedAt).not.toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: null,
        error: 'Network error',
      });

      const { result } = renderHook(() => useNotesSync());

      let pulledNotes: Record<string, Note> | null = null;

      await act(async () => {
        pulledNotes = await result.current.pullNotes();
      });

      expect(result.current.syncState.status).toBe('error');
      expect(pulledNotes).toBeNull();
      expect(result.current.syncState.error).toBe('Network error');
    });

    it('should return null when user is not authenticated', async () => {
      mockUser.value = null;
      const { result } = renderHook(() => useNotesSync());

      let pulledNotes: Record<string, Note> | null = null;

      await act(async () => {
        pulledNotes = await result.current.pullNotes();
      });

      expect(pulledNotes).toBeNull();
      expect(notesService.fetchAllNotes).not.toHaveBeenCalled();
    });

    it('should set syncing status during fetch', async () => {
      let resolveFetch: (value: notesService.NotesServiceResult<Record<string, Note>>) => void;
      const fetchPromise = new Promise<notesService.NotesServiceResult<Record<string, Note>>>(
        (resolve) => {
          resolveFetch = resolve;
        }
      );

      vi.mocked(notesService.fetchAllNotes).mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useNotesSync());

      let pullPromise: Promise<Record<string, Note> | null>;

      act(() => {
        pullPromise = result.current.pullNotes();
      });

      // Status should be syncing immediately
      expect(result.current.syncState.status).toBe('syncing');

      // Resolve the fetch
      await act(async () => {
        resolveFetch!({
          data: {},
          error: null,
        });
        await pullPromise;
      });

      expect(result.current.syncState.status).toBe('idle');
    });
  });

  describe('pushNoteImmediate', () => {
    it('should save single note successfully', async () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushNoteImmediate(note);
      });

      expect(result.current.syncState.status).toBe('idle');
      expect(notesService.saveNote).toHaveBeenCalledWith(mockUser.value!.id, note);
      expect(result.current.syncState.lastSyncedAt).not.toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should handle save error', async () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: null,
        error: 'Save failed',
      });

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushNoteImmediate(note);
      });

      expect(result.current.syncState.status).toBe('error');
      expect(result.current.syncState.error).toBe('Save failed');
    });

    it('should skip when user is not authenticated', async () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');
      mockUser.value = null;
      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushNoteImmediate(note);
      });

      expect(notesService.saveNote).not.toHaveBeenCalled();
    });

    it('should update lastPushed cache after save', async () => {
      const note1 = createNote('lesson-1', 'note 1', '2025-01-01T00:00:00Z');
      const note2 = createNote('lesson-2', 'note 2', '2025-01-02T00:00:00Z');

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note1,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      // Save first note
      await act(async () => {
        await result.current.pushNoteImmediate(note1);
      });

      expect(notesService.saveNote).toHaveBeenCalledWith(mockUser.value!.id, note1);

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note2,
        error: null,
      });

      // Save second note
      await act(async () => {
        await result.current.pushNoteImmediate(note2);
      });

      expect(notesService.saveNote).toHaveBeenCalledWith(mockUser.value!.id, note2);
      expect(notesService.saveNote).toHaveBeenCalledTimes(2);
    });
  });

  describe('pushNote (debounced)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce multiple calls', async () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      // Call multiple times rapidly
      act(() => {
        result.current.pushNote(note);
        result.current.pushNote(note);
        result.current.pushNote(note);
      });

      // Fast-forward to debounce time
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should only save once
      expect(notesService.saveNote).toHaveBeenCalledTimes(1);
    });

    it('should skip when user is not authenticated', () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');
      mockUser.value = null;
      const { result } = renderHook(() => useNotesSync());

      act(() => {
        result.current.pushNote(note);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(notesService.saveNote).not.toHaveBeenCalled();
    });

    it('should cancel debounced call on unmount', async () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note,
        error: null,
      });

      const { result, unmount } = renderHook(() => useNotesSync());

      act(() => {
        result.current.pushNote(note);
      });

      // Unmount before debounce completes
      unmount();

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should not save after unmount
      expect(notesService.saveNote).not.toHaveBeenCalled();
    });
  });

  describe('pushAllNotes', () => {
    it('should save all notes successfully', async () => {
      const notes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'note 1', '2025-01-01T00:00:00Z'),
        'lesson-2': createNote('lesson-2', 'note 2', '2025-01-02T00:00:00Z'),
      };

      vi.mocked(notesService.saveAllNotes).mockResolvedValue({
        data: notes,
        error: null,
      });

      vi.mocked(mergeStrategy.hasNotesChanges).mockReturnValue(true);

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushAllNotes(notes);
      });

      expect(result.current.syncState.status).toBe('idle');
      expect(notesService.saveAllNotes).toHaveBeenCalledWith(mockUser.value!.id, notes);
      expect(result.current.syncState.lastSyncedAt).not.toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should handle save error', async () => {
      const notes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'note 1', '2025-01-01T00:00:00Z'),
      };

      vi.mocked(notesService.saveAllNotes).mockResolvedValue({
        data: null,
        error: 'Batch save failed',
      });

      vi.mocked(mergeStrategy.hasNotesChanges).mockReturnValue(true);

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushAllNotes(notes);
      });

      expect(result.current.syncState.status).toBe('error');
      expect(result.current.syncState.error).toBe('Batch save failed');
    });

    it('should skip when user is not authenticated', async () => {
      const notes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'note 1', '2025-01-01T00:00:00Z'),
      };

      mockUser.value = null;
      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushAllNotes(notes);
      });

      expect(notesService.saveAllNotes).not.toHaveBeenCalled();
    });

    it('should prevent infinite retry loop on identical notes', async () => {
      const notes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'note 1', '2025-01-01T00:00:00Z'),
      };

      vi.mocked(notesService.saveAllNotes).mockResolvedValue({
        data: null,
        error: 'Save failed',
      });

      vi.mocked(mergeStrategy.hasNotesChanges).mockReturnValue(false);

      const { result } = renderHook(() => useNotesSync());

      // First push - should be skipped (no changes)
      await act(async () => {
        await result.current.pushAllNotes(notes);
      });

      expect(notesService.saveAllNotes).not.toHaveBeenCalled();

      // Second push with changes - should save
      vi.mocked(mergeStrategy.hasNotesChanges).mockReturnValue(true);
      await act(async () => {
        await result.current.pushAllNotes(notes);
      });

      expect(notesService.saveAllNotes).toHaveBeenCalledTimes(1);
    });

    it('should handle empty notes object', async () => {
      vi.mocked(mergeStrategy.hasNotesChanges).mockReturnValue(true);
      vi.mocked(notesService.saveAllNotes).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushAllNotes({});
      });

      // Empty notes should still maintain idle status after successful save
      expect(result.current.syncState.status).toBe('idle');
    });
  });

  describe('mergeWithRemote', () => {
    it('should merge local notes with remote', async () => {
      const localNotes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'local note', '2025-01-01T00:00:00Z'),
      };

      const remoteNotes: Record<string, Note> = {
        'lesson-2': createNote('lesson-2', 'remote note', '2025-01-02T00:00:00Z'),
      };

      const mergedNotes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'local note', '2025-01-01T00:00:00Z'),
        'lesson-2': createNote('lesson-2', 'remote note', '2025-01-02T00:00:00Z'),
      };

      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: remoteNotes,
        error: null,
      });

      vi.mocked(mergeStrategy.mergeNotes).mockReturnValue(mergedNotes);

      const { result } = renderHook(() => useNotesSync());

      let merged: Record<string, Note> | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote(localNotes);
      });

      expect(merged).toEqual(mergedNotes);
      expect(mergeStrategy.mergeNotes).toHaveBeenCalledWith(localNotes, remoteNotes);
    });

    it('should return local notes when remote is null', async () => {
      const localNotes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'local note', '2025-01-01T00:00:00Z'),
      };

      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      let merged: Record<string, Note> | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote(localNotes);
      });

      expect(merged).toEqual(localNotes);
      expect(mergeStrategy.mergeNotes).not.toHaveBeenCalled();
    });

    it('should return local notes when fetch fails', async () => {
      const localNotes: Record<string, Note> = {
        'lesson-1': createNote('lesson-1', 'local note', '2025-01-01T00:00:00Z'),
      };

      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: null,
        error: 'Fetch failed',
      });

      const { result } = renderHook(() => useNotesSync());

      let merged: Record<string, Note> | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote(localNotes);
      });

      expect(merged).toEqual(localNotes);
    });

    it('should handle empty local and remote notes', async () => {
      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: {},
        error: null,
      });

      vi.mocked(mergeStrategy.mergeNotes).mockReturnValue({});

      const { result } = renderHook(() => useNotesSync());

      let merged: Record<string, Note> | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote({});
      });

      expect(merged).toEqual({});
    });
  });

  describe('onSyncStateChange callback', () => {
    it('should call callback when sync state changes', async () => {
      const onSyncStateChange = vi.fn();

      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHook(() => useNotesSync(onSyncStateChange));

      await act(async () => {
        await result.current.pullNotes();
      });

      // Should be called at least twice: syncing -> idle
      expect(onSyncStateChange.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('boundary cases', () => {
    it('should handle concurrent pull and push operations', async () => {
      const note = createNote('lesson-1', 'my note', '2025-01-01T00:00:00Z');

      vi.mocked(notesService.fetchAllNotes).mockResolvedValue({
        data: {},
        error: null,
      });

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await Promise.all([result.current.pullNotes(), result.current.pushNoteImmediate(note)]);
      });

      expect(notesService.fetchAllNotes).toHaveBeenCalled();
      expect(notesService.saveNote).toHaveBeenCalled();
    });

    it('should handle notes with special characters', async () => {
      const note = createNote(
        'lesson-1',
        '# Title with **bold** and `code`\n\n> Quote',
        '2025-01-01T00:00:00Z'
      );

      vi.mocked(notesService.saveNote).mockResolvedValue({
        data: note,
        error: null,
      });

      const { result } = renderHook(() => useNotesSync());

      await act(async () => {
        await result.current.pushNoteImmediate(note);
      });

      expect(notesService.saveNote).toHaveBeenCalledWith(mockUser.value!.id, note);
    });
  });
});
