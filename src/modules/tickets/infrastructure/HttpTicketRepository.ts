import { ApiError, type HttpClient } from '@/shared/http';
import type { Page, Sort } from '@/shared/domain/pagination';
import { mapCrmTicketToTicket, type CrmTicket } from '../domain/crmTicket';
import type {
  Ticket,
  TicketDocument,
  TicketEvent,
  TicketNote,
  TicketUpdate,
} from '../domain/ticket';
import type {
  AdjacentTickets,
  TicketFilter,
  TicketFilterOptions,
  TicketQuery,
  TicketRepository,
  TicketSortField,
} from '../domain/TicketRepository';

type TicketPageDto = {
  items: CrmTicket[];
  total: number;
  page: number;
  pageSize: number;
};

const toQuery = (query: TicketQuery | (TicketFilter & { sort: Sort<TicketSortField> })) => {
  const { sort, ...filter } = query;
  const page = 'page' in query ? query.page : undefined;
  const pageSize = 'pageSize' in query ? query.pageSize : undefined;

  return {
    page,
    pageSize,
    search: filter.search,
    status: filter.status,
    type: filter.type,
    subject1: filter.subject1,
    subject2: filter.subject2,
    subject3: filter.subject3,
    sentiment: filter.sentiment,
    priority: filter.priority,
    from: filter.createdIn?.from?.toISOString(),
    to: filter.createdIn?.to?.toISOString(),
    sort: sort.field,
    dir: sort.direction,
  };
};

/** Talks to VOC Panel Nest `/ticket` endpoints — maps CRM rows via `mapCrmTicketToTicket`. */
export class HttpTicketRepository implements TicketRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(query: TicketQuery): Promise<Page<Ticket>> {
    const page = await this.#http.get<TicketPageDto>('/ticket', {
      query: toQuery(query),
    });
    return {
      items: page.items.map(mapCrmTicketToTicket),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async getById(id: string): Promise<Ticket | null> {
    try {
      const raw = await this.#http.get<CrmTicket>(`/ticket/${id}`);
      return mapCrmTicketToTicket(raw);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return null;
      throw error;
    }
  }

  getFilterOptions() {
    return this.#http.get<TicketFilterOptions>('/ticket/filter-options');
  }

  getAdjacent(id: string, filter: TicketFilter, sort: Sort<TicketSortField>) {
    return this.#http.get<AdjacentTickets>('/ticket/adjacent', {
      query: { id, ...toQuery({ ...filter, sort }) },
    });
  }

  /** Detail side-panels are not persisted yet — return empty until CRM history APIs exist. */
  async getTimeline(_id: string): Promise<TicketEvent[]> {
    return [];
  }

  async getUpdates(_id: string): Promise<TicketUpdate[]> {
    return [];
  }

  async getNotes(_id: string): Promise<TicketNote[]> {
    return [];
  }

  async addNote(_id: string, text: string): Promise<TicketNote> {
    return {
      id: crypto.randomUUID(),
      at: new Date(),
      author: 'کاربر فعلی',
      text: text.trim(),
    };
  }

  async getDocuments(_id: string): Promise<TicketDocument[]> {
    return [];
  }

  async setStarred(_id: string, _starred: boolean): Promise<void> {
    // Starred state is not stored on Nest tickets yet.
  }
}
