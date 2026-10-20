import type { Page, PageRequest, Sort } from '@/shared/domain/pagination';
import type { Priority, Sentiment } from '@/shared/domain/insights';
import type { DateRange } from '@/shared/domain/period';
import type {
  Ticket,
  TicketDocument,
  TicketEvent,
  TicketNote,
  TicketStatusFilter,
  TicketUpdate,
} from './ticket';

/** Every column of the list is sortable except وضعیت (README → «فیلتر / Sort … روی همه ستون‌ها»).
 *  وضعیت is filter-only: when the filter is «همه» the list stays ordered by creation time
 *  instead of grouping tickets by status. */
export const TICKET_SORT_FIELDS = [
  'id',
  'createdAt',
  'type',
  'mobile',
  'nationalId',
  'subject1',
  'subject2',
  'followUpOwner',
  'subject3',
  'branch',
  'complaintOwner',
  'channel',
  'sentiment',
  'priority',
] as const;
export type TicketSortField = (typeof TICKET_SORT_FIELDS)[number];

/**
 * Filters shared by the list, the export and the prev/next navigation. The list offers exactly
 * these, the last four as a dropdown on the column they filter.
 */
export interface TicketFilter {
  /** Free text: each token looks into the field its shape implies (see `ticketSearchFields`). */
  search?: string;
  /** A single CRM status or one of the KPI groups («باز»، «در حال بررسی»، «بسته‌شده»). */
  status?: TicketStatusFilter;
  priority?: Priority;
  sentiment?: Sentiment;
  /** CRM ticket type (شکایت، پیگیری، درخواست، …). */
  type?: string;
  /** «نوع اصلی شکایت» (subject level1)؛ شکایت موضوع ندارد. */
  subject1?: string;
  /** «نوع شکایت» (subject level2); only offered for the selected `subject1`. شکایت موضوع ندارد. */
  subject2?: string;
  /** «علت شکایت» (subject level3); only offered for the selected `subject1` + `subject2`. شکایت موضوع ندارد. */
  subject3?: string;
  createdIn?: DateRange;
}

export interface TicketQuery extends PageRequest, TicketFilter {
  sort: Sort<TicketSortField>;
}

/** A full subject path, so each level dropdown can offer only the children of the one above. */
export interface SubjectFilterPath {
  level1: string;
  level2: string;
  level3: string;
}

/** Distinct values the dropdowns on the column headers offer. */
export interface TicketFilterOptions {
  types: string[];
  subjectPaths: SubjectFilterPath[];
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
