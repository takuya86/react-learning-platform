import { useState, useEffect, useCallback } from 'react';
import type { SyncState, SyncContextState } from '../types';
import { initialSyncState, initialSyncContextState } from '../types';

export interface UseSyncStatusReturn {
  state: SyncContextState;
  setProgressSyncState: (state: SyncState) => void;
  setNotesSyncState: (state: SyncState) => void;
}

/**
 * Hook for managing overall sync status
 * Tracks online/offline state and sync states for progress and notes
 */
export function useSyncStatus(): UseSyncStatusReturn {
  const [state, setState] = useState<SyncContextState>(initialSyncContextState);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Set initial state
      setState((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
      }));

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const setProgressSyncState = useCallback((progressState: SyncState) => {
    setState((prev) => ({ ...prev, progress: progressState }));
  }, []);

  const setNotesSyncState = useCallback((notesState: SyncState) => {
    setState((prev) => ({ ...prev, notes: notesState }));
  }, []);

  return {
    state,
    setProgressSyncState,
    setNotesSyncState,
  };
}

/**
 * Calculate combined sync status from progress and notes states
 */
export function getCombinedSyncStatus(
  progressState: SyncState,
  notesState: SyncState,
  isOnline: boolean
): 'idle' | 'syncing' | 'error' | 'offline' {
  if (!isOnline) {
    return 'offline';
  }

  if (progressState.status === 'error' || notesState.status === 'error') {
    return 'error';
  }

  if (progressState.status === 'syncing' || notesState.status === 'syncing') {
    return 'syncing';
  }

  return 'idle';
}

/**
 * Get the most recent sync time from progress and notes
 */
export function getLastSyncedAt(progressState: SyncState, notesState: SyncState): string | null {
  if (!progressState.lastSyncedAt && !notesState.lastSyncedAt) {
    return null;
  }

  if (!progressState.lastSyncedAt) {
    return notesState.lastSyncedAt;
  }

  if (!notesState.lastSyncedAt) {
    return progressState.lastSyncedAt;
  }

  return new Date(progressState.lastSyncedAt) > new Date(notesState.lastSyncedAt)
    ? progressState.lastSyncedAt
    : notesState.lastSyncedAt;
}

/**
 * Format last synced time for display
 */
export function formatLastSyncedAt(lastSyncedAt: string | null): string {
  if (!lastSyncedAt) {
    return '未同期';
  }

  const date = new Date(lastSyncedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return 'たった今';
  }

  if (diffMin < 60) {
    return `${diffMin}分前`;
  }

  if (diffHour < 24) {
    return `${diffHour}時間前`;
  }

  return date.toLocaleDateString('ja-JP');
}

// Re-export initialSyncState for convenience
export { initialSyncState };
