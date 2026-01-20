import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LessonCard } from '@/features/lessons/LessonCard';
import { ProgressProvider } from '@/features/progress';
import type { Lesson } from '@/domain/types';

// Mock component for testing
const MockComponent = () => <div>Mock Lesson Content</div>;

const createMockLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 'lesson-1',
  title: 'テストレッスン',
  description: 'これはテスト用のレッスンです',
  tags: ['react', 'testing'],
  difficulty: 'beginner',
  estimatedMinutes: 30,
  Component: MockComponent,
  ...overrides,
});

const renderWithProviders = (lesson: Lesson) => {
  return render(
    <BrowserRouter>
      <ProgressProvider>
        <LessonCard lesson={lesson} />
      </ProgressProvider>
    </BrowserRouter>
  );
};

describe('LessonCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render lesson title and description', () => {
      const lesson = createMockLesson();
      renderWithProviders(lesson);

      expect(screen.getByText('テストレッスン')).toBeInTheDocument();
      expect(screen.getByText('これはテスト用のレッスンです')).toBeInTheDocument();
    });

    it('should render all tags', () => {
      const lesson = createMockLesson({
        tags: ['react', 'hooks', 'testing'],
      });
      renderWithProviders(lesson);

      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('hooks')).toBeInTheDocument();
      expect(screen.getByText('testing')).toBeInTheDocument();
    });

    it('should render estimated time', () => {
      const lesson = createMockLesson({
        estimatedMinutes: 45,
      });
      renderWithProviders(lesson);

      expect(screen.getByText(/約 45 分/)).toBeInTheDocument();
    });

    it('should render lesson link', () => {
      const lesson = createMockLesson({ id: 'lesson-test' });
      renderWithProviders(lesson);

      const link = screen.getByTestId('lesson-card');
      expect(link).toHaveAttribute('href', '/lessons/lesson-test');
    });
  });

  describe('Difficulty Levels', () => {
    it('should display beginner difficulty badge', () => {
      const lesson = createMockLesson({ difficulty: 'beginner' });
      renderWithProviders(lesson);

      expect(screen.getByText('初級')).toBeInTheDocument();
    });

    it('should display intermediate difficulty badge', () => {
      const lesson = createMockLesson({ difficulty: 'intermediate' });
      renderWithProviders(lesson);

      expect(screen.getByText('中級')).toBeInTheDocument();
    });

    it('should display advanced difficulty badge', () => {
      const lesson = createMockLesson({ difficulty: 'advanced' });
      renderWithProviders(lesson);

      expect(screen.getByText('上級')).toBeInTheDocument();
    });
  });

  describe('Progress States', () => {
    it('should show "レッスンを始める" for new lesson', () => {
      const lesson = createMockLesson();
      renderWithProviders(lesson);

      expect(screen.getByText('レッスンを始める')).toBeInTheDocument();
    });

    it('should not show progress badges for new lesson', () => {
      const lesson = createMockLesson();
      renderWithProviders(lesson);

      expect(screen.queryByText('完了')).not.toBeInTheDocument();
      expect(screen.queryByText('学習中')).not.toBeInTheDocument();
    });

    it('should render difficulty badge for all lessons', () => {
      const lesson = createMockLesson({ difficulty: 'beginner' });
      renderWithProviders(lesson);

      expect(screen.getByText('初級')).toBeInTheDocument();
    });
  });

  describe('Link Behavior', () => {
    it('should link to correct lesson page', () => {
      const lesson = createMockLesson({ id: 'custom-lesson-id' });
      renderWithProviders(lesson);

      const link = screen.getByTestId('lesson-card');
      expect(link).toHaveAttribute('href', '/lessons/custom-lesson-id');
    });
  });

  describe('Edge Cases', () => {
    it('should render lesson with no tags', () => {
      const lesson = createMockLesson({ tags: [] });
      renderWithProviders(lesson);

      expect(screen.getByText('テストレッスン')).toBeInTheDocument();
    });

    it('should render lesson with single tag', () => {
      const lesson = createMockLesson({ tags: ['react'] });
      renderWithProviders(lesson);

      expect(screen.getByText('react')).toBeInTheDocument();
    });

    it('should render lesson with many tags', () => {
      const lesson = createMockLesson({
        tags: ['react', 'hooks', 'state', 'props', 'testing', 'typescript'],
      });
      renderWithProviders(lesson);

      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('hooks')).toBeInTheDocument();
      expect(screen.getByText('state')).toBeInTheDocument();
      expect(screen.getByText('props')).toBeInTheDocument();
      expect(screen.getByText('testing')).toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    it('should handle short estimated time', () => {
      const lesson = createMockLesson({ estimatedMinutes: 5 });
      renderWithProviders(lesson);

      expect(screen.getByText(/約 5 分/)).toBeInTheDocument();
    });

    it('should handle long estimated time', () => {
      const lesson = createMockLesson({ estimatedMinutes: 120 });
      renderWithProviders(lesson);

      expect(screen.getByText(/約 120 分/)).toBeInTheDocument();
    });

    it('should render with long title and description', () => {
      const lesson = createMockLesson({
        title: 'これは非常に長いタイトルのレッスンです。Reactの高度な概念を学びます。',
        description:
          'このレッスンでは、Reactの高度な概念について詳しく学びます。状態管理、パフォーマンス最適化、コードの再利用性など、実践的なトピックをカバーします。',
      });
      renderWithProviders(lesson);

      expect(
        screen.getByText('これは非常に長いタイトルのレッスンです。Reactの高度な概念を学びます。')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /このレッスンでは、Reactの高度な概念について詳しく学びます。状態管理、パフォーマンス最適化、コードの再利用性など、実践的なトピックをカバーします。/
        )
      ).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should memo component based on lesson id', () => {
      const lesson1 = createMockLesson({ id: 'lesson-1', title: 'First' });
      const { rerender } = renderWithProviders(lesson1);

      expect(screen.getByText('First')).toBeInTheDocument();

      // Same lesson id, different title shouldn't re-render
      const lesson2 = createMockLesson({ id: 'lesson-1', title: 'First Updated' });
      rerender(
        <BrowserRouter>
          <ProgressProvider>
            <LessonCard lesson={lesson2} />
          </ProgressProvider>
        </BrowserRouter>
      );

      // Due to memo, it should still show the old title
      expect(screen.getByText('First')).toBeInTheDocument();
    });
  });
});
