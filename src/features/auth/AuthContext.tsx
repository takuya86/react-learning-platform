import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isMockMode } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: 'user' | 'admin';
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Mock user for E2E testing (when localStorage flag is set)
const MOCK_USER: User = {
  id: 'e2e-test-user',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: { role: 'user' },
  user_metadata: {},
} as User;

const MOCK_SESSION: Session = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
} as Session;

// Check if E2E mock auth is enabled via localStorage
function isE2EMockAuthEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return isMockMode && localStorage.getItem('e2e_mock_authenticated') === 'true';
}

// Extract role from user metadata
function getUserRole(user: User | null): 'user' | 'admin' {
  if (!user) return 'user';

  // In mock mode, check localStorage for role override
  if (isMockMode && typeof window !== 'undefined') {
    const mockRole = localStorage.getItem('e2e_mock_role');
    if (mockRole === 'admin' || mockRole === 'user') {
      return mockRole;
    }
  }

  const role = user.app_metadata?.role || user.user_metadata?.role || 'user';
  return role === 'admin' ? 'admin' : 'user';
}

// Storage key for multi-tab sync
const AUTH_STORAGE_KEY = 'supabase.auth.token';

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle session state updates
  const handleSessionUpdate = useCallback((newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // In E2E mock mode with flag set, auto-authenticate
    if (isE2EMockAuthEnabled()) {
      setSession(MOCK_SESSION);
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionUpdate(session);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Session expiration detection: handle SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        handleSessionUpdate(null);
        // Redirect will be handled by RequireAuth component
      } else {
        handleSessionUpdate(session);
      }
    });

    // Multi-tab synchronization: listen to storage events
    const handleStorageChange = (e: StorageEvent) => {
      // When another tab signs out, the auth token is removed from localStorage
      if (e.key === AUTH_STORAGE_KEY && e.newValue === null) {
        // Another tab signed out, update local state
        handleSessionUpdate(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    // Cleanup subscription on unmount (StrictMode safe)
    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [handleSessionUpdate]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  const role = getUserRole(user);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        role,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
