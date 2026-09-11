import {
  MockRoleRepository,
  MockSettingsRepository,
  MockUserRepository,
  type RoleRepository,
  type SettingsRepository,
  type UserRepository,
} from '@/modules/admin';
import { MockAuthRepository, type AuthRepository } from '@/modules/auth';
import { MockCallRepository, type CallRepository } from '@/modules/calls';
import { MockCustomerRepository, type CustomerRepository } from '@/modules/customers';
import { MockAnalyticsRepository, type AnalyticsRepository } from '@/modules/dashboard';
import { MockTicketRepository, type TicketRepository } from '@/modules/tickets';

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
}

/**
 * Composition root — the ONLY place that chooses concrete adapters.
 * When api.yml lands, implement Http*Repository adapters (using createHttpClient from
 * "@/shared/http" with env.apiBaseUrl) and swap them in here; nothing else changes.
 */
export const createDependencies = (): Dependencies => ({
  authRepository: new MockAuthRepository(),
  ticketRepository: new MockTicketRepository(),
  analyticsRepository: new MockAnalyticsRepository(),
  callRepository: new MockCallRepository(),
  customerRepository: new MockCustomerRepository(),
  userRepository: new MockUserRepository(),
  settingsRepository: new MockSettingsRepository(),
  roleRepository: new MockRoleRepository(),
});
