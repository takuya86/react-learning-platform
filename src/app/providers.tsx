import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { ProgressProvider } from '@/features/progress';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <ProgressProvider>{children}</ProgressProvider>
    </AuthProvider>
  );
}
