import {
  HttpCrmSyncRepository,
  HttpSettingsRepository,
  HttpUserRepository,
  MockCrmSyncRepository,
  MockRoleRepository,
  MockSettingsRepository,
  MockUserRepository,
  type CrmSyncRepository,
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
import {
  HttpCallRepository,
  MockCallRepository,
  type CallRepository,
} from '@/modules/calls';
import {
  HttpCustomerRepository,
  MockCustomerRepository,
  type CustomerRepository,
} from '@/modules/customers';
import { MockAnalyticsRepository, type AnalyticsRepository } from '@/modules/dashboard';
import {
  HttpTicketRepository,
  MockTicketRepository,
  type TicketRepository,
} from '@/modules/tickets';
import {
  MockAgentWorkspaceRepository,
  type AgentWorkspaceRepository,
} from '@/modules/agent-workspace';
import { env } from '@/shared/config/env';
import { createHttpClient, type HttpClient } from '@/shared/http';

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
  crmSyncRepository: CrmSyncRepository;
}

const createApiClient = (): HttpClient | null => {
  if (!env.apiBaseUrl) return null;
  return createHttpClient({
    baseUrl: env.apiBaseUrl,
    getToken: () => tokenStore.getAccessToken(),
  });
};

/**
 * Composition root — the ONLY place that chooses concrete adapters.
 * Auth, tickets, calls, customers, users, settings, and CRM sync use the Nest API when
 * VITE_API_BASE_URL is set.
 */
export const createDependencies = (): Dependencies => {
  const http = createApiClient();

  return {
    authRepository: http ? new HttpAuthRepository(http) : new MockAuthRepository(),
    ticketRepository: http ? new HttpTicketRepository(http) : new MockTicketRepository(),
    analyticsRepository: new MockAnalyticsRepository(),
    callRepository: http ? new HttpCallRepository(http) : new MockCallRepository(),
    customerRepository: http
      ? new HttpCustomerRepository(http)
      : new MockCustomerRepository(),
    userRepository: http ? new HttpUserRepository(http) : new MockUserRepository(),
    settingsRepository: http
      ? new HttpSettingsRepository(http)
      : new MockSettingsRepository(),
    roleRepository: new MockRoleRepository(),
    agentWorkspaceRepository: new MockAgentWorkspaceRepository(),
    crmSyncRepository: http
      ? new HttpCrmSyncRepository(http)
      : new MockCrmSyncRepository(),
  };
};
