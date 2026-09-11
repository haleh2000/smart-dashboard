import { useSearchParams } from 'react-router';
import {
  CUSTOMER_KINDS,
  CUSTOMER_STATUSES,
  type CustomerKind,
  type CustomerStatus,
} from '../../domain/customer';
import {
  CUSTOMER_SORT_FIELDS,
  type CustomerQuery,
  type CustomerSortField,
} from '../../domain/CustomerRepository';

const PAGE_SIZE = 20;
const DEFAULT_SORT: CustomerSortField = 'lastInteractionAt';

type Changes = Partial<
  Pick<CustomerQuery, 'page' | 'search' | 'status' | 'kind' | 'vipOnly' | 'sort'>
>;

/** Customer list state lives in the URL so reload / back-navigation restores the view. */
export function useCustomerListParams() {
  const [params, setParams] = useSearchParams();

  const status = params.get('status');
  const kind = params.get('kind');
  const sortField = params.get('sort');
  const query: CustomerQuery = {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZE,
    search: params.get('q') ?? undefined,
    status: CUSTOMER_STATUSES.find((s): s is CustomerStatus => s === status),
    kind: CUSTOMER_KINDS.find((k): k is CustomerKind => k === kind),
    vipOnly: params.get('vip') === '1' || undefined,
    sort: {
      field: CUSTOMER_SORT_FIELDS.find((f) => f === sortField) ?? DEFAULT_SORT,
      direction: params.get('dir') === 'asc' ? 'asc' : 'desc',
    },
  };

  const update = (changes: Changes) => {
    const next = { ...query, page: 1, ...changes };
    const entries: Record<string, string | undefined> = {
      page: next.page > 1 ? String(next.page) : undefined,
      q: next.search || undefined,
      status: next.status,
      kind: next.kind,
      vip: next.vipOnly ? '1' : undefined,
      sort: next.sort.field === DEFAULT_SORT ? undefined : next.sort.field,
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
