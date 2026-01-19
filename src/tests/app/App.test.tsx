import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/app/App';

// Mock AppProviders
vi.mock('@/app/providers', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-providers">{children}</div>
  ),
}));

// Mock RouterProvider from react-router-dom
vi.mock('react-router-dom', () => ({
  RouterProvider: ({ router }: { router: unknown }) => (
    <div data-testid="router-provider" data-router={JSON.stringify(router)}>
      Router
    </div>
  ),
}));

// Mock router
vi.mock('@/app/router', () => ({
  router: { routes: [] },
}));

describe('App', () => {
  it('should render AppProviders wrapper', () => {
    render(<App />);
    expect(screen.getByTestId('app-providers')).toBeInTheDocument();
  });

  it('should render RouterProvider inside AppProviders', () => {
    render(<App />);
    const providers = screen.getByTestId('app-providers');
    const router = screen.getByTestId('router-provider');
    expect(providers).toContainElement(router);
  });

  it('should pass router to RouterProvider', () => {
    render(<App />);
    const routerProvider = screen.getByTestId('router-provider');
    expect(routerProvider).toHaveAttribute('data-router');
  });
});
