import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSyncStatus,
  getCombinedSyncStatus,
  getLastSyncedAt,
  formatLastSyncedAt,
} from '@/features/sync/hooks/useSyncStatus';
import type { SyncState } from '@/features/sync/types';
import { initialSyncState } from '@/features/sync/types';

describe('useSyncStatus', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default sync states', () => {
      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.state.progress).toEqual(initialSyncState);
      expect(result.current.state.notes).toEqual(initialSyncState);
      expect(result.current.state.isOnline).toBe(true);
    });

    it('should detect initial online status', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useSyncStatus());

      expect(result.current.state.isOnline).toBe(false);
    });
  });

  describe('setProgressSyncState', () => {
    it('should update progress sync state', () => {
      const { result } = renderHook(() => useSyncStatus());

      const newState: SyncState = {
        status: 'syncing',
        lastSyncedAt: '2025-01-01T00:00:00Z',
        error: null,
      };

      act(() => {
        result.current.setProgressSyncState(newState);
      });

      expect(result.current.state.progress).toEqual(newState);
      expect(result.current.state.notes).toEqual(initialSyncState);
    });

    it('should not affect notes sync state', () => {
      const { result } = renderHook(() => useSyncStatus());

      const notesState: SyncState = {
        status: 'error',
        lastSyncedAt: null,
        error: 'Notes error',
      };

      act(() => {
        result.current.setNotesSyncState(notesState);
      });

      const progressState: SyncState = {
        status: 'syncing',
        lastSyncedAt: '2025-01-01T00:00:00Z',
        error: null,
      };

      act(() => {
        result.current.setProgressSyncState(progressState);
      });

      expect(result.current.state.progress).toEqual(progressState);
      expect(result.current.state.notes).toEqual(notesState);
    });
  });

  describe('setNotesSyncState', () => {
    it('should update notes sync state', () => {
      const { result } = renderHook(() => useSyncStatus());

      const newState: SyncState = {
        status: 'error',
        lastSyncedAt: null,
        error: 'Sync failed',
      };

      act(() => {
        result.current.setNotesSyncState(newState);
      });

      expect(result.current.state.notes).toEqual(newState);
      expect(result.current.state.progress).toEqual(initialSyncState);
    });

    it('should not affect progress sync state', () => {
      const { result } = renderHook(() => useSyncStatus());

      const progressState: SyncState = {
        status: 'syncing',
        lastSyncedAt: '2025-01-01T00:00:00Z',
        error: null,
      };

      act(() => {
        result.current.setProgressSyncState(progressState);
      });

      const notesState: SyncState = {
        status: 'idle',
        lastSyncedAt: '2025-01-02T00:00:00Z',
        error: null,
      };

      act(() => {
        result.current.setNotesSyncState(notesState);
      });

      expect(result.current.state.progress).toEqual(progressState);
      expect(result.current.state.notes).toEqual(notesState);
    });
  });

  describe('online/offline detection', () => {
    it('should update to offline when online event fires', () => {
      const { result } = renderHook(() => useSyncStatus());

      // Initially online
      expect(result.current.state.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.state.isOnline).toBe(false);
    });

    it('should update to online when offline event fires', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() => useSyncStatus());

      // Initially offline
      expect(result.current.state.isOnline).toBe(false);

      // Simulate going online
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.state.isOnline).toBe(true);
    });

    it('should handle multiple online/offline transitions', () => {
      const { result } = renderHook(() => useSyncStatus());

      // Go offline
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.state.isOnline).toBe(false);

      // Go online
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.state.isOnline).toBe(true);

      // Go offline again
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.state.isOnline).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useSyncStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});

describe('getCombinedSyncStatus', () => {
  const idleState: SyncState = {
    status: 'idle',
    lastSyncedAt: '2025-01-01T00:00:00Z',
    error: null,
  };

  const syncingState: SyncState = {
    status: 'syncing',
    lastSyncedAt: null,
    error: null,
  };

  const errorState: SyncState = {
    status: 'error',
    lastSyncedAt: null,
    error: 'Sync failed',
  };

  describe('offline status', () => {
    it('should return offline when isOnline is false', () => {
      const status = getCombinedSyncStatus(idleState, idleState, false);
      expect(status).toBe('offline');
    });

    it('should return offline even when syncing', () => {
      const status = getCombinedSyncStatus(syncingState, idleState, false);
      expect(status).toBe('offline');
    });

    it('should return offline even when error', () => {
      const status = getCombinedSyncStatus(errorState, idleState, false);
      expect(status).toBe('offline');
    });
  });

  describe('error status', () => {
    it('should return error when progress has error', () => {
      const status = getCombinedSyncStatus(errorState, idleState, true);
      expect(status).toBe('error');
    });

    it('should return error when notes has error', () => {
      const status = getCombinedSyncStatus(idleState, errorState, true);
      expect(status).toBe('error');
    });

    it('should return error when both have error', () => {
      const status = getCombinedSyncStatus(errorState, errorState, true);
      expect(status).toBe('error');
    });
  });

  describe('syncing status', () => {
    it('should return syncing when progress is syncing', () => {
      const status = getCombinedSyncStatus(syncingState, idleState, true);
      expect(status).toBe('syncing');
    });

    it('should return syncing when notes is syncing', () => {
      const status = getCombinedSyncStatus(idleState, syncingState, true);
      expect(status).toBe('syncing');
    });

    it('should return syncing when both are syncing', () => {
      const status = getCombinedSyncStatus(syncingState, syncingState, true);
      expect(status).toBe('syncing');
    });
  });

  describe('idle status', () => {
    it('should return idle when both are idle', () => {
      const status = getCombinedSyncStatus(idleState, idleState, true);
      expect(status).toBe('idle');
    });
  });

  describe('priority order', () => {
    it('should prioritize offline over error', () => {
      const status = getCombinedSyncStatus(errorState, errorState, false);
      expect(status).toBe('offline');
    });

    it('should prioritize offline over syncing', () => {
      const status = getCombinedSyncStatus(syncingState, syncingState, false);
      expect(status).toBe('offline');
    });

    it('should prioritize error over syncing', () => {
      const status = getCombinedSyncStatus(errorState, syncingState, true);
      expect(status).toBe('error');
    });

    it('should prioritize syncing over idle', () => {
      const status = getCombinedSyncStatus(syncingState, idleState, true);
      expect(status).toBe('syncing');
    });
  });
});

describe('getLastSyncedAt', () => {
  const progressState: SyncState = {
    status: 'idle',
    lastSyncedAt: '2025-01-01T00:00:00Z',
    error: null,
  };

  const notesState: SyncState = {
    status: 'idle',
    lastSyncedAt: '2025-01-02T00:00:00Z',
    error: null,
  };

  it('should return null when both are null', () => {
    const result = getLastSyncedAt(
      { ...progressState, lastSyncedAt: null },
      { ...notesState, lastSyncedAt: null }
    );
    expect(result).toBeNull();
  });

  it('should return progress time when notes is null', () => {
    const result = getLastSyncedAt(progressState, { ...notesState, lastSyncedAt: null });
    expect(result).toBe('2025-01-01T00:00:00Z');
  });

  it('should return notes time when progress is null', () => {
    const result = getLastSyncedAt({ ...progressState, lastSyncedAt: null }, notesState);
    expect(result).toBe('2025-01-02T00:00:00Z');
  });

  it('should return more recent time when both have values', () => {
    const result = getLastSyncedAt(progressState, notesState);
    expect(result).toBe('2025-01-02T00:00:00Z');
  });

  it('should return progress time when it is more recent', () => {
    const recentProgressState: SyncState = {
      ...progressState,
      lastSyncedAt: '2025-01-03T00:00:00Z',
    };
    const result = getLastSyncedAt(recentProgressState, notesState);
    expect(result).toBe('2025-01-03T00:00:00Z');
  });

  it('should handle identical timestamps', () => {
    const sameTime = '2025-01-01T00:00:00Z';
    const result = getLastSyncedAt(
      { ...progressState, lastSyncedAt: sameTime },
      { ...notesState, lastSyncedAt: sameTime }
    );
    expect(result).toBe(sameTime);
  });
});

describe('formatLastSyncedAt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "未同期" when lastSyncedAt is null', () => {
    expect(formatLastSyncedAt(null)).toBe('未同期');
  });

  it('should return "たった今" for recent sync (< 60s)', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const lastSynced = new Date('2025-01-01T11:59:45Z').toISOString();
    expect(formatLastSyncedAt(lastSynced)).toBe('たった今');
  });

  it('should return minutes for sync within 1 hour', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const lastSynced = new Date('2025-01-01T11:45:00Z').toISOString();
    expect(formatLastSyncedAt(lastSynced)).toBe('15分前');
  });

  it('should return hours for sync within 24 hours', () => {
    const now = new Date('2025-01-01T12:00:00Z');
    vi.setSystemTime(now);

    const lastSynced = new Date('2025-01-01T10:00:00Z').toISOString();
    expect(formatLastSyncedAt(lastSynced)).toBe('2時間前');
  });

  it('should return date for sync over 24 hours ago', () => {
    const now = new Date('2025-01-03T12:00:00Z');
    vi.setSystemTime(now);

    const lastSynced = new Date('2025-01-01T12:00:00Z').toISOString();
    const result = formatLastSyncedAt(lastSynced);

    // Result should be a Japanese formatted date
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/1/);
  });

  describe('boundary cases', () => {
    it('should handle exactly 60 seconds', () => {
      const now = new Date('2025-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T11:59:00Z').toISOString();
      expect(formatLastSyncedAt(lastSynced)).toBe('1分前');
    });

    it('should handle exactly 60 minutes', () => {
      const now = new Date('2025-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T11:00:00Z').toISOString();
      expect(formatLastSyncedAt(lastSynced)).toBe('1時間前');
    });

    it('should handle exactly 24 hours', () => {
      const now = new Date('2025-01-02T12:00:00Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T12:00:00Z').toISOString();
      const result = formatLastSyncedAt(lastSynced);

      // Should return date format for 24+ hours
      expect(result).toMatch(/2025/);
    });

    it('should handle less than 1 second', () => {
      const now = new Date('2025-01-01T12:00:00.500Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T12:00:00.000Z').toISOString();
      expect(formatLastSyncedAt(lastSynced)).toBe('たった今');
    });

    it('should handle 59 seconds', () => {
      const now = new Date('2025-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T11:59:01Z').toISOString();
      expect(formatLastSyncedAt(lastSynced)).toBe('たった今');
    });

    it('should handle 59 minutes', () => {
      const now = new Date('2025-01-01T12:00:00Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T11:01:00Z').toISOString();
      expect(formatLastSyncedAt(lastSynced)).toBe('59分前');
    });

    it('should handle 23 hours', () => {
      const now = new Date('2025-01-02T11:00:00Z');
      vi.setSystemTime(now);

      const lastSynced = new Date('2025-01-01T12:00:00Z').toISOString();
      expect(formatLastSyncedAt(lastSynced)).toBe('23時間前');
    });
  });
});
