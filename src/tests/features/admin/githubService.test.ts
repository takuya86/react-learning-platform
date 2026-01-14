import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerLessonWorkflow,
  checkExistingLessonPR,
} from '@/features/admin/services/githubService';

// Mock isMockMode
vi.mock('@/lib/supabase/client', () => ({
  isMockMode: true,
}));

describe('githubService', () => {
  describe('triggerLessonWorkflow', () => {
    it('should return success in mock mode', async () => {
      const result = await triggerLessonWorkflow(['lesson-1', 'lesson-2'], 3);

      expect(result.data).toEqual({ triggered: true });
      expect(result.error).toBeNull();
    });

    it('should accept empty slugs array', async () => {
      const result = await triggerLessonWorkflow([], 3);

      expect(result.data).toEqual({ triggered: true });
      expect(result.error).toBeNull();
    });
  });

  describe('checkExistingLessonPR', () => {
    it('should return no existing PR in mock mode', async () => {
      const result = await checkExistingLessonPR();

      expect(result.data).toEqual({ exists: false });
      expect(result.error).toBeNull();
    });
  });
});

describe('githubService - Real API Mode', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset mocks
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should return error when env vars are not set', async () => {
    // Re-import with isMockMode = false but no env vars
    vi.doMock('@/lib/supabase/client', () => ({
      isMockMode: false,
    }));

    const { triggerLessonWorkflow: trigger } =
      await import('@/features/admin/services/githubService');

    const result = await trigger(['lesson-1'], 3);

    expect(result.data).toBeNull();
    expect(result.error).toContain('GitHub API credentials not configured');
  });
});
