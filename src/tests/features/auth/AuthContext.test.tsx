import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import * as supabaseModule from '@/lib/supabase';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
  isMockMode: false,
}));

const mockSupabase = vi.mocked(supabaseModule.supabase);

// Test component that uses useAuth
function TestComponent() {
  const { user, loading, role } = useAuth();
  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>User: {user?.email || 'None'}</div>
          <div>Role: {role}</div>
        </>
      )}
    </div>
  );
}

describe('AuthContext - Session Hardening', () => {
  let authStateChangeCallback: ((event: AuthChangeEvent, session: Session | null) => void) | null =
    null;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    authStateChangeCallback = null;

    // Mock getSession to return no session initially
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockSupabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Mock onAuthStateChange to capture the callback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockSupabase.auth.onAuthStateChange as any).mockImplementation(
      (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        authStateChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      }
    );

    // Mock signOut
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockSupabase.auth.signOut as any).mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Session Expiration Detection', () => {
    it('should reset session state when SIGNED_OUT event is triggered', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: { role: 'admin' },
        user_metadata: {},
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      // Start with a session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial session to load
      await waitFor(() => {
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Role: admin')).toBeInTheDocument();
      });

      // Simulate session expiration by triggering SIGNED_OUT event
      act(() => {
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_OUT', null);
        }
      });

      // Verify session is cleared
      await waitFor(() => {
        expect(screen.getByText('User: None')).toBeInTheDocument();
        expect(screen.getByText('Role: user')).toBeInTheDocument();
      });
    });

    it('should handle other auth events normally', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: { role: 'user' },
        user_metadata: {},
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('User: None')).toBeInTheDocument();
      });

      // Simulate SIGNED_IN event
      act(() => {
        if (authStateChangeCallback) {
          authStateChangeCallback('SIGNED_IN', mockSession);
        }
      });

      // Verify session is set
      await waitFor(() => {
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Role: user')).toBeInTheDocument();
      });
    });
  });

  describe('Multi-tab Synchronization', () => {
    it('should update session when storage event indicates signout from another tab', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: { role: 'user' },
        user_metadata: {},
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      // Start with a session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial session to load
      await waitFor(() => {
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
      });

      // Simulate storage event from another tab (sign out)
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'supabase.auth.token',
          newValue: null,
          oldValue: 'some-token-value',
        });
        window.dispatchEvent(storageEvent);
      });

      // Verify session is cleared
      await waitFor(() => {
        expect(screen.getByText('User: None')).toBeInTheDocument();
        expect(screen.getByText('Role: user')).toBeInTheDocument();
      });
    });

    it('should ignore storage events for other keys', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: { role: 'user' },
        user_metadata: {},
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      // Start with a session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial session to load
      await waitFor(() => {
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
      });

      // Simulate storage event for a different key
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'some-other-key',
          newValue: null,
          oldValue: 'some-value',
        });
        window.dispatchEvent(storageEvent);
      });

      // Verify session is NOT cleared
      await waitFor(() => {
        expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Role: user')).toBeInTheDocument();
      });
    });
  });

  describe('Role Management', () => {
    it('should return role from app_metadata when available', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'admin@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: { role: 'admin' },
        user_metadata: {},
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Role: admin')).toBeInTheDocument();
      });
    });

    it('should fallback to user_metadata role if app_metadata not available', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { role: 'admin' },
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Role: admin')).toBeInTheDocument();
      });
    });

    it('should default to "user" role if no role metadata exists', async () => {
      const mockUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      } as User;

      const mockSession: Session = {
        user: mockUser,
        access_token: 'token',
      } as Session;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockSupabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Role: user')).toBeInTheDocument();
      });
    });

    it('should return "user" role when user is null', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Role: user')).toBeInTheDocument();
      });
    });
  });
});
