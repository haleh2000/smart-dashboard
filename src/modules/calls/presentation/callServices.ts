import { createServiceContext } from '@/shared/di/createServiceContext';
import type { CallRepository } from '../domain/CallRepository';

export const [CallRepositoryProvider, useCallRepository] =
  createServiceContext<CallRepository>('CallRepository');
