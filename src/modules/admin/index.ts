// Public API of the admin module. Other code imports from "@/modules/admin" only.
export type { StaffUser, StaffUserInput } from './domain/staffUser';
export type {
  Integration,
  IntegrationId,
  Scenario,
  ScenarioInput,
  SystemSettings,
} from './domain/settings';
export type { SettingsRepository, UserQuery, UserRepository } from './domain/AdminRepositories';
export { MockSettingsRepository } from './infrastructure/MockSettingsRepository';
export { MockUserRepository } from './infrastructure/MockUserRepository';
export { adminPaths } from './presentation/adminPaths';
export { SettingsRepositoryProvider, UserRepositoryProvider } from './presentation/adminServices';
export { RolesPage } from './presentation/pages/RolesPage';
export { SettingsPage } from './presentation/pages/SettingsPage';
export { UsersPage } from './presentation/pages/UsersPage';
