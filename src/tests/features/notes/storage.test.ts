import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadNotesData,
  saveNotesData,
  clearNotesData,
  getNoteByLessonId,
  saveNote,
  deleteNote,
} from '@/features/notes/utils/storage';
import { NOTES_STORAGE_VERSION, type Note } from '@/domain/types';

describe('notes storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createNote = (lessonId: string, markdown: string = 'test note'): Note => ({
    lessonId,
    markdown,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  });

  describe('loadNotesData', () => {
    it('should return initial data when no data exists', () => {
      const data = loadNotesData();

      expect(data.version).toBe(NOTES_STORAGE_VERSION);
      expect(data.notesByLessonId).toEqual({});
    });

    it('should load saved data correctly', () => {
      const testData = {
        version: NOTES_STORAGE_VERSION,
        notesByLessonId: {
          'lesson-1': createNote('lesson-1'),
        },
      };
      localStorage.setItem('notes_data', JSON.stringify(testData));

      const data = loadNotesData();

      expect(data.version).toBe(NOTES_STORAGE_VERSION);
      expect(data.notesByLessonId['lesson-1']).toEqual(createNote('lesson-1'));
    });

    it('should handle corrupted JSON', () => {
      localStorage.setItem('notes_data', 'not valid json');

      const data = loadNotesData();

      expect(data.version).toBe(NOTES_STORAGE_VERSION);
      expect(data.notesByLessonId).toEqual({});
      expect(localStorage.getItem('notes_data')).toBeNull();
    });

    it('should handle missing version field', () => {
      const testData = {
        notesByLessonId: {
          'lesson-1': createNote('lesson-1'),
        },
      };
      localStorage.setItem('notes_data', JSON.stringify(testData));

      const data = loadNotesData();

      expect(data.version).toBe(NOTES_STORAGE_VERSION);
      expect(data.notesByLessonId['lesson-1']).toBeDefined();
    });

    it('should filter out invalid notes', () => {
      const testData = {
        version: NOTES_STORAGE_VERSION,
        notesByLessonId: {
          'lesson-1': createNote('lesson-1'),
          'lesson-2': { invalid: 'data' },
          'lesson-3': 'not an object',
          'lesson-4': null,
        },
      };
      localStorage.setItem('notes_data', JSON.stringify(testData));

      const data = loadNotesData();

      expect(Object.keys(data.notesByLessonId)).toHaveLength(1);
      expect(data.notesByLessonId['lesson-1']).toBeDefined();
    });

    it('should normalize note with missing optional fields', () => {
      const testData = {
        version: NOTES_STORAGE_VERSION,
        notesByLessonId: {
          'lesson-1': {
            markdown: 'test content',
          },
        },
      };
      localStorage.setItem('notes_data', JSON.stringify(testData));

      const data = loadNotesData();
      const note = data.notesByLessonId['lesson-1'];

      expect(note.lessonId).toBe('lesson-1');
      expect(note.markdown).toBe('test content');
      expect(note.createdAt).toBeDefined();
      expect(note.updatedAt).toBeDefined();
    });
  });

  describe('saveNotesData', () => {
    it('should save data to localStorage', () => {
      const testData = {
        version: NOTES_STORAGE_VERSION,
        notesByLessonId: {
          'lesson-1': createNote('lesson-1'),
        },
      };

      saveNotesData(testData);

      const stored = localStorage.getItem('notes_data');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(testData);
    });
  });

  describe('clearNotesData', () => {
    it('should remove all notes data from localStorage', () => {
      const testData = {
        version: NOTES_STORAGE_VERSION,
        notesByLessonId: {
          'lesson-1': createNote('lesson-1'),
        },
      };
      localStorage.setItem('notes_data', JSON.stringify(testData));

      clearNotesData();

      expect(localStorage.getItem('notes_data')).toBeNull();
    });
  });

  describe('getNoteByLessonId', () => {
    it('should return null when note does not exist', () => {
      const note = getNoteByLessonId('nonexistent');

      expect(note).toBeNull();
    });

    it('should return the note when it exists', () => {
      const testData = {
        version: NOTES_STORAGE_VERSION,
        notesByLessonId: {
          'lesson-1': createNote('lesson-1', 'my note'),
        },
      };
      localStorage.setItem('notes_data', JSON.stringify(testData));

      const note = getNoteByLessonId('lesson-1');

      expect(note).not.toBeNull();
      expect(note!.markdown).toBe('my note');
    });
  });

  describe('saveNote', () => {
    it('should save a new note', () => {
      const note = createNote('lesson-1', 'new note content');

      saveNote(note);

      const data = loadNotesData();
      expect(data.notesByLessonId['lesson-1']).toEqual(note);
    });

    it('should overwrite existing note', () => {
      const oldNote = createNote('lesson-1', 'old content');
      const newNote = createNote('lesson-1', 'new content');
      saveNote(oldNote);

      saveNote(newNote);

      const data = loadNotesData();
      expect(data.notesByLessonId['lesson-1'].markdown).toBe('new content');
    });

    it('should preserve other notes when saving', () => {
      const note1 = createNote('lesson-1', 'content 1');
      const note2 = createNote('lesson-2', 'content 2');
      saveNote(note1);

      saveNote(note2);

      const data = loadNotesData();
      expect(data.notesByLessonId['lesson-1']).toEqual(note1);
      expect(data.notesByLessonId['lesson-2']).toEqual(note2);
    });
  });

  describe('deleteNote', () => {
    it('should delete an existing note', () => {
      const note = createNote('lesson-1');
      saveNote(note);

      deleteNote('lesson-1');

      const data = loadNotesData();
      expect(data.notesByLessonId['lesson-1']).toBeUndefined();
    });

    it('should not throw when deleting nonexistent note', () => {
      expect(() => deleteNote('nonexistent')).not.toThrow();
    });

    it('should preserve other notes when deleting', () => {
      const note1 = createNote('lesson-1');
      const note2 = createNote('lesson-2');
      saveNote(note1);
      saveNote(note2);

      deleteNote('lesson-1');

      const data = loadNotesData();
      expect(data.notesByLessonId['lesson-1']).toBeUndefined();
      expect(data.notesByLessonId['lesson-2']).toEqual(note2);
    });
  });
});
