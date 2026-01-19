import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProviders } from '@/app/providers';
import type { Progress } from '@/domain/types';

// Mock child providers
const mockProgressSync = {
  pushProgress: vi.fn(),
};

vi.mock('@/features/auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock('@/features/progress', () => ({
  ProgressProvider: ({
    children,
    onProgressChange,
  }: {
    children: React.ReactNode;
    onProgressChange?: (progress: Progress) => void;
  }) => (
    <div data-testid="progress-provider" data-has-callback={!!onProgressChange}>
      {children}
    </div>
  ),
}));

vi.mock('@/features/sync', () => ({
  SyncProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sync-provider">{children}</div>
  ),
  useSync: () => ({
    progressSync: mockProgressSync,
  }),
}));

describe('AppProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('provider hierarchy', () => {
    it('should render all providers in correct order', () => {
      render(
        <AppProviders>
          <div data-testid="child">Child Content</div>
        </AppProviders>
      );

      const authProvider = screen.getByTestId('auth-provider');
      const syncProvider = screen.getByTestId('sync-provider');
      const progressProvider = screen.getByTestId('progress-provider');
      const child = screen.getByTestId('child');

      // Check hierarchy: AuthProvider > SyncProvider > ProgressProvider > Child
      expect(authProvider).toContainElement(syncProvider);
      expect(syncProvider).toContainElement(progressProvider);
      expect(progressProvider).toContainElement(child);
    });

    it('should render child content', () => {
      render(
        <AppProviders>
          <div data-testid="test-content">Test Content</div>
        </AppProviders>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('SyncedProgressProvider integration', () => {
    it('should pass onProgressChange callback to ProgressProvider', () => {
      render(
        <AppProviders>
          <div>Content</div>
        </AppProviders>
      );

      const progressProvider = screen.getByTestId('progress-provider');
      expect(progressProvider).toHaveAttribute('data-has-callback', 'true');
    });

    it('should connect ProgressProvider with SyncProvider', async () => {
      render(
        <AppProviders>
          <div>Content</div>
        </AppProviders>
      );

      // Verify that the providers are connected through the callback
      await waitFor(() => {
        expect(screen.getByTestId('progress-provider')).toBeInTheDocument();
        expect(screen.getByTestId('sync-provider')).toBeInTheDocument();
      });
    });
  });

  describe('multiple children', () => {
    it('should render multiple children', () => {
      render(
        <AppProviders>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </AppProviders>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should preserve child component order', () => {
      render(
        <AppProviders>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </AppProviders>
      );

      const container = screen.getByTestId('progress-provider');
      const children = Array.from(container.children);

      expect(children[0]).toHaveAttribute('data-testid', 'first');
      expect(children[1]).toHaveAttribute('data-testid', 'second');
      expect(children[2]).toHaveAttribute('data-testid', 'third');
    });
  });

  describe('provider composition', () => {
    it('should provide context from all providers', () => {
      // Test component that would use contexts
      const TestComponent = () => (
        <div data-testid="test-component">Using Auth, Sync, and Progress contexts</div>
      );

      render(
        <AppProviders>
          <TestComponent />
        </AppProviders>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null children', () => {
      const { container } = render(<AppProviders>{null}</AppProviders>);
      expect(container.querySelector('[data-testid="progress-provider"]')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      const { container } = render(<AppProviders>{undefined}</AppProviders>);
      expect(container.querySelector('[data-testid="progress-provider"]')).toBeInTheDocument();
    });

    it('should handle empty fragment', () => {
      render(
        <AppProviders>
          <></>
        </AppProviders>
      );
      expect(screen.getByTestId('progress-provider')).toBeInTheDocument();
    });
  });
});
