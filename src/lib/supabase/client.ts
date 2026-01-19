import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isE2E = import.meta.env.VITE_E2E === 'true';

// Check if we're in mock mode:
// - No Supabase env vars set (development/testing without Supabase)
// - VITE_E2E=true (E2E tests force mock mode regardless of env vars)
export const isMockMode = isE2E || !supabaseUrl || !supabaseAnonKey;

// Mock query builder for data operations
function createMockQueryBuilder() {
  const builder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    // upsert accepts options like { onConflict, ignoreDuplicates }
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (value: { data: null; error: null }) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve),
  };
  return builder;
}

// Create a mock Supabase client for testing
// Using 'as unknown as' pattern to bypass strict type checking for mock client
function createMockClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: () => createMockQueryBuilder(),
  } as unknown as SupabaseClient;
}

export const supabase = isMockMode
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey);
