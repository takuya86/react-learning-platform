import { useCallback, useRef, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { isMockMode } from '@/lib/supabase';
import type { Progress } from '@/domain/types';
import type { SyncState } from '../types';
import { initialSyncState } from '../types';
import { fetchProgress, saveProgress } from '../services/progressService';
import { mergeProgress, hasProgressChanges } from '../services/mergeStrategy';
import { debounce, SYNC_DEBOUNCE_MS } from '../utils/debounce';

export interface UseProgressSyncReturn {
  syncState: SyncState;
  pullProgress: () => Promise<Progress | null>;
  pushProgress: (progress: Progress) => void;
  pushProgressImmediate: (progress: Progress) => Promise<void>;
  mergeWithRemote: (localProgress: Progress) => Promise<Progress>;
}

export function useProgressSync(
  onSyncStateChange?: (state: SyncState) => void
): UseProgressSyncReturn {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>(initialSyncState);
  const lastPushedRef = useRef<Progress | null>(null);

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

  // Pull progress from Supabase
  const pullProgress = useCallback(async (): Promise<Progress | null> => {
    if (isMockMode || !user) {
      return null;
    }

    updateSyncState({ status: 'syncing', error: null });

    const result = await fetchProgress(user.id);

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

  // Push progress to Supabase immediately
  const pushProgressImmediate = useCallback(
    async (progress: Progress): Promise<void> => {
      if (isMockMode || !user) {
        return;
      }

      // Skip if nothing changed since last push
      if (!hasProgressChanges(progress, lastPushedRef.current)) {
        return;
      }

      updateSyncState({ status: 'syncing', error: null });

      const result = await saveProgress(user.id, progress);

      // Update lastPushedRef regardless of success/error to prevent infinite retry loops
      // The same progress data won't be retried until it actually changes
      lastPushedRef.current = progress;

      if (result.error) {
        updateSyncState({ status: 'error', error: result.error });
        return;
      }
      updateSyncState({
        status: 'idle',
        lastSyncedAt: new Date().toISOString(),
        error: null,
      });
    },
    [user, updateSyncState]
  );

  // Debounced push
  const debouncedPushRef = useRef(
    debounce((progress: Progress, pushFn: (p: Progress) => Promise<void>) => {
      void pushFn(progress);
    }, SYNC_DEBOUNCE_MS)
  );

  // Push progress to Supabase (debounced)
  const pushProgress = useCallback(
    (progress: Progress): void => {
      if (isMockMode || !user) {
        return;
      }

      debouncedPushRef.current(progress, pushProgressImmediate);
    },
    [user, pushProgressImmediate]
  );

  // Merge local progress with remote
  const mergeWithRemote = useCallback(
    async (localProgress: Progress): Promise<Progress> => {
      const remoteProgress = await pullProgress();

      if (!remoteProgress) {
        return localProgress;
      }

      return mergeProgress(localProgress, remoteProgress);
    },
    [pullProgress]
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
    pullProgress,
    pushProgress,
    pushProgressImmediate,
    mergeWithRemote,
  };
}
