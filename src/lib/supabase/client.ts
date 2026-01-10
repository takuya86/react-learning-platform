import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in mock mode (no env vars set - for testing/development without Supabase)
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

// Create a mock Supabase client for testing
function createMockClient(): SupabaseClient {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export const supabase: SupabaseClient = isMockMode
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey);
