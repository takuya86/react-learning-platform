import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '@/features/auth';
import { isMockMode } from '@/lib/supabase';
import type { Progress, Note } from '@/domain/types';
import type { SyncContextState } from './types';
import { useProgressSync, type UseProgressSyncReturn } from './hooks/useProgressSync';
import { useNotesSync, type UseNotesSyncReturn } from './hooks/useNotesSync';
import {
  useSyncStatus,
  getCombinedSyncStatus,
  getLastSyncedAt,
  formatLastSyncedAt,
} from './hooks/useSyncStatus';

export interface SyncContextType {
  state: SyncContextState;
  combinedStatus: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncedAt: string | null;
  lastSyncedAtFormatted: string;
  progressSync: UseProgressSyncReturn;
  notesSync: UseNotesSyncReturn;
  syncOnLogin: (
    localProgress: Progress,
    localNotes: Record<string, Note>
  ) => Promise<{ progress: Progress; notes: Record<string, Note> }>;
}

const SyncContext = createContext<SyncContextType | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const { user } = useAuth();
  const { state, setProgressSyncState, setNotesSyncState } = useSyncStatus();
  const hasInitialSyncedRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  // Initialize sync hooks with state update callbacks
  const progressSync = useProgressSync(setProgressSyncState);
  const notesSync = useNotesSync(setNotesSyncState);

  // Calculate derived values
  const combinedStatus = getCombinedSyncStatus(state.progress, state.notes, state.isOnline);
  const lastSyncedAt = getLastSyncedAt(state.progress, state.notes);
  const lastSyncedAtFormatted = formatLastSyncedAt(lastSyncedAt);

  // Sync on login - merge local and remote data
  const syncOnLogin = async (
    localProgress: Progress,
    localNotes: Record<string, Note>
  ): Promise<{ progress: Progress; notes: Record<string, Note> }> => {
    if (isMockMode || !user) {
      return { progress: localProgress, notes: localNotes };
    }

    // Merge progress and notes with remote
    const [mergedProgress, mergedNotes] = await Promise.all([
      progressSync.mergeWithRemote(localProgress),
      notesSync.mergeWithRemote(localNotes),
    ]);

    // Push merged data back to server
    await Promise.all([
      progressSync.pushProgressImmediate(mergedProgress),
      notesSync.pushAllNotes(mergedNotes),
    ]);

    return { progress: mergedProgress, notes: mergedNotes };
  };

  // Reset sync state when user changes (login/logout)
  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (previousUserIdRef.current !== currentUserId) {
      // User changed - reset initial sync flag
      hasInitialSyncedRef.current = false;
      previousUserIdRef.current = currentUserId;

      // Reset sync states when logged out
      if (!currentUserId) {
        setProgressSyncState({ status: 'idle', lastSyncedAt: null, error: null });
        setNotesSyncState({ status: 'idle', lastSyncedAt: null, error: null });
      }
    }
  }, [user, setProgressSyncState, setNotesSyncState]);

  return (
    <SyncContext.Provider
      value={{
        state,
        combinedStatus,
        lastSyncedAt,
        lastSyncedAtFormatted,
        progressSync,
        notesSync,
        syncOnLogin,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

/**
 * Hook for accessing sync status only (lighter weight)
 */
export function useSyncState(): {
  state: SyncContextState;
  combinedStatus: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncedAtFormatted: string;
} {
  const { state, combinedStatus, lastSyncedAtFormatted } = useSync();
  return { state, combinedStatus, lastSyncedAtFormatted };
}
