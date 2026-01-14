import { supabase, isMockMode } from '@/lib/supabase';
import type { Note } from '@/domain/types';
import type { UserNoteRow } from '../types';
import { mapRowToNote, mapNoteToRow } from '../types';

const TABLE_NAME = 'user_notes';

export interface NotesServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch all notes for a user from Supabase
 */
export async function fetchAllNotes(
  userId: string
): Promise<NotesServiceResult<Record<string, Note>>> {
  // In mock mode, return empty object (no remote data)
  if (isMockMode) {
    return { data: {}, error: null };
  }

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select('*').eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: {}, error: null };
    }

    const notesByLessonId: Record<string, Note> = {};
    for (const row of data as UserNoteRow[]) {
      notesByLessonId[row.lesson_id] = mapRowToNote(row);
    }

    return { data: notesByLessonId, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Fetch a single note by lesson ID
 */
export async function fetchNote(
  userId: string,
  lessonId: string
): Promise<NotesServiceResult<Note>> {
  // In mock mode, return null (no remote data)
  if (isMockMode) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return { data: mapRowToNote(data as UserNoteRow), error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Save (upsert) a single note to Supabase
 */
export async function saveNote(userId: string, note: Note): Promise<NotesServiceResult<Note>> {
  // In mock mode, return success without actually saving
  if (isMockMode) {
    return { data: note, error: null };
  }

  try {
    const rowData = mapNoteToRow(userId, note);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(rowData, { onConflict: 'user_id,lesson_id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapRowToNote(data as UserNoteRow), error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Save multiple notes at once (batch upsert)
 */
export async function saveAllNotes(
  userId: string,
  notes: Record<string, Note>
): Promise<NotesServiceResult<Record<string, Note>>> {
  // In mock mode, return success without actually saving
  if (isMockMode) {
    return { data: notes, error: null };
  }

  const noteArray = Object.values(notes);
  if (noteArray.length === 0) {
    return { data: {}, error: null };
  }

  try {
    const rowData = noteArray.map((note) => mapNoteToRow(userId, note));

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .upsert(rowData, { onConflict: 'user_id,lesson_id' })
      .select();

    if (error) {
      return { data: null, error: error.message };
    }

    const resultNotes: Record<string, Note> = {};
    for (const row of data as UserNoteRow[]) {
      resultNotes[row.lesson_id] = mapRowToNote(row);
    }

    return { data: resultNotes, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a single note from Supabase
 */
export async function deleteNote(
  userId: string,
  lessonId: string
): Promise<NotesServiceResult<void>> {
  // In mock mode, return success without actually deleting
  if (isMockMode) {
    return { data: undefined, error: null };
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', userId)
      .eq('lesson_id', lessonId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete all notes for a user from Supabase
 */
export async function deleteAllNotes(userId: string): Promise<NotesServiceResult<void>> {
  // In mock mode, return success without actually deleting
  if (isMockMode) {
    return { data: undefined, error: null };
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).delete().eq('user_id', userId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: undefined, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}
