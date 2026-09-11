import { useSearchParams } from 'react-router';
import { TICKET_STATUSES, type TicketStatus } from '../../domain/ticket';
import type { TicketQuery, TicketSortField } from '../../domain/TicketRepository';

const PAGE_SIZE = 20;
const SORT_FIELDS: readonly TicketSortField[] = ['createdAt', 'id', 'status'];

type Changes = Partial<Pick<TicketQuery, 'page' | 'search' | 'status' | 'sort'>>;

/**
 * Ticket list state lives in the URL, so reload / back-navigation from the detail page
 * restores the same view and links can be shared.
 */
export function useTicketListParams() {
  const [params, setParams] = useSearchParams();

  const status = params.get('status');
  const sortField = params.get('sort');
  const query: TicketQuery = {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZE,
    search: params.get('q') ?? undefined,
    status: TICKET_STATUSES.find((s): s is TicketStatus => s === status),
    sort: {
      field: SORT_FIELDS.find((f) => f === sortField) ?? 'createdAt',
      direction: params.get('dir') === 'asc' ? 'asc' : 'desc',
    },
  };

  const update = (changes: Changes) => {
    const next = { ...query, page: 1, ...changes };
    const entries: Record<string, string | undefined> = {
      page: next.page > 1 ? String(next.page) : undefined,
      q: next.search || undefined,
      status: next.status,
      sort: next.sort.field === 'createdAt' ? undefined : next.sort.field,
      dir: next.sort.direction === 'desc' ? undefined : next.sort.direction,
    };
    setParams(
      Object.fromEntries(Object.entries(entries).filter(([, v]) => v !== undefined)) as Record<
        string,
        string
      >,
    );
  };

  return { query, update };
}
