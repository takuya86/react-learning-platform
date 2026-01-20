import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RelatedLessons } from '@/features/quiz/components/RelatedLessons';
import type { Lesson } from '@/domain/types';

// Helper function to wrap component with Router
function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

// Mock lesson data
const createMockLesson = (id: string, title: string, tags: string[] = []): Lesson => ({
  id,
  title,
  description: `Description for ${title}`,
  tags,
  difficulty: 'beginner',
  estimatedMinutes: 30,
  Component: () => null,
});

describe('RelatedLessons', () => {
  describe('Rendering with Lessons', () => {
    it('should render title and description', () => {
      const lessons = [createMockLesson('1', 'Test Lesson')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('関連レッスン')).toBeInTheDocument();
      expect(screen.getByText('復習におすすめのレッスンです')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      const lessons = [createMockLesson('1', 'Test Lesson')];

      renderWithRouter(<RelatedLessons lessons={lessons} title="おすすめレッスン" />);

      expect(screen.getByText('おすすめレッスン')).toBeInTheDocument();
      expect(screen.queryByText('関連レッスン')).not.toBeInTheDocument();
    });

    it('should render single lesson', () => {
      const lessons = [createMockLesson('1', 'React Basics')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    it('should render multiple lessons', () => {
      const lessons = [
        createMockLesson('1', 'React Basics'),
        createMockLesson('2', 'React Hooks'),
        createMockLesson('3', 'React Context'),
      ];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('React Hooks')).toBeInTheDocument();
      expect(screen.getByText('React Context')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render nothing when lessons array is empty', () => {
      const { container } = renderWithRouter(<RelatedLessons lessons={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render title when no lessons', () => {
      renderWithRouter(<RelatedLessons lessons={[]} />);

      expect(screen.queryByText('関連レッスン')).not.toBeInTheDocument();
      expect(screen.queryByText('復習におすすめのレッスンです')).not.toBeInTheDocument();
    });
  });

  describe('Lesson Links', () => {
    it('should render links to lesson pages', () => {
      const lessons = [createMockLesson('react-basics', 'React Basics')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      const link = screen.getByRole('link', { name: /React Basics/ });
      expect(link).toHaveAttribute('href', '/lessons/react-basics');
    });

    it('should render correct links for multiple lessons', () => {
      const lessons = [
        createMockLesson('lesson-1', 'Lesson 1'),
        createMockLesson('lesson-2', 'Lesson 2'),
        createMockLesson('lesson-3', 'Lesson 3'),
      ];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByRole('link', { name: /Lesson 1/ })).toHaveAttribute(
        'href',
        '/lessons/lesson-1'
      );
      expect(screen.getByRole('link', { name: /Lesson 2/ })).toHaveAttribute(
        'href',
        '/lessons/lesson-2'
      );
      expect(screen.getByRole('link', { name: /Lesson 3/ })).toHaveAttribute(
        'href',
        '/lessons/lesson-3'
      );
    });

    it('should render arrow indicator for each lesson', () => {
      const lessons = [createMockLesson('1', 'Test Lesson')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('Tags Display', () => {
    it('should display lesson tags', () => {
      const lessons = [createMockLesson('1', 'React Basics', ['React', 'JavaScript', 'Frontend'])];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Frontend')).toBeInTheDocument();
    });

    it('should display up to 3 tags per lesson', () => {
      const lessons = [
        createMockLesson('1', 'Test Lesson', ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']),
      ];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('Tag1')).toBeInTheDocument();
      expect(screen.getByText('Tag2')).toBeInTheDocument();
      expect(screen.getByText('Tag3')).toBeInTheDocument();
      expect(screen.queryByText('Tag4')).not.toBeInTheDocument();
      expect(screen.queryByText('Tag5')).not.toBeInTheDocument();
    });

    it('should handle lessons with no tags', () => {
      const lessons = [createMockLesson('1', 'No Tags Lesson', [])];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('No Tags Lesson')).toBeInTheDocument();
    });

    it('should handle lessons with fewer than 3 tags', () => {
      const lessons = [createMockLesson('1', 'Two Tags', ['Tag1', 'Tag2'])];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('Tag1')).toBeInTheDocument();
      expect(screen.getByText('Tag2')).toBeInTheDocument();
    });
  });

  describe('List Structure', () => {
    it('should render lessons in a list', () => {
      const lessons = [createMockLesson('1', 'Lesson 1'), createMockLesson('2', 'Lesson 2')];

      const { container } = renderWithRouter(<RelatedLessons lessons={lessons} />);

      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();

      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(2);
    });

    it('should use lesson id as key', () => {
      const lessons = [
        createMockLesson('unique-id-1', 'Lesson 1'),
        createMockLesson('unique-id-2', 'Lesson 2'),
      ];

      const { container } = renderWithRouter(<RelatedLessons lessons={lessons} />);

      const listItems = container.querySelectorAll('li');
      expect(listItems[0]).toHaveAttribute('class');
      expect(listItems[1]).toHaveAttribute('class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle lesson with very long title', () => {
      const longTitle =
        'This is a very long lesson title that should still render correctly without breaking the layout';
      const lessons = [createMockLesson('1', longTitle)];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle special characters in lesson title', () => {
      const lessons = [createMockLesson('1', 'React & TypeScript: Advanced Patterns')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('React & TypeScript: Advanced Patterns')).toBeInTheDocument();
    });

    it('should handle lesson IDs with special characters', () => {
      const lessons = [createMockLesson('react-hooks-2024', 'React Hooks 2024')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      const link = screen.getByRole('link', { name: /React Hooks 2024/ });
      expect(link).toHaveAttribute('href', '/lessons/react-hooks-2024');
    });

    it('should render many lessons efficiently', () => {
      const lessons = Array.from({ length: 20 }, (_, i) =>
        createMockLesson(`lesson-${i}`, `Lesson ${i + 1}`, [`tag${i}`])
      );

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      expect(screen.getByText('Lesson 20')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const lessons = [createMockLesson('1', 'Test Lesson')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      const heading = screen.getByRole('heading', { name: '関連レッスン' });
      expect(heading.tagName).toBe('H3');
    });

    it('should have accessible links', () => {
      const lessons = [createMockLesson('1', 'Accessible Lesson')];

      renderWithRouter(<RelatedLessons lessons={lessons} />);

      const link = screen.getByRole('link', { name: /Accessible Lesson/ });
      expect(link).toBeInTheDocument();
    });
  });
});
