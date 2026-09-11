import type { Page, PageRequest, Sort } from '@/shared/domain/pagination';
import type { Priority, Sentiment } from '@/shared/domain/insights';
import type { DateRange } from '@/shared/domain/period';
import type {
  Ticket,
  TicketDocument,
  TicketEvent,
  TicketNote,
  TicketStatus,
  TicketUpdate,
} from './ticket';

/** Every column of the list is sortable (README → «فیلتر / Sort … روی همه ستون‌ها»). */
export const TICKET_SORT_FIELDS = [
  'id',
  'createdAt',
  'type',
  'status',
  'mobile',
  'nationalId',
  'subject1',
  'subject2',
  'followUpOwner',
  'subject3',
  'branch',
  'complaintOwner',
  'sentiment',
  'priority',
] as const;
export type TicketSortField = (typeof TICKET_SORT_FIELDS)[number];

/** Filters shared by the list, the export and the prev/next navigation. */
export interface TicketFilter {
  /** Free text matched against ticket id, mobile, national id and customer name. */
  search?: string;
  status?: TicketStatus;
  priority?: Priority;
  sentiment?: Sentiment;
  type?: string;
  subject1?: string;
  branch?: string;
  /** Matches either the follow-up owner or the complaint owner. */
  operator?: string;
  createdIn?: DateRange;
  starredOnly?: boolean;
}

export interface TicketQuery extends PageRequest, TicketFilter {
  sort: Sort<TicketSortField>;
}

/** Distinct values the filter selects offer. */
export interface TicketFilterOptions {
  types: string[];
  subjects: string[];
  branches: string[];
  operators: string[];
}

export interface AdjacentTickets {
  previousId: string | null;
  nextId: string | null;
}

/** Port: implemented by an infrastructure adapter and injected in src/app/container.ts. */
export interface TicketRepository {
  list(query: TicketQuery): Promise<Page<Ticket>>;
  /** Resolves to null when the ticket does not exist. */
  getById(id: string): Promise<Ticket | null>;
  getFilterOptions(): Promise<TicketFilterOptions>;
  /** Neighbours of a ticket inside a filtered, sorted list (detail-page prev/next). */
  getAdjacent(
    id: string,
    filter: TicketFilter,
    sort: Sort<TicketSortField>,
  ): Promise<AdjacentTickets>;
  getTimeline(id: string): Promise<TicketEvent[]>;
  getUpdates(id: string): Promise<TicketUpdate[]>;
  getNotes(id: string): Promise<TicketNote[]>;
  addNote(id: string, text: string): Promise<TicketNote>;
  getDocuments(id: string): Promise<TicketDocument[]>;
  setStarred(id: string, starred: boolean): Promise<void>;
}
