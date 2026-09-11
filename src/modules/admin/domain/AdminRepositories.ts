import type { Role } from '@/modules/auth';
import type { Page, PageRequest } from '@/shared/domain/pagination';
import type {
  Integration,
  IntegrationId,
  Scenario,
  ScenarioInput,
  SystemSettings,
} from './settings';
import type { StaffUser, StaffUserInput } from './staffUser';

export interface UserQuery extends PageRequest {
  /** Matched against name, mobile and email. */
  search?: string;
  role?: Role;
  active?: boolean;
}

/** Port: user management. */
export interface UserRepository {
  list(query: UserQuery): Promise<Page<StaffUser>>;
  /** Rejects with DuplicateMobileError when the mobile is taken. */
  create(input: StaffUserInput): Promise<StaffUser>;
  update(id: string, input: StaffUserInput): Promise<StaffUser>;
  setActive(id: string, active: boolean): Promise<StaffUser>;
  /** Number of active users per role (roles page). */
  countByRole(): Promise<Record<Role, number>>;
}

/** Port: system settings, integrations and scenarios. */
export interface SettingsRepository {
  getSettings(): Promise<SystemSettings>;
  updateSettings(settings: SystemSettings): Promise<SystemSettings>;
  getIntegrations(): Promise<Integration[]>;
  /** Runs a health check against the external system and returns its fresh state. */
  checkIntegration(id: IntegrationId): Promise<Integration>;
  setIntegrationEnabled(id: IntegrationId, enabled: boolean): Promise<Integration>;
  getScenarios(): Promise<Scenario[]>;
  createScenario(input: ScenarioInput): Promise<Scenario>;
  setScenarioActive(id: string, active: boolean): Promise<Scenario>;
}
