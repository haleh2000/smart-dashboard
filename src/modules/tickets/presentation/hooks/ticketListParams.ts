import { PRIORITIES, SENTIMENTS } from '@/shared/domain/insights';
import { isPeriod, periodRange, type DateRange, type Period } from '@/shared/domain/period';
import { TICKET_STATUS_FILTERS } from '../../domain/ticket';
import {
  TICKET_SORT_FIELDS,
  type TicketFilter,
  type TicketQuery,
  type TicketSortField,
} from '../../domain/TicketRepository';

export const PAGE_SIZES = [20, 50, 100] as const;
const DEFAULT_SORT: TicketQuery['sort'] = { field: 'createdAt', direction: 'desc' };

/**
 * Everything the ticket list keeps in the URL. `period` is kept as a preset, not as dates;
 * a custom «از/تا» range (with a date and an hour) lives in `from`/`to` and wins over it.
 */
export interface TicketListState extends Omit<TicketFilter, 'createdIn'> {
  page: number;
  pageSize: number;
  period: Period;
  /** ISO start of the custom creation-date range. */
  from?: string;
  /** ISO end of the custom creation-date range. */
  to?: string;
  sort: TicketQuery['sort'];
}

const oneOf = <T extends string>(values: readonly T[], value: string | null) =>
  values.find((v) => v === value);

export const parseTicketListParams = (params: URLSearchParams): TicketListState => {
  const pageSize = Number(params.get('size'));
  const text = (key: string) => params.get(key) || undefined;
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZES.find((size) => size === pageSize) ?? PAGE_SIZES[0],
    search: text('q'),
    status: oneOf(TICKET_STATUS_FILTERS, params.get('status')),
    priority: oneOf(PRIORITIES, params.get('priority')),
    sentiment: oneOf(SENTIMENTS, params.get('sentiment')),
    type: text('type'),
    subject1: text('subject'),
    subject2: text('subject2'),
    subject3: text('subject3'),
    period: isPeriod(params.get('period')) ? (params.get('period') as Period) : 'all',
    from: text('from'),
    to: text('to'),
    sort: {
      field: oneOf<TicketSortField>(TICKET_SORT_FIELDS, params.get('sort')) ?? DEFAULT_SORT.field,
      direction: params.get('dir') === 'asc' ? 'asc' : 'desc',
    },
  };
};

export const serializeTicketListParams = (state: TicketListState) => {
  const entries: Record<string, string | undefined> = {
    page: state.page > 1 ? String(state.page) : undefined,
    size: state.pageSize !== PAGE_SIZES[0] ? String(state.pageSize) : undefined,
    q: state.search,
    status: state.status,
    priority: state.priority,
    sentiment: state.sentiment,
    type: state.type,
    subject: state.subject1,
    subject2: state.subject2,
    subject3: state.subject3,
    period: state.period !== 'all' ? state.period : undefined,
    from: state.from,
    to: state.to,
    sort: state.sort.field !== DEFAULT_SORT.field ? state.sort.field : undefined,
    dir: state.sort.direction !== DEFAULT_SORT.direction ? state.sort.direction : undefined,
  };
  return new URLSearchParams(
    Object.entries(entries).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
};

/** The custom «از/تا» range of a URL state, when both ends survived the round trip. */
export const ticketCustomRange = (from?: string, to?: string): DateRange | null => {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (!start || !end) return null;
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? null : { from: start, to: end };
};

/** The repository filter for a URL state: the custom range if there is one, else the preset. */
export const toTicketFilter = ({
  page: _page,
  pageSize: _pageSize,
  period,
  from,
  to,
  sort: _sort,
  ...filter
}: TicketListState): TicketFilter => ({
  ...filter,
  createdIn: ticketCustomRange(from, to) ?? periodRange(period),
});

export const toTicketQuery = (state: TicketListState): TicketQuery => ({
  ...toTicketFilter(state),
  page: state.page,
  pageSize: state.pageSize,
  // وضعیت is not sortable: a stale `sort=status` (old link/state) falls back to
  // creation time so «همه» never groups closed tickets together.
  sort: (TICKET_SORT_FIELDS as readonly string[]).includes(state.sort.field)
    ? state.sort
    : DEFAULT_SORT,
});

/** Filters that count as "the user narrowed the list" (for the reset button). */
export const isFiltered = (state: TicketListState) =>
  Boolean(
    state.search ||
    state.status ||
    state.priority ||
    state.sentiment ||
    state.type ||
    state.subject1 ||
    state.subject2 ||
    state.subject3 ||
    state.from ||
    state.to ||
    state.period !== 'all',
  );
