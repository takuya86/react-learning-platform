// Main exports
export { SyncProvider, useSync, useSyncState } from './SyncProvider';

// Types
export type {
  SyncStatus,
  SyncState,
  SyncContextState,
  UserProgressRow,
  UserNoteRow,
} from './types';
export { initialSyncState, initialSyncContextState } from './types';

// Hooks
export { useProgressSync, type UseProgressSyncReturn } from './hooks/useProgressSync';
export { useNotesSync, type UseNotesSyncReturn } from './hooks/useNotesSync';
export {
  useSyncStatus,
  getCombinedSyncStatus,
  getLastSyncedAt,
  formatLastSyncedAt,
} from './hooks/useSyncStatus';

// Services
export { fetchProgress, saveProgress, deleteProgress } from './services/progressService';
export {
  fetchAllNotes,
  fetchNote,
  saveNote,
  saveAllNotes,
  deleteNote,
  deleteAllNotes,
} from './services/notesService';
export {
  mergeProgress,
  mergeNotes,
  hasProgressChanges,
  hasNotesChanges,
} from './services/mergeStrategy';

// Utils
export { debounce, SYNC_DEBOUNCE_MS } from './utils/debounce';
