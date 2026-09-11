import { createServiceContext } from '@/shared/di/createServiceContext';
import type { TicketRepository } from '../domain/TicketRepository';

export const [TicketRepositoryProvider, useTicketRepository] =
  createServiceContext<TicketRepository>('TicketRepository');
