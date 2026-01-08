import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ProgressProvider, useProgress } from '@/features/progress';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ProgressProvider>{children}</ProgressProvider>
);

describe('ProgressContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide initial progress state', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    expect(result.current.progress.lessons).toEqual({});
    expect(result.current.progress.completedQuizzes).toEqual([]);
    expect(result.current.progress.completedExercises).toEqual([]);
    expect(result.current.progress.streak).toBe(0);
  });

  it('should mark lesson as opened', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.markLessonOpened('lesson-1');
    });

    expect(result.current.isLessonOpened('lesson-1')).toBe(true);
    expect(result.current.isLessonCompleted('lesson-1')).toBe(false);
  });

  it('should complete lesson', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.completeLesson('lesson-1');
    });

    expect(result.current.isLessonCompleted('lesson-1')).toBe(true);
  });

  it('should complete quiz', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.completeQuiz('quiz-1');
    });

    expect(result.current.progress.completedQuizzes).toContain('quiz-1');
  });

  it('should complete exercise', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.completeExercise('exercise-1');
    });

    expect(result.current.progress.completedExercises).toContain('exercise-1');
  });

  it('should not duplicate completed items', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.completeQuiz('quiz-1');
    });

    act(() => {
      result.current.completeQuiz('quiz-1');
    });

    expect(result.current.progress.completedQuizzes.filter((id) => id === 'quiz-1')).toHaveLength(1);
  });

  it('should reset progress', async () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => {
      result.current.completeLesson('lesson-1');
    });

    await waitFor(() => {
      expect(result.current.isLessonCompleted('lesson-1')).toBe(true);
    });

    act(() => {
      result.current.resetProgress();
    });

    await waitFor(() => {
      expect(result.current.progress.lessons).toEqual({});
      expect(result.current.progress.completedQuizzes).toEqual([]);
    });
  });
});
