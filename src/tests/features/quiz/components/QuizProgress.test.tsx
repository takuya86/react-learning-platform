import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizProgress } from '@/features/quiz/components/QuizProgress';

describe('QuizProgress', () => {
  describe('Rendering', () => {
    it('should render progress information', () => {
      render(<QuizProgress current={0} total={10} skippedCount={0} answeredCount={0} />);
      expect(screen.getByText('問題 1 / 10')).toBeInTheDocument();
      expect(screen.getByText('回答済み: 0')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      const { container } = render(
        <QuizProgress current={5} total={10} skippedCount={0} answeredCount={5} />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Current Question Display', () => {
    it('should display first question correctly', () => {
      render(<QuizProgress current={0} total={5} skippedCount={0} answeredCount={0} />);
      expect(screen.getByText('問題 1 / 5')).toBeInTheDocument();
    });

    it('should display middle question correctly', () => {
      render(<QuizProgress current={2} total={5} skippedCount={0} answeredCount={2} />);
      expect(screen.getByText('問題 3 / 5')).toBeInTheDocument();
    });

    it('should display last question correctly', () => {
      render(<QuizProgress current={4} total={5} skippedCount={0} answeredCount={4} />);
      expect(screen.getByText('問題 5 / 5')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Calculation', () => {
    it('should show 10% progress for first question of 10', () => {
      const { container } = render(
        <QuizProgress current={0} total={10} skippedCount={0} answeredCount={0} />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toContain('10%');
    });

    it('should show 50% progress for middle question', () => {
      const { container } = render(
        <QuizProgress current={4} total={10} skippedCount={0} answeredCount={5} />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toContain('50%');
    });

    it('should show 100% progress for last question', () => {
      const { container } = render(
        <QuizProgress current={9} total={10} skippedCount={0} answeredCount={10} />
      );
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar?.getAttribute('style')).toContain('100%');
    });
  });

  describe('Stats Display', () => {
    it('should display answered count', () => {
      render(<QuizProgress current={3} total={10} skippedCount={0} answeredCount={4} />);
      expect(screen.getByText('回答済み: 4')).toBeInTheDocument();
    });

    it('should display skipped count when greater than zero', () => {
      render(<QuizProgress current={3} total={10} skippedCount={2} answeredCount={2} />);
      expect(screen.getByText('スキップ: 2')).toBeInTheDocument();
    });

    it('should not display skipped count when zero', () => {
      render(<QuizProgress current={3} total={10} skippedCount={0} answeredCount={4} />);
      expect(screen.queryByText(/スキップ:/)).not.toBeInTheDocument();
    });

    it('should display both answered and skipped counts', () => {
      render(<QuizProgress current={5} total={10} skippedCount={3} answeredCount={3} />);
      expect(screen.getByText('回答済み: 3')).toBeInTheDocument();
      expect(screen.getByText('スキップ: 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single question quiz', () => {
      render(<QuizProgress current={0} total={1} skippedCount={0} answeredCount={0} />);
      expect(screen.getByText('問題 1 / 1')).toBeInTheDocument();
    });

    it('should handle large question count', () => {
      render(<QuizProgress current={99} total={100} skippedCount={0} answeredCount={100} />);
      expect(screen.getByText('問題 100 / 100')).toBeInTheDocument();
    });

    it('should handle all questions skipped', () => {
      render(<QuizProgress current={9} total={10} skippedCount={10} answeredCount={0} />);
      expect(screen.getByText('回答済み: 0')).toBeInTheDocument();
      expect(screen.getByText('スキップ: 10')).toBeInTheDocument();
    });

    it('should handle mixed answered and skipped', () => {
      render(<QuizProgress current={7} total={10} skippedCount={5} answeredCount={3} />);
      expect(screen.getByText('回答済み: 3')).toBeInTheDocument();
      expect(screen.getByText('スキップ: 5')).toBeInTheDocument();
    });
  });
});
