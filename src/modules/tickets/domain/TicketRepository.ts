import type { Page, PageRequest, Sort } from '@/shared/domain/pagination';
import type { Ticket, TicketStatus } from './ticket';

export type TicketSortField = 'createdAt' | 'id' | 'status';

export interface TicketQuery extends PageRequest {
  /** Free text matched against ticket id, mobile and national id. */
  search?: string;
  status?: TicketStatus;
  sort: Sort<TicketSortField>;
}

/** Port: implemented by an infrastructure adapter and injected in src/app/container.ts. */
export interface TicketRepository {
  list(query: TicketQuery): Promise<Page<Ticket>>;
  /** Resolves to null when the ticket does not exist. */
  getById(id: string): Promise<Ticket | null>;
}
