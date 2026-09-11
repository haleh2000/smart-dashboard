import { delay } from '@/mocks/delay';
import { mockTickets } from '@/mocks/tickets';
import type { Page } from '@/shared/domain/pagination';
import type { Ticket } from '../domain/ticket';
import type { TicketQuery, TicketRepository } from '../domain/TicketRepository';

const matchesSearch = (ticket: Ticket, search: string) =>
  [ticket.id, ticket.customer.mobile, ticket.customer.nationalId].some((value) =>
    value.includes(search),
  );

const compare = (a: Ticket, b: Ticket, field: TicketQuery['sort']['field']) =>
  field === 'createdAt'
    ? a.createdAt.getTime() - b.createdAt.getTime()
    : a[field].localeCompare(b[field]);

/** In-memory adapter. Filtering/sorting/paging here mimics what the backend is expected to do. */
export class MockTicketRepository implements TicketRepository {
  private readonly tickets: Ticket[];

  constructor(tickets: Ticket[] = mockTickets) {
    this.tickets = tickets;
  }

  async list({ page, pageSize, search, status, sort }: TicketQuery): Promise<Page<Ticket>> {
    await delay();
    const term = search?.trim();
    const direction = sort.direction === 'asc' ? 1 : -1;
    const filtered = this.tickets
      .filter(
        (ticket) => (!term || matchesSearch(ticket, term)) && (!status || ticket.status === status),
      )
      .sort((a, b) => compare(a, b, sort.field) * direction);

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async getById(id: string) {
    await delay();
    return this.tickets.find((ticket) => ticket.id === id) ?? null;
  }
}
