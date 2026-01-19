/**
 * Storage Keys
 * Centralized storage key management to prevent typos and enable easy refactoring
 */

/**
 * Application storage keys
 */
export const STORAGE_KEYS = {
  // Quiz related
  QUIZ_SESSION_PREFIX: 'quiz_session:',

  // Notes related
  NOTES_DATA: 'notes_data',

  // E2E test authentication mocks
  E2E_MOCK_AUTHENTICATED: 'e2e_mock_authenticated',
  E2E_MOCK_ROLE: 'e2e_mock_role',

  // Supabase auth token (for multi-tab sync detection)
  SUPABASE_AUTH_TOKEN: 'supabase.auth.token',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Helper function to generate quiz session key
 */
export function getQuizSessionKey(quizId: string): string {
  return `${STORAGE_KEYS.QUIZ_SESSION_PREFIX}${quizId}`;
}
