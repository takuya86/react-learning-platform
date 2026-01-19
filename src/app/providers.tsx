import { useCallback, type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { ProgressProvider } from '@/features/progress';
import { SyncProvider, useSync } from '@/features/sync';
import type { Progress } from '@/domain/types';
import { ErrorBoundary } from '@/components';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Inner component that connects ProgressProvider with SyncProvider
 * This allows ProgressProvider to trigger sync when data changes
 */
function SyncedProgressProvider({ children }: { children: ReactNode }) {
  const { progressSync } = useSync();

  const handleProgressChange = useCallback(
    (progress: Progress) => {
      // Trigger debounced sync to Supabase
      progressSync.pushProgress(progress);
    },
    [progressSync]
  );

  return <ProgressProvider onProgressChange={handleProgressChange}>{children}</ProgressProvider>;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <SyncProvider>
            <ErrorBoundary>
              <SyncedProgressProvider>{children}</SyncedProgressProvider>
            </ErrorBoundary>
          </SyncProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}
