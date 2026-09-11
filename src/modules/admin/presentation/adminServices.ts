import { createServiceContext } from '@/shared/di/createServiceContext';
import type {
  RoleRepository,
  SettingsRepository,
  UserRepository,
} from '../domain/AdminRepositories';

export const [RoleRepositoryProvider, useRoleRepository] =
  createServiceContext<RoleRepository>('RoleRepository');

export const [UserRepositoryProvider, useUserRepository] =
  createServiceContext<UserRepository>('UserRepository');

export const [SettingsRepositoryProvider, useSettingsRepository] =
  createServiceContext<SettingsRepository>('SettingsRepository');
