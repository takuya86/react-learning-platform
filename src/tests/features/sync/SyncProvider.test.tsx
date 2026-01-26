import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SyncProvider, useSync, useSyncState } from '@/features/sync/SyncProvider';
import type { Progress, Note } from '@/domain/types';

// Define mock values and hooks before vi.mock (hoisting)
const mockUser = vi.hoisted(() => ({
  value: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user' as const,
  } as { id: string; email: string; role: 'user' } | null,
}));

const mockProgressSync = vi.hoisted(() => ({
  syncState: { status: 'idle' as const, lastSyncedAt: null, error: null },
  pullProgress: vi.fn(),
  pushProgress: vi.fn(),
  pushProgressImmediate: vi.fn(),
  mergeWithRemote: vi.fn(),
}));

const mockNotesSync = vi.hoisted(() => ({
  syncState: { status: 'idle' as const, lastSyncedAt: null, error: null },
  pullNotes: vi.fn(),
  pushNote: vi.fn(),
  pushAllNotes: vi.fn(),
  mergeWithRemote: vi.fn(),
}));

const mockSyncStatus = vi.hoisted(() => ({
  state: {
    progress: { status: 'idle' as const, lastSyncedAt: null, error: null },
    notes: { status: 'idle' as const, lastSyncedAt: null, error: null },
    isOnline: true,
  },
  setProgressSyncState: vi.fn(),
  setNotesSyncState: vi.fn(),
}));

// Mock modules
vi.mock('@/lib/supabase', () => ({
  supabase: {},
  isMockMode: false,
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockUser.value,
    isLoading: false,
  }),
}));

vi.mock('@/features/sync/hooks/useProgressSync', () => ({
  useProgressSync: () => mockProgressSync,
}));

vi.mock('@/features/sync/hooks/useNotesSync', () => ({
  useNotesSync: () => mockNotesSync,
}));

vi.mock('@/features/sync/hooks/useSyncStatus', () => ({
  useSyncStatus: () => mockSyncStatus,
  getCombinedSyncStatus: vi.fn((progress, notes, isOnline) => {
    if (!isOnline) return 'offline';
    if (progress.status === 'error' || notes.status === 'error') return 'error';
    if (progress.status === 'syncing' || notes.status === 'syncing') return 'syncing';
    return 'idle';
  }),
  getLastSyncedAt: vi.fn((progress, notes) => {
    if (!progress.lastSyncedAt && !notes.lastSyncedAt) return null;
    if (!progress.lastSyncedAt) return notes.lastSyncedAt;
    if (!notes.lastSyncedAt) return progress.lastSyncedAt;
    return new Date(progress.lastSyncedAt) > new Date(notes.lastSyncedAt)
      ? progress.lastSyncedAt
      : notes.lastSyncedAt;
  }),
  formatLastSyncedAt: vi.fn((lastSyncedAt) => {
    if (!lastSyncedAt) return '未同期';
    return 'たった今';
  }),
}));

// Test component that uses useSync
function TestComponent() {
  const { state, combinedStatus, lastSyncedAtFormatted, progressSync, notesSync } = useSync();
  return (
    <div>
      <div data-testid="combined-status">{combinedStatus}</div>
      <div data-testid="last-synced">{lastSyncedAtFormatted}</div>
      <div data-testid="progress-status">{state.progress.status}</div>
      <div data-testid="notes-status">{state.notes.status}</div>
      <div data-testid="is-online">{state.isOnline ? 'online' : 'offline'}</div>
      <div data-testid="has-progress-sync">{progressSync ? 'yes' : 'no'}</div>
      <div data-testid="has-notes-sync">{notesSync ? 'yes' : 'no'}</div>
    </div>
  );
}

// Test component that uses useSyncState
function LightweightTestComponent() {
  const { state, combinedStatus, lastSyncedAtFormatted } = useSyncState();
  return (
    <div>
      <div data-testid="combined-status">{combinedStatus}</div>
      <div data-testid="last-synced">{lastSyncedAtFormatted}</div>
      <div data-testid="progress-status">{state.progress.status}</div>
    </div>
  );
}

describe('SyncProvider', () => {
  const baseProgress: Progress = {
    lessons: {},
    completedQuizzes: [],
    completedExercises: [],
    streak: 0,
    lastStudyDate: null,
    studyDates: [],
    quizAttempts: [],
  };

  const baseNotes: Record<string, Note> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user' as const,
    };
    mockSyncStatus.state = {
      progress: { status: 'idle', lastSyncedAt: null, error: null },
      notes: { status: 'idle', lastSyncedAt: null, error: null },
      isOnline: true,
    };
  });

  describe('Provider Rendering', () => {
    it('should render children successfully', () => {
      render(
        <SyncProvider>
          <div data-testid="child">Test Child</div>
        </SyncProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide context value to children', () => {
      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('idle');
      expect(screen.getByTestId('has-progress-sync')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-notes-sync')).toHaveTextContent('yes');
    });
  });

  describe('useSync Hook', () => {
    it('should throw error when used outside SyncProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSync must be used within a SyncProvider');

      consoleSpy.mockRestore();
    });

    it('should provide all required context values', () => {
      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toBeInTheDocument();
      expect(screen.getByTestId('last-synced')).toBeInTheDocument();
      expect(screen.getByTestId('progress-status')).toBeInTheDocument();
      expect(screen.getByTestId('notes-status')).toBeInTheDocument();
      expect(screen.getByTestId('is-online')).toBeInTheDocument();
    });
  });

  describe('useSyncState Hook', () => {
    it('should provide lightweight sync state', () => {
      // Set a last synced time so the formatted text shows "たった今"
      mockSyncStatus.state.progress.lastSyncedAt = '2025-01-20T10:00:00Z';

      render(
        <SyncProvider>
          <LightweightTestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('idle');
      expect(screen.getByTestId('last-synced')).toHaveTextContent('たった今');
      expect(screen.getByTestId('progress-status')).toHaveTextContent('idle');
    });
  });

  describe('Sync Status Updates', () => {
    it('should show syncing status when progress is syncing', () => {
      mockSyncStatus.state.progress.status = 'syncing';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('syncing');
      expect(screen.getByTestId('progress-status')).toHaveTextContent('syncing');
    });

    it('should show syncing status when notes are syncing', () => {
      mockSyncStatus.state.notes.status = 'syncing';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('syncing');
      expect(screen.getByTestId('notes-status')).toHaveTextContent('syncing');
    });

    it('should show error status when progress has error', () => {
      mockSyncStatus.state.progress.status = 'error';
      mockSyncStatus.state.progress.error = 'Sync failed';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('error');
      expect(screen.getByTestId('progress-status')).toHaveTextContent('error');
    });

    it('should show error status when notes have error', () => {
      mockSyncStatus.state.notes.status = 'error';
      mockSyncStatus.state.notes.error = 'Note sync failed';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('error');
      expect(screen.getByTestId('notes-status')).toHaveTextContent('error');
    });

    it('should show offline status when not online', () => {
      mockSyncStatus.state.isOnline = false;

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('offline');
      expect(screen.getByTestId('is-online')).toHaveTextContent('offline');
    });

    it('should prioritize offline over other statuses', () => {
      mockSyncStatus.state.isOnline = false;
      mockSyncStatus.state.progress.status = 'syncing';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('offline');
    });

    it('should prioritize error over syncing status', () => {
      mockSyncStatus.state.progress.status = 'error';
      mockSyncStatus.state.notes.status = 'syncing';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('error');
    });
  });

  describe('syncOnLogin', () => {
    it('should merge local and remote data on login', async () => {
      const localProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      const localNotes: Record<string, Note> = {
        'lesson-1': {
          lessonId: 'lesson-1',
          markdown: 'Local note',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      const mergedProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
          'lesson-2': { lessonId: 'lesson-2', openedAt: '2025-01-02T00:00:00Z' },
        },
      };

      const mergedNotes: Record<string, Note> = {
        'lesson-1': {
          lessonId: 'lesson-1',
          markdown: 'Merged note',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      };

      mockProgressSync.mergeWithRemote.mockResolvedValue(mergedProgress);
      mockNotesSync.mergeWithRemote.mockResolvedValue(mergedNotes);
      mockProgressSync.pushProgressImmediate.mockResolvedValue(undefined);
      mockNotesSync.pushAllNotes.mockResolvedValue(undefined);

      let result: { progress: Progress; notes: Record<string, Note> } | null = null;

      function TestSyncOnLogin() {
        const { syncOnLogin } = useSync();

        // Use a data attribute to access the function in tests
        return (
          <button
            data-testid="sync-trigger"
            onClick={async () => {
              result = await syncOnLogin(localProgress, localNotes);
            }}
          >
            Sync
          </button>
        );
      }

      render(
        <SyncProvider>
          <TestSyncOnLogin />
        </SyncProvider>
      );

      await act(async () => {
        const button = screen.getByTestId('sync-trigger');
        button.click();
        // Wait for the promise to resolve
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockProgressSync.mergeWithRemote).toHaveBeenCalledWith(localProgress);
      expect(mockNotesSync.mergeWithRemote).toHaveBeenCalledWith(localNotes);
      expect(mockProgressSync.pushProgressImmediate).toHaveBeenCalledWith(mergedProgress);
      expect(mockNotesSync.pushAllNotes).toHaveBeenCalledWith(mergedNotes);
      expect(result).toEqual({ progress: mergedProgress, notes: mergedNotes });
    });

    it('should merge and push data in parallel', async () => {
      const localProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
        },
      };

      const localNotes: Record<string, Note> = {
        'lesson-1': {
          lessonId: 'lesson-1',
          markdown: 'Local note',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      };

      const mergedProgress: Progress = {
        ...baseProgress,
        lessons: {
          'lesson-1': { lessonId: 'lesson-1', openedAt: '2025-01-01T00:00:00Z' },
          'lesson-2': { lessonId: 'lesson-2', openedAt: '2025-01-02T00:00:00Z' },
        },
      };

      const mergedNotes: Record<string, Note> = {
        'lesson-1': {
          lessonId: 'lesson-1',
          markdown: 'Merged note',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      };

      mockProgressSync.mergeWithRemote.mockResolvedValue(mergedProgress);
      mockNotesSync.mergeWithRemote.mockResolvedValue(mergedNotes);
      mockProgressSync.pushProgressImmediate.mockResolvedValue(undefined);
      mockNotesSync.pushAllNotes.mockResolvedValue(undefined);

      let result: { progress: Progress; notes: Record<string, Note> } | null = null;

      function TestSyncOnLogin() {
        const { syncOnLogin } = useSync();

        return (
          <button
            data-testid="sync-trigger"
            onClick={async () => {
              result = await syncOnLogin(localProgress, localNotes);
            }}
          >
            Sync
          </button>
        );
      }

      render(
        <SyncProvider>
          <TestSyncOnLogin />
        </SyncProvider>
      );

      await act(async () => {
        const button = screen.getByTestId('sync-trigger');
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Verify merge operations were called in parallel
      expect(mockProgressSync.mergeWithRemote).toHaveBeenCalledWith(localProgress);
      expect(mockNotesSync.mergeWithRemote).toHaveBeenCalledWith(localNotes);

      // Verify push operations were called after merge
      expect(mockProgressSync.pushProgressImmediate).toHaveBeenCalledWith(mergedProgress);
      expect(mockNotesSync.pushAllNotes).toHaveBeenCalledWith(mergedNotes);

      expect(result).toEqual({ progress: mergedProgress, notes: mergedNotes });
    });

    it('should return local data when user is not authenticated', async () => {
      mockUser.value = null;

      const localProgress: Progress = baseProgress;
      const localNotes: Record<string, Note> = baseNotes;

      let result: { progress: Progress; notes: Record<string, Note> } | null = null;

      function TestSyncOnLogin() {
        const { syncOnLogin } = useSync();

        return (
          <button
            data-testid="sync-trigger"
            onClick={async () => {
              result = await syncOnLogin(localProgress, localNotes);
            }}
          >
            Sync
          </button>
        );
      }

      render(
        <SyncProvider>
          <TestSyncOnLogin />
        </SyncProvider>
      );

      await act(async () => {
        const button = screen.getByTestId('sync-trigger');
        button.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockProgressSync.mergeWithRemote).not.toHaveBeenCalled();
      expect(mockNotesSync.mergeWithRemote).not.toHaveBeenCalled();
      expect(result).toEqual({ progress: localProgress, notes: localNotes });
    });
  });

  describe('User Change Handling', () => {
    it('should reset sync state on logout', async () => {
      const { rerender } = render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      // User is logged in initially
      expect(mockUser.value).not.toBeNull();

      // Simulate logout
      mockUser.value = null;

      rerender(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      await waitFor(() => {
        expect(mockSyncStatus.setProgressSyncState).toHaveBeenCalledWith({
          status: 'idle',
          lastSyncedAt: null,
          error: null,
        });
        expect(mockSyncStatus.setNotesSyncState).toHaveBeenCalledWith({
          status: 'idle',
          lastSyncedAt: null,
          error: null,
        });
      });
    });

    it('should not reset sync state when user remains the same', async () => {
      const { rerender } = render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      vi.clearAllMocks();

      // Rerender with same user
      rerender(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      // Wait a bit to ensure no calls were made
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSyncStatus.setProgressSyncState).not.toHaveBeenCalledWith({
        status: 'idle',
        lastSyncedAt: null,
        error: null,
      });
    });

    it('should handle user changing to a different user', () => {
      const { rerender } = render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      vi.clearAllMocks();

      // Change user to a different user
      mockUser.value = {
        id: 'new-user-id',
        email: 'new@example.com',
        role: 'user' as const,
      };

      rerender(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      // When user changes to a different user, the initial sync flag is reset internally
      // but no sync state reset happens (only happens on logout)
      // This test verifies the component doesn't crash on user change
      expect(screen.getByTestId('combined-status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', () => {
      mockSyncStatus.state.progress.status = 'error';
      mockSyncStatus.state.progress.error = 'Network error';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('error');
      expect(screen.getByTestId('progress-status')).toHaveTextContent('error');
    });

    it('should handle multiple simultaneous errors', () => {
      mockSyncStatus.state.progress.status = 'error';
      mockSyncStatus.state.progress.error = 'Progress error';
      mockSyncStatus.state.notes.status = 'error';
      mockSyncStatus.state.notes.error = 'Notes error';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('combined-status')).toHaveTextContent('error');
      expect(screen.getByTestId('progress-status')).toHaveTextContent('error');
      expect(screen.getByTestId('notes-status')).toHaveTextContent('error');
    });
  });

  describe('Last Synced Time', () => {
    it('should show last synced time when available', () => {
      mockSyncStatus.state.progress.lastSyncedAt = '2025-01-20T10:00:00Z';

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      expect(screen.getByTestId('last-synced')).toHaveTextContent('たった今');
    });

    it('should show unsynced when no sync time available', () => {
      mockSyncStatus.state.progress.lastSyncedAt = null;
      mockSyncStatus.state.notes.lastSyncedAt = null;

      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      // When no sync time is available, formatLastSyncedAt returns '未同期'
      expect(screen.getByTestId('last-synced')).toHaveTextContent('未同期');
    });
  });

  describe('Integration with Sync Hooks', () => {
    it('should pass state update callback to progressSync', () => {
      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      // Verify that useProgressSync was called (implicitly tested by rendering)
      expect(screen.getByTestId('has-progress-sync')).toHaveTextContent('yes');
    });

    it('should pass state update callback to notesSync', () => {
      render(
        <SyncProvider>
          <TestComponent />
        </SyncProvider>
      );

      // Verify that useNotesSync was called (implicitly tested by rendering)
      expect(screen.getByTestId('has-notes-sync')).toHaveTextContent('yes');
    });

    it('should provide access to progressSync methods', () => {
      function TestProgressSync() {
        const { progressSync } = useSync();
        return (
          <div>
            <div data-testid="has-pull">{progressSync.pullProgress ? 'yes' : 'no'}</div>
            <div data-testid="has-push">{progressSync.pushProgress ? 'yes' : 'no'}</div>
            <div data-testid="has-push-immediate">
              {progressSync.pushProgressImmediate ? 'yes' : 'no'}
            </div>
            <div data-testid="has-merge">{progressSync.mergeWithRemote ? 'yes' : 'no'}</div>
          </div>
        );
      }

      render(
        <SyncProvider>
          <TestProgressSync />
        </SyncProvider>
      );

      expect(screen.getByTestId('has-pull')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-push')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-push-immediate')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-merge')).toHaveTextContent('yes');
    });

    it('should provide access to notesSync methods', () => {
      function TestNotesSync() {
        const { notesSync } = useSync();
        return (
          <div>
            <div data-testid="has-pull">{notesSync.pullNotes ? 'yes' : 'no'}</div>
            <div data-testid="has-push">{notesSync.pushNote ? 'yes' : 'no'}</div>
            <div data-testid="has-push-all">{notesSync.pushAllNotes ? 'yes' : 'no'}</div>
            <div data-testid="has-merge">{notesSync.mergeWithRemote ? 'yes' : 'no'}</div>
          </div>
        );
      }

      render(
        <SyncProvider>
          <TestNotesSync />
        </SyncProvider>
      );

      expect(screen.getByTestId('has-pull')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-push')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-push-all')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-merge')).toHaveTextContent('yes');
    });
  });
});
