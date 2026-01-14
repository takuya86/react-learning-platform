import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useImprovementRoi } from '@/features/metrics';
import { setMockClosedIssues, resetMockIssueData } from '@/features/admin';

// Mock supabase client to use mock mode
vi.mock('@/lib/supabase/client', () => ({
  isMockMode: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({
        gte: () => ({
          lte: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

describe('useImprovementRoi', () => {
  beforeEach(() => {
    resetMockIssueData();
  });

  it('should return empty roiList when no closed issues exist', async () => {
    const { result } = renderHook(() => useImprovementRoi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.roiList).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should fetch and process closed issues', async () => {
    setMockClosedIssues([
      {
        number: 123,
        url: 'https://github.com/test/repo/issues/123',
        title: '[Lesson Improvement] Test Lesson (test-lesson) - LOW_ENGAGEMENT',
        labels: ['lesson-improvement', 'hint:LOW_ENGAGEMENT', 'lesson:test-lesson'],
      },
    ]);

    const { result } = renderHook(() => useImprovementRoi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.roiList).toHaveLength(1);
    expect(result.current.roiList[0].lessonSlug).toBe('test-lesson');
    expect(result.current.roiList[0].issueNumber).toBe(123);
    expect(result.current.error).toBe(null);
  });

  it('should handle multiple closed issues', async () => {
    setMockClosedIssues([
      {
        number: 123,
        url: 'https://github.com/test/repo/issues/123',
        title: '[Lesson Improvement] Test Lesson 1 (test-lesson-1) - LOW_ENGAGEMENT',
        labels: ['lesson-improvement', 'hint:LOW_ENGAGEMENT'],
      },
      {
        number: 456,
        url: 'https://github.com/test/repo/issues/456',
        title: '[Lesson Improvement] Test Lesson 2 (test-lesson-2) - CTA_MISSING',
        labels: ['lesson-improvement', 'hint:CTA_MISSING'],
      },
    ]);

    const { result } = renderHook(() => useImprovementRoi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.roiList).toHaveLength(2);
    expect(result.current.roiList[0].issueNumber).toBe(123);
    expect(result.current.roiList[1].issueNumber).toBe(456);
  });
});
