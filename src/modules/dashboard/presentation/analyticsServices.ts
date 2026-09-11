import { createServiceContext } from '@/shared/di/createServiceContext';
import type { AnalyticsRepository } from '../domain/AnalyticsRepository';

export const [AnalyticsRepositoryProvider, useAnalyticsRepository] =
  createServiceContext<AnalyticsRepository>('AnalyticsRepository');
