// Public API of the auth module. Other code imports from "@/modules/auth" only.
export type { AuthRepository } from './domain/AuthRepository';
export { InvalidCredentialsError, isValidMobile, type Credentials } from './domain/credentials';
export { hasPermission, PERMISSIONS, type Permission } from './domain/permission';
export { ROLES, type Role } from './domain/role';
export type { User } from './domain/user';
export { setDevRole } from './infrastructure/devSession';
export { MockAuthRepository } from './infrastructure/MockAuthRepository';
export { authPaths } from './presentation/authPaths';
export { AuthRepositoryProvider } from './presentation/authServices';
export { useCan, useCurrentUser } from './presentation/currentUser';
export { LoginPage } from './presentation/pages/LoginPage';
export { RequirePermission } from './presentation/RequirePermission';
export { roleLabels } from './presentation/roleLabels';
export { useSignOut } from './presentation/sessionQueries';
export { SessionGate } from './presentation/SessionGate';
