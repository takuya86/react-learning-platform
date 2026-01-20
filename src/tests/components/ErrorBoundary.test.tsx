import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock logger to prevent actual logging during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
}

// Helper to suppress console.error in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});

describe('ErrorBoundary', () => {
  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should not display error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch and display error when child throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(
        screen.getByText('申し訳ございません。予期しないエラーが発生しました。')
      ).toBeInTheDocument();
    });

    it('should display error name and message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('should hide normal content when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Normal content')).not.toBeInTheDocument();
    });
  });

  describe('Error Details Display', () => {
    it('should display error details section', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('エラー詳細')).toBeInTheDocument();
    });

    it('should show stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('スタックトレース')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('スタックトレース')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Reset Functionality', () => {
    it('should display retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'リトライ' })).toBeInTheDocument();
    });

    it('should reset error state when retry button is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();

      // Fix the error condition and click retry button
      shouldThrow = false;
      const retryButton = screen.getByRole('button', { name: 'リトライ' });
      await user.click(retryButton);

      // After reset, the error UI should be gone
      expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should display home button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: 'ホームに戻る' })).toBeInTheDocument();
    });

    it('should display report issue link', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reportLink = screen.getByRole('link', { name: '問題を報告する' });
      expect(reportLink).toBeInTheDocument();
      expect(reportLink).toHaveAttribute('href');
      expect(reportLink.getAttribute('href')).toContain('github.com');
      expect(reportLink.getAttribute('href')).toContain('issues/new');
    });

    it('should include error message in report link', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reportLink = screen.getByRole('link', { name: '問題を報告する' });
      const href = reportLink.getAttribute('href') || '';

      expect(decodeURIComponent(href)).toContain('Test error message');
    });
  });

  describe('Custom Fallback', () => {
    it('should use custom fallback when provided', () => {
      const customFallback = (error: Error) => <div>Custom error: {error.message}</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument();
      expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
    });

    it('should pass reset function to custom fallback', () => {
      let resetFn: (() => void) | null = null;

      const customFallback = (_error: Error, _errorInfo: React.ErrorInfo, reset: () => void) => {
        resetFn = reset;
        return (
          <div>
            <p>Custom error</p>
            <button onClick={reset}>Custom Reset</button>
          </div>
        );
      };

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom Reset' })).toBeInTheDocument();

      // Verify reset function was passed
      expect(resetFn).toBeTruthy();
      expect(typeof resetFn).toBe('function');
    });
  });

  describe('Logger Integration', () => {
    it('should log error with logger when error is caught', async () => {
      const { logger } = await import('@/lib/logger');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(logger.error).toHaveBeenCalledWith(
        'React ErrorBoundary caught error',
        expect.objectContaining({
          category: 'general',
          context: expect.objectContaining({
            error: 'Test error message',
            name: 'Error',
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with no stack trace', () => {
      function ThrowErrorWithoutStack() {
        const error = new Error('Error without stack');
        error.stack = undefined;
        throw error;
      }

      render(
        <ErrorBoundary>
          <ThrowErrorWithoutStack />
        </ErrorBoundary>
      );

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText(/Error without stack/)).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });
});
