import { MockAuthRepository, type AuthRepository } from '@/modules/auth';
import { MockAnalyticsRepository, type AnalyticsRepository } from '@/modules/dashboard';
import { MockTicketRepository, type TicketRepository } from '@/modules/tickets';

/** Every port the app needs. Add a field here when a module introduces a new repository. */
export interface Dependencies {
  authRepository: AuthRepository;
  ticketRepository: TicketRepository;
  analyticsRepository: AnalyticsRepository;
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
});
