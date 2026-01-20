import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizTimer } from '@/features/quiz/components/QuizTimer';
import { LOW_TIME_THRESHOLD_SEC, CRITICAL_TIME_THRESHOLD_SEC } from '@/features/quiz/constants';

describe('QuizTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render timer with formatted time', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={90} onTick={onTick} isRunning={false} />);
      expect(screen.getByText('1:30')).toBeInTheDocument();
    });

    it('should not render when timeRemainingSec is null', () => {
      const onTick = vi.fn();
      const { container } = render(
        <QuizTimer timeRemainingSec={null} onTick={onTick} isRunning={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render timer icon', () => {
      const onTick = vi.fn();
      const { container } = render(
        <QuizTimer timeRemainingSec={60} onTick={onTick} isRunning={false} />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('should format time with leading zero for seconds', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={65} onTick={onTick} isRunning={false} />);
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });

    it('should format time at zero', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={0} onTick={onTick} isRunning={false} />);
      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('should format time for minutes only', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={120} onTick={onTick} isRunning={false} />);
      expect(screen.getByText('2:00')).toBeInTheDocument();
    });

    it('should format time for seconds only', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={45} onTick={onTick} isRunning={false} />);
      expect(screen.getByText('0:45')).toBeInTheDocument();
    });
  });

  describe('Timer States', () => {
    it('should apply low time class when below threshold', () => {
      const onTick = vi.fn();
      const { container } = render(
        <QuizTimer timeRemainingSec={LOW_TIME_THRESHOLD_SEC} onTick={onTick} isRunning={false} />
      );
      const timer = container.firstChild as HTMLElement;
      expect(timer?.className).toMatch(/lowTime/);
    });

    it('should apply critical class when below critical threshold', () => {
      const onTick = vi.fn();
      const { container } = render(
        <QuizTimer
          timeRemainingSec={CRITICAL_TIME_THRESHOLD_SEC}
          onTick={onTick}
          isRunning={false}
        />
      );
      const timer = container.firstChild as HTMLElement;
      expect(timer?.className).toMatch(/critical/);
    });

    it('should not apply warning classes when time is normal', () => {
      const onTick = vi.fn();
      const { container } = render(
        <QuizTimer
          timeRemainingSec={LOW_TIME_THRESHOLD_SEC + 1}
          onTick={onTick}
          isRunning={false}
        />
      );
      const timer = container.firstChild as HTMLElement;
      expect(timer?.className).not.toMatch(/lowTime/);
      expect(timer?.className).not.toMatch(/critical/);
    });
  });

  describe('Timer Behavior', () => {
    it('should call onTick when timer is running', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={60} onTick={onTick} isRunning={true} />);

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(2);
    });

    it('should not call onTick when timer is not running', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={60} onTick={onTick} isRunning={false} />);

      vi.advanceTimersByTime(1000);
      expect(onTick).not.toHaveBeenCalled();
    });

    it('should not start timer when time is zero', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={0} onTick={onTick} isRunning={true} />);

      vi.advanceTimersByTime(1000);
      expect(onTick).not.toHaveBeenCalled();
    });

    it('should not start timer when timeRemainingSec is null', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={null} onTick={onTick} isRunning={true} />);

      vi.advanceTimersByTime(1000);
      expect(onTick).not.toHaveBeenCalled();
    });

    it('should stop timer when isRunning becomes false', () => {
      const onTick = vi.fn();
      const { rerender } = render(
        <QuizTimer timeRemainingSec={60} onTick={onTick} isRunning={true} />
      );

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(1);

      rerender(<QuizTimer timeRemainingSec={59} onTick={onTick} isRunning={false} />);

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should display negative time values as-is (no clamping)', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={-5} onTick={onTick} isRunning={false} />);
      // formatTime does not clamp negative values
      expect(screen.getByText('-1:-5')).toBeInTheDocument();
    });

    it('should handle large time values', () => {
      const onTick = vi.fn();
      render(<QuizTimer timeRemainingSec={3599} onTick={onTick} isRunning={false} />);
      expect(screen.getByText('59:59')).toBeInTheDocument();
    });
  });
});
