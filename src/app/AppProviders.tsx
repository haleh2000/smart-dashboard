import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  RoleRepositoryProvider,
  SettingsRepositoryProvider,
  UserRepositoryProvider,
} from '@/modules/admin';
import { AuthRepositoryProvider } from '@/modules/auth';
import { CallRepositoryProvider } from '@/modules/calls';
import { CustomerRepositoryProvider } from '@/modules/customers';
import { AnalyticsRepositoryProvider } from '@/modules/dashboard';
import { TicketRepositoryProvider } from '@/modules/tickets';
import { AgentWorkspaceRepositoryProvider } from '@/modules/agent-workspace';
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
            <CallRepositoryProvider value={dependencies.callRepository}>
              <CustomerRepositoryProvider value={dependencies.customerRepository}>
                <UserRepositoryProvider value={dependencies.userRepository}>
                  <SettingsRepositoryProvider value={dependencies.settingsRepository}>
                    <RoleRepositoryProvider value={dependencies.roleRepository}>
                      <AgentWorkspaceRepositoryProvider value={dependencies.agentWorkspaceRepository}>
                        {children}
                      </AgentWorkspaceRepositoryProvider>
                    </RoleRepositoryProvider>
                  </SettingsRepositoryProvider>
                </UserRepositoryProvider>
              </CustomerRepositoryProvider>
            </CallRepositoryProvider>
          </AnalyticsRepositoryProvider>
        </TicketRepositoryProvider>
      </AuthRepositoryProvider>
    </QueryClientProvider>
  );
}
