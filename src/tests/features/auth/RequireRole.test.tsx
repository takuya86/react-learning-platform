import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireRole } from '@/features/auth/RequireRole';
import type { User, Session } from '@supabase/supabase-js';
import * as AuthContext from '@/features/auth/AuthContext';

// Mock the useAuth hook
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(AuthContext.useAuth);

function TestComponent() {
  return <div>Admin Content</div>;
}

function LoginPage() {
  return <div>Login Page</div>;
}

function renderWithRouter(initialPath: string = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <TestComponent />
            </RequireRole>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireRole', () => {
  it('should show loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      role: 'user',
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
      role: 'user',
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should show 403 error when user is authenticated but not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' } as User,
      session: {} as Session,
      role: 'user',
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('403 - アクセス拒否')).toBeInTheDocument();
    expect(screen.getByText('このページにアクセスする権限がありません。')).toBeInTheDocument();
    expect(screen.getByText(/管理者権限が必要です/)).toBeInTheDocument();
  });

  it('should render children when user is authenticated as admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@example.com' } as User,
      session: {} as Session,
      role: 'admin',
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
