import {
  type Note,
  type NotesStorageData,
  NOTES_STORAGE_VERSION,
  initialNotesData,
} from '@/domain/types';
import { logger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';

const STORAGE_KEY = STORAGE_KEYS.NOTES_DATA;

/**
 * Validate and normalize note data
 */
function parseNote(data: unknown, lessonId: string): Note | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const note = data as Record<string, unknown>;

  // Validate required fields
  if (typeof note.markdown !== 'string') {
    return null;
  }

  return {
    lessonId,
    markdown: note.markdown,
    createdAt: typeof note.createdAt === 'string' ? note.createdAt : new Date().toISOString(),
    updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : new Date().toISOString(),
  };
}

/**
 * Parse and validate storage data
 */
function parseStorageData(data: unknown): NotesStorageData {
  if (typeof data !== 'object' || data === null) {
    return initialNotesData;
  }

  const storageData = data as Record<string, unknown>;

  // Handle version migration if needed
  const version =
    typeof storageData.version === 'number' ? storageData.version : NOTES_STORAGE_VERSION;

  // Validate notesByLessonId
  const notesByLessonId: Record<string, Note> = {};

  if (typeof storageData.notesByLessonId === 'object' && storageData.notesByLessonId !== null) {
    const notesMap = storageData.notesByLessonId as Record<string, unknown>;

    for (const [lessonId, noteData] of Object.entries(notesMap)) {
      const note = parseNote(noteData, lessonId);
      if (note) {
        notesByLessonId[lessonId] = note;
      }
    }
  }

  return {
    version,
    notesByLessonId,
  };
}

/**
 * Load notes data from localStorage
 */
export function loadNotesData(): NotesStorageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialNotesData;
    }

    const parsed = JSON.parse(stored);
    return parseStorageData(parsed);
  } catch {
    // Corrupted data - clear and return initial
    localStorage.removeItem(STORAGE_KEY);
    return initialNotesData;
  }
}

/**
 * Save notes data to localStorage
 */
export function saveNotesData(data: NotesStorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Storage quota exceeded or other error
    logger.error('Failed to save notes data to localStorage', {
      category: 'storage',
      context: { error },
    });
  }
}

/**
 * Clear all notes data from localStorage
 */
export function clearNotesData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get a specific note by lesson ID
 */
export function getNoteByLessonId(lessonId: string): Note | null {
  const data = loadNotesData();
  return data.notesByLessonId[lessonId] ?? null;
}

/**
 * Save a note for a specific lesson
 */
export function saveNote(note: Note): void {
  const data = loadNotesData();
  data.notesByLessonId[note.lessonId] = note;
  saveNotesData(data);
}

/**
 * Delete a note for a specific lesson
 */
export function deleteNote(lessonId: string): void {
  const data = loadNotesData();
  delete data.notesByLessonId[lessonId];
  saveNotesData(data);
}
