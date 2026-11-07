import { createServiceContext } from '@/shared/di/createServiceContext';
import type {
  RoleRepository,
  SettingsRepository,
  UserRepository,
} from '../domain/AdminRepositories';
import type { CrmSyncRepository } from '../domain/CrmSyncRepository';

export const [RoleRepositoryProvider, useRoleRepository] =
  createServiceContext<RoleRepository>('RoleRepository');

export const [UserRepositoryProvider, useUserRepository] =
  createServiceContext<UserRepository>('UserRepository');

export const [SettingsRepositoryProvider, useSettingsRepository] =
  createServiceContext<SettingsRepository>('SettingsRepository');

export const [CrmSyncRepositoryProvider, useCrmSyncRepository] =
  createServiceContext<CrmSyncRepository>('CrmSyncRepository');
