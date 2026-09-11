import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthRepositoryProvider } from '@/modules/auth';
import { AnalyticsRepositoryProvider } from '@/modules/dashboard';
import { TicketRepositoryProvider } from '@/modules/tickets';
import type { Dependencies } from './container';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export function AppProviders({
  dependencies,
  children,
}: {
  dependencies: Dependencies;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRepositoryProvider value={dependencies.authRepository}>
        <TicketRepositoryProvider value={dependencies.ticketRepository}>
          <AnalyticsRepositoryProvider value={dependencies.analyticsRepository}>
            {children}
          </AnalyticsRepositoryProvider>
        </TicketRepositoryProvider>
      </AuthRepositoryProvider>
    </QueryClientProvider>
  );
}
