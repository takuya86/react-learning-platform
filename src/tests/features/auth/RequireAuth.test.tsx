import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import type { User, Session } from '@supabase/supabase-js';
import * as AuthContext from '@/features/auth/AuthContext';

// Mock the useAuth hook
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(AuthContext.useAuth);

function TestComponent() {
  return <div>Protected Content</div>;
}

function LoginPage() {
  return <div>Login Page</div>;
}

function renderWithRouter(initialPath: string = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <TestComponent />
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  it('should show loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should redirect to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as User,
      session: {} as Session,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
