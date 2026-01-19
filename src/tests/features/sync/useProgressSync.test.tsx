import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressSync } from '@/features/sync/hooks/useProgressSync';
import type { Progress } from '@/domain/types';
import * as progressService from '@/features/sync/services/progressService';
import * as mergeStrategy from '@/features/sync/services/mergeStrategy';

// Define mock user and getter before vi.mock (hoisting workaround)
const mockUser = vi.hoisted(() => ({
  value: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user' as const,
  } as { id: string; email: string; role: 'user' } | null,
}));

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {},
  isMockMode: false,
}));

vi.mock('@/features/sync/services/progressService');
vi.mock('@/features/sync/services/mergeStrategy');

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockUser.value,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('useProgressSync', () => {
  const baseProgress: Progress = {
    lessons: {},
    completedQuizzes: [],
    completedExercises: [],
    streak: 0,
    lastStudyDate: null,
    studyDates: [],
    quizAttempts: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user' as const,
    };
  });

  describe('initial state', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useProgressSync());

      expect(result.current.syncState.status).toBe('idle');
      expect(result.current.syncState.lastSyncedAt).toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should provide all sync functions', () => {
      const { result } = renderHook(() => useProgressSync());

      expect(typeof result.current.pullProgress).toBe('function');
      expect(typeof result.current.pushProgress).toBe('function');
      expect(typeof result.current.pushProgressImmediate).toBe('function');
      expect(typeof result.current.mergeWithRemote).toBe('function');
    });
  });

  describe('pullProgress', () => {
    it('should fetch progress successfully', async () => {
      const remoteProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: remoteProgress,
        error: null,
      });

      const { result } = renderHook(() => useProgressSync());

      let pulledProgress: Progress | null = null;

      await act(async () => {
        pulledProgress = await result.current.pullProgress();
      });

      expect(result.current.syncState.status).toBe('idle');
      expect(pulledProgress).toEqual(remoteProgress);
      expect(result.current.syncState.lastSyncedAt).not.toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should handle fetch error', async () => {
      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: null,
        error: 'Network error',
      });

      const { result } = renderHook(() => useProgressSync());

      let pulledProgress: Progress | null = null;

      await act(async () => {
        pulledProgress = await result.current.pullProgress();
      });

      expect(result.current.syncState.status).toBe('error');
      expect(pulledProgress).toBeNull();
      expect(result.current.syncState.error).toBe('Network error');
    });

    it('should return null when user is not authenticated', async () => {
      mockUser.value = null;
      const { result } = renderHook(() => useProgressSync());

      let pulledProgress: Progress | null = null;

      await act(async () => {
        pulledProgress = await result.current.pullProgress();
      });

      expect(pulledProgress).toBeNull();
      expect(progressService.fetchProgress).not.toHaveBeenCalled();
    });

    it('should set syncing status during fetch', async () => {
      let resolveFetch: (value: progressService.ProgressServiceResult<Progress>) => void;
      const fetchPromise = new Promise<progressService.ProgressServiceResult<Progress>>(
        (resolve) => {
          resolveFetch = resolve;
        }
      );

      vi.mocked(progressService.fetchProgress).mockReturnValue(fetchPromise);

      const { result } = renderHook(() => useProgressSync());

      // Start the pull without awaiting
      let pullPromise: Promise<Progress | null>;
      act(() => {
        pullPromise = result.current.pullProgress();
      });

      // Status should be syncing immediately
      expect(result.current.syncState.status).toBe('syncing');

      // Resolve the fetch
      await act(async () => {
        resolveFetch!({
          data: baseProgress,
          error: null,
        });
        await pullPromise;
      });

      expect(result.current.syncState.status).toBe('idle');
    });
  });

  describe('pushProgressImmediate', () => {
    it('should save progress successfully', async () => {
      const progressToSave: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: progressToSave,
        error: null,
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(true);

      const { result } = renderHook(() => useProgressSync());

      await act(async () => {
        await result.current.pushProgressImmediate(progressToSave);
      });

      expect(result.current.syncState.status).toBe('idle');
      expect(progressService.saveProgress).toHaveBeenCalledWith(mockUser.value!.id, progressToSave);
      expect(result.current.syncState.lastSyncedAt).not.toBeNull();
      expect(result.current.syncState.error).toBeNull();
    });

    it('should handle save error', async () => {
      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: null,
        error: 'Save failed',
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(true);

      const { result } = renderHook(() => useProgressSync());

      await act(async () => {
        await result.current.pushProgressImmediate(baseProgress);
      });

      expect(result.current.syncState.status).toBe('error');
      expect(result.current.syncState.error).toBe('Save failed');
    });

    it('should skip when user is not authenticated', async () => {
      mockUser.value = null;
      const { result } = renderHook(() => useProgressSync());

      await act(async () => {
        await result.current.pushProgressImmediate(baseProgress);
      });

      expect(progressService.saveProgress).not.toHaveBeenCalled();
    });

    it('should prevent infinite retry loop on identical progress', async () => {
      const progressToSave: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: null,
        error: 'Save failed',
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(false);

      const { result } = renderHook(() => useProgressSync());

      // First push - should save
      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValueOnce(true);
      await act(async () => {
        await result.current.pushProgressImmediate(progressToSave);
      });

      expect(progressService.saveProgress).toHaveBeenCalledTimes(1);

      // Second push with same data - should be skipped
      await act(async () => {
        await result.current.pushProgressImmediate(progressToSave);
      });

      expect(progressService.saveProgress).toHaveBeenCalledTimes(1);
    });
  });

  describe('pushProgress (debounced)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce multiple calls', async () => {
      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: baseProgress,
        error: null,
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(true);

      const { result } = renderHook(() => useProgressSync());

      // Call multiple times rapidly
      act(() => {
        result.current.pushProgress(baseProgress);
        result.current.pushProgress(baseProgress);
        result.current.pushProgress(baseProgress);
      });

      // Fast-forward to debounce time
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should only save once
      expect(progressService.saveProgress).toHaveBeenCalledTimes(1);
    });

    it('should skip when user is not authenticated', () => {
      mockUser.value = null;
      const { result } = renderHook(() => useProgressSync());

      act(() => {
        result.current.pushProgress(baseProgress);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(progressService.saveProgress).not.toHaveBeenCalled();
    });

    it('should cancel debounced call on unmount', async () => {
      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: baseProgress,
        error: null,
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(true);

      const { result, unmount } = renderHook(() => useProgressSync());

      act(() => {
        result.current.pushProgress(baseProgress);
      });

      // Unmount before debounce completes
      unmount();

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      // Should not save after unmount
      expect(progressService.saveProgress).not.toHaveBeenCalled();
    });
  });

  describe('mergeWithRemote', () => {
    it('should merge local progress with remote', async () => {
      const localProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      const remoteProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-2': { lessonId: 'lesson-2', openedAt: '2025-01-02T00:00:00Z' },
        },
      };

      const mergedProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
          'lesson-2': { lessonId: 'lesson-2', openedAt: '2025-01-02T00:00:00Z' },
        },
      };

      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: remoteProgress,
        error: null,
      });

      vi.mocked(mergeStrategy.mergeProgress).mockReturnValue(mergedProgress);

      const { result } = renderHook(() => useProgressSync());

      let merged: Progress | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote(localProgress);
      });

      expect(merged).toEqual(mergedProgress);
      expect(mergeStrategy.mergeProgress).toHaveBeenCalledWith(localProgress, remoteProgress);
    });

    it('should return local progress when remote is null', async () => {
      const localProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useProgressSync());

      let merged: Progress | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote(localProgress);
      });

      expect(merged).toEqual(localProgress);
      expect(mergeStrategy.mergeProgress).not.toHaveBeenCalled();
    });

    it('should return local progress when fetch fails', async () => {
      const localProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: null,
        error: 'Fetch failed',
      });

      const { result } = renderHook(() => useProgressSync());

      let merged: Progress | null = null;

      await act(async () => {
        merged = await result.current.mergeWithRemote(localProgress);
      });

      expect(merged).toEqual(localProgress);
    });
  });

  describe('onSyncStateChange callback', () => {
    it('should call callback when sync state changes', async () => {
      const onSyncStateChange = vi.fn();

      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: baseProgress,
        error: null,
      });

      const { result } = renderHook(() => useProgressSync(onSyncStateChange));

      await act(async () => {
        await result.current.pullProgress();
      });

      // Should be called at least twice: syncing -> idle
      expect(onSyncStateChange.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('boundary cases', () => {
    it('should handle empty progress', async () => {
      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: baseProgress,
        error: null,
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(true);

      const { result } = renderHook(() => useProgressSync());

      await act(async () => {
        await result.current.pushProgressImmediate(baseProgress);
      });

      expect(progressService.saveProgress).toHaveBeenCalledWith(mockUser.value!.id, baseProgress);
    });

    it('should handle concurrent pull and push operations', async () => {
      vi.mocked(progressService.fetchProgress).mockResolvedValue({
        data: baseProgress,
        error: null,
      });

      vi.mocked(progressService.saveProgress).mockResolvedValue({
        data: baseProgress,
        error: null,
      });

      vi.mocked(mergeStrategy.hasProgressChanges).mockReturnValue(true);

      const { result } = renderHook(() => useProgressSync());

      await act(async () => {
        await Promise.all([
          result.current.pullProgress(),
          result.current.pushProgressImmediate(baseProgress),
        ]);
      });

      expect(progressService.fetchProgress).toHaveBeenCalled();
      expect(progressService.saveProgress).toHaveBeenCalled();
    });
  });
});
