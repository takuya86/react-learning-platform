import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGitHubWorkflow } from '@/features/admin/hooks/useGitHubWorkflow';

// Mock the service
vi.mock('@/features/admin/services/githubService', () => ({
  triggerLessonWorkflow: vi.fn(),
  checkExistingLessonPR: vi.fn(),
}));

import {
  triggerLessonWorkflow,
  checkExistingLessonPR,
} from '@/features/admin/services/githubService';

const mockTrigger = vi.mocked(triggerLessonWorkflow);
const mockCheckPR = vi.mocked(checkExistingLessonPR);

describe('useGitHubWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrigger.mockResolvedValue({ data: { triggered: true }, error: null });
    mockCheckPR.mockResolvedValue({ data: { exists: false }, error: null });
  });

  describe('trigger', () => {
    it('should trigger workflow successfully', async () => {
      const { result } = renderHook(() => useGitHubWorkflow());

      expect(result.current.isTriggering).toBe(false);
      expect(result.current.success).toBe(false);

      let success: boolean;
      await act(async () => {
        success = await result.current.trigger(['lesson-1'], 3);
      });

      expect(success!).toBe(true);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockTrigger).toHaveBeenCalledWith(['lesson-1'], 3);
    });

    it('should handle trigger error', async () => {
      mockTrigger.mockResolvedValue({
        data: null,
        error: 'Failed to trigger workflow',
      });

      const { result } = renderHook(() => useGitHubWorkflow());

      let success: boolean;
      await act(async () => {
        success = await result.current.trigger(['lesson-1'], 3);
      });

      expect(success!).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe('Failed to trigger workflow');
    });

    it('should set isTriggering during request', async () => {
      type ResolveType = { data: { triggered: boolean } | null; error: string | null };
      let resolveFn: (value: ResolveType) => void;
      mockTrigger.mockImplementation(
        () =>
          new Promise<ResolveType>((resolve) => {
            resolveFn = resolve;
          })
      );

      const { result } = renderHook(() => useGitHubWorkflow());

      act(() => {
        result.current.trigger(['lesson-1'], 3);
      });

      expect(result.current.isTriggering).toBe(true);

      await act(async () => {
        resolveFn({ data: { triggered: true }, error: null });
      });

      expect(result.current.isTriggering).toBe(false);
    });
  });

  describe('checkExistingPR', () => {
    it('should check for existing PR', async () => {
      mockCheckPR.mockResolvedValue({
        data: { exists: true, url: 'https://github.com/pr/1', number: 1, title: 'Test PR' },
        error: null,
      });

      const { result } = renderHook(() => useGitHubWorkflow());

      await act(async () => {
        await result.current.checkExistingPR();
      });

      expect(result.current.existingPR).toEqual({
        exists: true,
        url: 'https://github.com/pr/1',
        number: 1,
        title: 'Test PR',
      });
    });

    it('should handle no existing PR', async () => {
      const { result } = renderHook(() => useGitHubWorkflow());

      await act(async () => {
        await result.current.checkExistingPR();
      });

      expect(result.current.existingPR).toEqual({ exists: false });
    });

    it('should handle check error', async () => {
      mockCheckPR.mockResolvedValue({
        data: null,
        error: 'Failed to check PRs',
      });

      const { result } = renderHook(() => useGitHubWorkflow());

      await act(async () => {
        await result.current.checkExistingPR();
      });

      expect(result.current.error).toBe('Failed to check PRs');
      expect(result.current.existingPR).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', async () => {
      mockTrigger.mockResolvedValue({
        data: null,
        error: 'Some error',
      });

      const { result } = renderHook(() => useGitHubWorkflow());

      await act(async () => {
        await result.current.trigger(['lesson-1'], 3);
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('clearSuccess', () => {
    it('should clear success', async () => {
      const { result } = renderHook(() => useGitHubWorkflow());

      await act(async () => {
        await result.current.trigger(['lesson-1'], 3);
      });

      expect(result.current.success).toBe(true);

      act(() => {
        result.current.clearSuccess();
      });

      expect(result.current.success).toBe(false);
    });
  });
});
