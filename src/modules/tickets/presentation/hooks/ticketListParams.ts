import { PRIORITIES, SENTIMENTS } from '@/shared/domain/insights';
import { isPeriod, periodRange, type Period } from '@/shared/domain/period';
import { TICKET_STATUSES } from '../../domain/ticket';
import {
  TICKET_SORT_FIELDS,
  type TicketFilter,
  type TicketQuery,
  type TicketSortField,
} from '../../domain/TicketRepository';

export const PAGE_SIZES = [20, 50, 100] as const;
const DEFAULT_SORT: TicketQuery['sort'] = { field: 'createdAt', direction: 'desc' };

/** Everything the ticket list keeps in the URL. `period` is kept as a preset, not as dates. */
export interface TicketListState extends Omit<TicketFilter, 'createdIn'> {
  page: number;
  pageSize: number;
  period: Period;
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
    status: oneOf(TICKET_STATUSES, params.get('status')),
    priority: oneOf(PRIORITIES, params.get('priority')),
    sentiment: oneOf(SENTIMENTS, params.get('sentiment')),
    type: text('type'),
    subject1: text('subject'),
    branch: text('branch'),
    operator: text('operator'),
    starredOnly: params.get('starred') === '1' || undefined,
    period: isPeriod(params.get('period')) ? (params.get('period') as Period) : 'all',
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
    branch: state.branch,
    operator: state.operator,
    starred: state.starredOnly ? '1' : undefined,
    period: state.period !== 'all' ? state.period : undefined,
    sort: state.sort.field !== DEFAULT_SORT.field ? state.sort.field : undefined,
    dir: state.sort.direction !== DEFAULT_SORT.direction ? state.sort.direction : undefined,
  };
  return new URLSearchParams(
    Object.entries(entries).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
};

/** The repository filter for a URL state (period preset → concrete dates). */
export const toTicketFilter = ({
  page: _page,
  pageSize: _pageSize,
  period,
  sort: _sort,
  ...filter
}: TicketListState): TicketFilter => ({ ...filter, createdIn: periodRange(period) });

export const toTicketQuery = (state: TicketListState): TicketQuery => ({
  ...toTicketFilter(state),
  page: state.page,
  pageSize: state.pageSize,
  sort: state.sort,
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
    state.branch ||
    state.operator ||
    state.starredOnly ||
    state.period !== 'all',
  );
