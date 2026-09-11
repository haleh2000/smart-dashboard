import { createServiceContext } from '@/shared/di/createServiceContext';
import type { SettingsRepository, UserRepository } from '../domain/AdminRepositories';

export const [UserRepositoryProvider, useUserRepository] =
  createServiceContext<UserRepository>('UserRepository');

export const [SettingsRepositoryProvider, useSettingsRepository] =
  createServiceContext<SettingsRepository>('SettingsRepository');
