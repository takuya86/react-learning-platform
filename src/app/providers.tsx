import type { ReactNode } from 'react';
import { ProgressProvider } from '@/features/progress';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return <ProgressProvider>{children}</ProgressProvider>;
}
