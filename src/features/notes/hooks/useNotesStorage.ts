import { useState, useCallback } from 'react';
import {
  type Note,
  type NotesStorageData,
  NOTES_STORAGE_VERSION,
} from '@/domain/types';
import {
  loadNotesData,
  saveNotesData,
  clearNotesData,
  getNoteByLessonId,
  saveNote as saveNoteToStorage,
  deleteNote as deleteNoteFromStorage,
} from '../utils/storage';

export interface UseNotesStorageReturn {
  /** All notes data */
  data: NotesStorageData;
  /** Load fresh data from localStorage */
  load: () => NotesStorageData;
  /** Save entire notes data */
  save: (data: NotesStorageData) => void;
  /** Clear all notes */
  clear: () => void;
  /** Get note by lesson ID */
  getNote: (lessonId: string) => Note | null;
  /** Save a single note */
  saveNote: (note: Note) => void;
  /** Delete a note by lesson ID */
  deleteNote: (lessonId: string) => void;
  /** Create a new empty note for a lesson */
  createNote: (lessonId: string) => Note;
}

/**
 * Hook for managing notes localStorage access
 * Provides load/save/clear operations and state synchronization
 */
export function useNotesStorage(): UseNotesStorageReturn {
  const [data, setData] = useState<NotesStorageData>(() => loadNotesData());

  const load = useCallback(() => {
    const loaded = loadNotesData();
    setData(loaded);
    return loaded;
  }, []);

  const save = useCallback((newData: NotesStorageData) => {
    saveNotesData(newData);
    setData(newData);
  }, []);

  const clear = useCallback(() => {
    clearNotesData();
    setData({ version: NOTES_STORAGE_VERSION, notesByLessonId: {} });
  }, []);

  const getNote = useCallback((lessonId: string) => {
    return getNoteByLessonId(lessonId);
  }, []);

  const saveNote = useCallback((note: Note) => {
    saveNoteToStorage(note);
    setData((prev) => ({
      ...prev,
      notesByLessonId: {
        ...prev.notesByLessonId,
        [note.lessonId]: note,
      },
    }));
  }, []);

  const deleteNote = useCallback((lessonId: string) => {
    deleteNoteFromStorage(lessonId);
    setData((prev) => {
      const { [lessonId]: _removed, ...rest } = prev.notesByLessonId;
      void _removed;
      return {
        ...prev,
        notesByLessonId: rest,
      };
    });
  }, []);

  const createNote = useCallback((lessonId: string): Note => {
    const now = new Date().toISOString();
    return {
      lessonId,
      markdown: '',
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  return {
    data,
    load,
    save,
    clear,
    getNote,
    saveNote,
    deleteNote,
    createNote,
  };
}
