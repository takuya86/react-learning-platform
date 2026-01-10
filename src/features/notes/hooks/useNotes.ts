import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type Note } from '@/domain/types';
import { type Lesson } from '@/domain/types';
import { getAllLessons } from '@/lib/lessons';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotesStorage } from './useNotesStorage';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseNotesReturn {
  /** All lessons */
  allLessons: Lesson[];
  /** Filtered lessons based on search query */
  filteredLessons: Lesson[];
  /** Currently selected lesson */
  selectedLesson: Lesson | null;
  /** Currently editing note (or null if no lesson selected) */
  currentNote: Note | null;
  /** Search query for filtering lessons */
  searchQuery: string;
  /** Debounced search query (300ms) */
  debouncedSearchQuery: string;
  /** Current save status */
  saveStatus: SaveStatus;
  /** Select a lesson by ID */
  selectLesson: (lessonId: string) => void;
  /** Update search query */
  setSearchQuery: (query: string) => void;
  /** Update the current note's markdown content */
  updateNoteContent: (markdown: string) => void;
  /** Delete the current note */
  deleteCurrentNote: () => void;
  /** Check if a lesson has a note */
  hasNote: (lessonId: string) => boolean;
  /** Get all notes */
  getAllNotes: () => Record<string, Note>;
}

const AUTO_SAVE_DELAY = 500;
const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Main hook for managing notes feature
 * Handles lesson selection, filtering, and auto-save
 */
export function useNotes(): UseNotesReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    data: storageData,
    saveNote: storageSaveNote,
    deleteNote: storageDeleteNote,
  } = useNotesStorage();

  // Memoize lessons to avoid recreating the array on every render
  const lessons = useMemo(() => getAllLessons(), []);

  // Search query state with debounce
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_DELAY);

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Pending content for debounced auto-save
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const debouncedContent = useDebounce(pendingContent, AUTO_SAVE_DELAY);

  // Track if we need to save (content changed)
  const lastSavedContentRef = useRef<string | null>(null);

  // Selected lesson from URL params
  const selectedLessonId = searchParams.get('lessonId');
  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) ?? null,
    [selectedLessonId, lessons]
  );

  // Current note for selected lesson
  const currentNote = useMemo(() => {
    if (!selectedLessonId) return null;
    return storageData.notesByLessonId[selectedLessonId] ?? null;
  }, [selectedLessonId, storageData.notesByLessonId]);

  // Filter lessons by search query
  const filteredLessons = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return lessons;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return lessons.filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [debouncedSearchQuery, lessons]);

  // Select a lesson (updates URL)
  const selectLesson = useCallback(
    (lessonId: string) => {
      setSearchParams({ lessonId });
      // Reset pending content when switching lessons
      setPendingContent(null);
      lastSavedContentRef.current = null;
      setSaveStatus('idle');
    },
    [setSearchParams]
  );

  // Update note content (triggers debounced auto-save)
  const updateNoteContent = useCallback((markdown: string) => {
    setPendingContent(markdown);
    setSaveStatus('saving');
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (
      debouncedContent === null ||
      !selectedLessonId ||
      debouncedContent === lastSavedContentRef.current
    ) {
      return;
    }

    const now = new Date().toISOString();
    const existingNote = storageData.notesByLessonId[selectedLessonId];

    const note: Note = existingNote
      ? { ...existingNote, markdown: debouncedContent, updatedAt: now }
      : {
          lessonId: selectedLessonId,
          markdown: debouncedContent,
          createdAt: now,
          updatedAt: now,
        };

    try {
      storageSaveNote(note);
      lastSavedContentRef.current = debouncedContent;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [debouncedContent, selectedLessonId, storageData.notesByLessonId, storageSaveNote]);

  // Reset save status after showing "saved"
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Delete current note
  const deleteCurrentNote = useCallback(() => {
    if (selectedLessonId) {
      storageDeleteNote(selectedLessonId);
      setPendingContent(null);
      lastSavedContentRef.current = null;
      setSaveStatus('idle');
    }
  }, [selectedLessonId, storageDeleteNote]);

  // Check if a lesson has a note
  const hasNote = useCallback(
    (lessonId: string) => {
      const note = storageData.notesByLessonId[lessonId];
      return !!note && note.markdown.trim().length > 0;
    },
    [storageData.notesByLessonId]
  );

  // Get all notes
  const getAllNotes = useCallback(() => {
    return storageData.notesByLessonId;
  }, [storageData.notesByLessonId]);

  return {
    allLessons: lessons,
    filteredLessons,
    selectedLesson,
    currentNote,
    searchQuery,
    debouncedSearchQuery,
    saveStatus,
    selectLesson,
    setSearchQuery,
    updateNoteContent,
    deleteCurrentNote,
    hasNote,
    getAllNotes,
  };
}
