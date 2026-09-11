import { createServiceContext } from '@/shared/di/createServiceContext';
import type { AuthRepository } from '../domain/AuthRepository';

export const [AuthRepositoryProvider, useAuthRepository] =
  createServiceContext<AuthRepository>('AuthRepository');
