import { useCallback, useRef, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { isMockMode } from '@/lib/supabase';
import type { Note } from '@/domain/types';
import type { SyncState } from '../types';
import { initialSyncState } from '../types';
import { fetchAllNotes, saveNote, saveAllNotes } from '../services/notesService';
import { mergeNotes, hasNotesChanges } from '../services/mergeStrategy';
import { debounce, SYNC_DEBOUNCE_MS } from '../utils/debounce';

export interface UseNotesSyncReturn {
  syncState: SyncState;
  pullNotes: () => Promise<Record<string, Note> | null>;
  pushNote: (note: Note) => void;
  pushNoteImmediate: (note: Note) => Promise<void>;
  pushAllNotes: (notes: Record<string, Note>) => Promise<void>;
  mergeWithRemote: (localNotes: Record<string, Note>) => Promise<Record<string, Note>>;
}

export function useNotesSync(onSyncStateChange?: (state: SyncState) => void): UseNotesSyncReturn {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>(initialSyncState);
  const lastPushedRef = useRef<Record<string, Note> | null>(null);

  const updateSyncState = useCallback(
    (update: Partial<SyncState>) => {
      setSyncState((prev) => {
        const newState = { ...prev, ...update };
        onSyncStateChange?.(newState);
        return newState;
      });
    },
    [onSyncStateChange]
  );

  // Pull all notes from Supabase
  const pullNotes = useCallback(async (): Promise<Record<string, Note> | null> => {
    if (isMockMode || !user) {
      return null;
    }

    updateSyncState({ status: 'syncing', error: null });

    const result = await fetchAllNotes(user.id);

    if (result.error) {
      updateSyncState({ status: 'error', error: result.error });
      return null;
    }

    updateSyncState({
      status: 'idle',
      lastSyncedAt: new Date().toISOString(),
      error: null,
    });

    return result.data;
  }, [user, updateSyncState]);

  // Push a single note to Supabase immediately
  const pushNoteImmediate = useCallback(
    async (note: Note): Promise<void> => {
      if (isMockMode || !user) {
        return;
      }

      updateSyncState({ status: 'syncing', error: null });

      const result = await saveNote(user.id, note);

      if (result.error) {
        updateSyncState({ status: 'error', error: result.error });
        return;
      }

      // Update last pushed cache
      if (lastPushedRef.current) {
        lastPushedRef.current = {
          ...lastPushedRef.current,
          [note.lessonId]: note,
        };
      }

      updateSyncState({
        status: 'idle',
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    },
    [user, updateSyncState]
  );

  // Debounced push for single note
  const debouncedPushRef = useRef(
    debounce((note: Note, pushFn: (n: Note) => Promise<void>) => {
      void pushFn(note);
    }, SYNC_DEBOUNCE_MS)
  );

  // Push a single note to Supabase (debounced)
  const pushNote = useCallback(
    (note: Note): void => {
      if (isMockMode || !user) {
        return;
      }

      debouncedPushRef.current(note, pushNoteImmediate);
    },
    [user, pushNoteImmediate]
  );

  // Push all notes to Supabase (batch operation)
  const pushAllNotes = useCallback(
    async (notes: Record<string, Note>): Promise<void> => {
      if (isMockMode || !user) {
        return;
      }

      // Skip if nothing changed since last push
      if (!hasNotesChanges(notes, lastPushedRef.current)) {
        return;
      }

      updateSyncState({ status: 'syncing', error: null });

      const result = await saveAllNotes(user.id, notes);

      if (result.error) {
        updateSyncState({ status: 'error', error: result.error });
        return;
      }

      lastPushedRef.current = notes;
      updateSyncState({
        status: 'idle',
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    },
    [user, updateSyncState]
  );

  // Merge local notes with remote
  const mergeWithRemote = useCallback(
    async (localNotes: Record<string, Note>): Promise<Record<string, Note>> => {
      const remoteNotes = await pullNotes();

      if (!remoteNotes) {
        return localNotes;
      }

      return mergeNotes(localNotes, remoteNotes);
    },
    [pullNotes]
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    const debouncedPush = debouncedPushRef.current;
    return () => {
      debouncedPush.cancel();
    };
  }, []);

  return {
    syncState,
    pullNotes,
    pushNote,
    pushNoteImmediate,
    pushAllNotes,
    mergeWithRemote,
  };
}
