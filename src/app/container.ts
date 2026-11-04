import {
  MockRoleRepository,
  MockSettingsRepository,
  MockUserRepository,
  type RoleRepository,
  type SettingsRepository,
  type UserRepository,
} from '@/modules/admin';
import {
  HttpAuthRepository,
  MockAuthRepository,
  tokenStore,
  type AuthRepository,
} from '@/modules/auth';
import { MockCallRepository, type CallRepository } from '@/modules/calls';
import { MockCustomerRepository, type CustomerRepository } from '@/modules/customers';
import { MockAnalyticsRepository, type AnalyticsRepository } from '@/modules/dashboard';
import { MockTicketRepository, type TicketRepository } from '@/modules/tickets';
import {
  MockAgentWorkspaceRepository,
  type AgentWorkspaceRepository,
} from '@/modules/agent-workspace';
import { env } from '@/shared/config/env';
import { createHttpClient } from '@/shared/http';

/** Every port the app needs. Add a field here when a module introduces a new repository. */
export interface Dependencies {
  authRepository: AuthRepository;
  ticketRepository: TicketRepository;
  analyticsRepository: AnalyticsRepository;
  callRepository: CallRepository;
  customerRepository: CustomerRepository;
  userRepository: UserRepository;
  settingsRepository: SettingsRepository;
  roleRepository: RoleRepository;
  agentWorkspaceRepository: AgentWorkspaceRepository;
}

const createAuthRepository = (): AuthRepository => {
  if (!env.apiBaseUrl) {
    return new MockAuthRepository();
  }

  const http = createHttpClient({
    baseUrl: env.apiBaseUrl,
    getToken: () => tokenStore.getAccessToken(),
  });

  return new HttpAuthRepository(http);
};

/**
 * Composition root — the ONLY place that chooses concrete adapters.
 * Auth uses the Nest API when VITE_API_BASE_URL is set; other modules stay on mocks until Http adapters land.
 */
export const createDependencies = (): Dependencies => ({
  authRepository: createAuthRepository(),
  ticketRepository: new MockTicketRepository(),
  analyticsRepository: new MockAnalyticsRepository(),
  callRepository: new MockCallRepository(),
  customerRepository: new MockCustomerRepository(),
  userRepository: new MockUserRepository(),
  settingsRepository: new MockSettingsRepository(),
  roleRepository: new MockRoleRepository(),
  agentWorkspaceRepository: new MockAgentWorkspaceRepository(),
});
