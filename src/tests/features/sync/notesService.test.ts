import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchAllNotes,
  fetchNote,
  saveNote,
  saveAllNotes,
  deleteNote,
  deleteAllNotes,
} from '@/features/sync/services/notesService';
import type { Note } from '@/domain/types';
import * as supabaseModule from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  isMockMode: false,
}));

describe('notesService', () => {
  const mockUserId = 'user-123';
  const mockNote: Note = {
    lessonId: 'lesson-1',
    markdown: '# Test Note',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  const mockNoteRow = {
    id: 'note-id',
    user_id: mockUserId,
    lesson_id: 'lesson-1',
    markdown: '# Test Note',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockUpsert: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMaybeSingle = vi.fn();
    mockSingle = vi.fn();
    mockDelete = vi.fn();
    mockUpsert = vi.fn();
    mockEq = vi.fn();
    mockSelect = vi.fn();
    mockFrom = vi.fn();

    (supabaseModule.supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
  });

  describe('fetchAllNotes', () => {
    it('should fetch and map all notes for a user', async () => {
      const mockRows = [
        mockNoteRow,
        {
          id: 'note-2',
          user_id: mockUserId,
          lesson_id: 'lesson-2',
          markdown: '# Another Note',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
        },
      ];

      mockEq.mockResolvedValue({ data: mockRows, error: null });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchAllNotes(mockUserId);

      expect(mockFrom).toHaveBeenCalledWith('user_notes');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        'lesson-1': {
          lessonId: 'lesson-1',
          markdown: '# Test Note',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        'lesson-2': {
          lessonId: 'lesson-2',
          markdown: '# Another Note',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z',
        },
      });
    });

    it('should return empty object when no notes exist', async () => {
      mockEq.mockResolvedValue({ data: [], error: null });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchAllNotes(mockUserId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({});
    });

    it('should handle database error', async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchAllNotes(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });

    it('should handle exception', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await fetchAllNotes(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });
  });

  describe('fetchNote', () => {
    it('should fetch a single note by lesson ID', async () => {
      mockMaybeSingle.mockResolvedValue({ data: mockNoteRow, error: null });
      // Chain: .select().eq().eq().maybeSingle()
      // First eq returns object with eq, second eq returns object with maybeSingle
      const mockSecondEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockEq.mockReturnValue({ eq: mockSecondEq });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchNote(mockUserId, 'lesson-1');

      expect(mockFrom).toHaveBeenCalledWith('user_notes');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSecondEq).toHaveBeenCalledWith('lesson_id', 'lesson-1');
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockNote);
    });

    it('should return null when note does not exist', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      const mockSecondEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockEq.mockReturnValue({ eq: mockSecondEq });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchNote(mockUserId, 'lesson-1');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should handle database error', async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'Query failed' } });
      const mockSecondEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      mockEq.mockReturnValue({ eq: mockSecondEq });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fetchNote(mockUserId, 'lesson-1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Query failed');
    });
  });

  describe('saveNote', () => {
    it('should save and return a note', async () => {
      mockSingle.mockResolvedValue({ data: mockNoteRow, error: null });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveNote(mockUserId, mockNote);

      expect(mockFrom).toHaveBeenCalledWith('user_notes');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: mockUserId,
          lesson_id: 'lesson-1',
          markdown: '# Test Note',
          updated_at: '2024-01-02T00:00:00Z',
        },
        { onConflict: 'user_id,lesson_id' }
      );
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockNote);
    });

    it('should handle upsert error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Upsert failed' } });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveNote(mockUserId, mockNote);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Upsert failed');
    });

    it('should handle exception during save', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Connection timeout');
      });

      const result = await saveNote(mockUserId, mockNote);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Connection timeout');
    });
  });

  describe('saveAllNotes', () => {
    it('should save multiple notes at once', async () => {
      const notes = {
        'lesson-1': mockNote,
        'lesson-2': {
          lessonId: 'lesson-2',
          markdown: '# Note 2',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z',
        },
      };

      const mockRows = [
        mockNoteRow,
        {
          id: 'note-2',
          user_id: mockUserId,
          lesson_id: 'lesson-2',
          markdown: '# Note 2',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-04T00:00:00Z',
        },
      ];

      mockSelect.mockResolvedValue({ data: mockRows, error: null });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveAllNotes(mockUserId, notes);

      expect(mockUpsert).toHaveBeenCalledWith(
        [
          {
            user_id: mockUserId,
            lesson_id: 'lesson-1',
            markdown: '# Test Note',
            updated_at: '2024-01-02T00:00:00Z',
          },
          {
            user_id: mockUserId,
            lesson_id: 'lesson-2',
            markdown: '# Note 2',
            updated_at: '2024-01-04T00:00:00Z',
          },
        ],
        { onConflict: 'user_id,lesson_id' }
      );
      expect(result.error).toBeNull();
      expect(result.data).toEqual(notes);
    });

    it('should return empty object for empty notes', async () => {
      const result = await saveAllNotes(mockUserId, {});

      expect(result.error).toBeNull();
      expect(result.data).toEqual({});
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should handle batch upsert error', async () => {
      const notes = { 'lesson-1': mockNote };

      mockSelect.mockResolvedValue({ data: null, error: { message: 'Batch failed' } });
      mockUpsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await saveAllNotes(mockUserId, notes);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Batch failed');
    });
  });

  describe('deleteNote', () => {
    it('should delete a single note', async () => {
      // Chain: .delete().eq().eq()
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
      mockEq.mockReturnValue({ eq: mockSecondEq });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteNote(mockUserId, 'lesson-1');

      expect(mockFrom).toHaveBeenCalledWith('user_notes');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSecondEq).toHaveBeenCalledWith('lesson_id', 'lesson-1');
      expect(result.error).toBeNull();
    });

    it('should handle delete error', async () => {
      const mockSecondEq = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      mockEq.mockReturnValue({ eq: mockSecondEq });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteNote(mockUserId, 'lesson-1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Delete failed');
    });

    it('should handle exception during delete', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await deleteNote(mockUserId, 'lesson-1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('deleteAllNotes', () => {
    it('should delete all notes for a user', async () => {
      mockEq.mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteAllNotes(mockUserId);

      expect(mockFrom).toHaveBeenCalledWith('user_notes');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(result.error).toBeNull();
    });

    it('should handle delete error', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Bulk delete failed' } });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteAllNotes(mockUserId);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Bulk delete failed');
    });
  });

  describe('mock mode behavior', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should return empty data in mock mode for fetchAllNotes', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { fetchAllNotes: mockFetchAllNotes } =
        await import('@/features/sync/services/notesService');

      const result = await mockFetchAllNotes(mockUserId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual({});
    });

    it('should return null in mock mode for fetchNote', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { fetchNote: mockFetchNote } = await import('@/features/sync/services/notesService');

      const result = await mockFetchNote(mockUserId, 'lesson-1');

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it('should return success in mock mode for saveNote', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { saveNote: mockSaveNote } = await import('@/features/sync/services/notesService');

      const result = await mockSaveNote(mockUserId, mockNote);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockNote);
    });

    it('should return success in mock mode for deleteNote', async () => {
      vi.doMock('@/lib/supabase', () => ({
        supabase: { from: vi.fn() },
        isMockMode: true,
      }));

      const { deleteNote: mockDeleteNote } = await import('@/features/sync/services/notesService');

      const result = await mockDeleteNote(mockUserId, 'lesson-1');

      expect(result.error).toBeNull();
    });
  });
});
