import { useSearchParams } from 'react-router';
import { SENTIMENTS, type Sentiment } from '@/shared/domain/insights';
import { isPeriod, periodRange, type Period } from '@/shared/domain/period';
import type { Sort } from '@/shared/domain/pagination';
import {
  CALL_DIRECTIONS,
  CALL_STATUSES,
  type CallDirection,
  type CallStatus,
} from '../../domain/call';
import { CALL_SORT_FIELDS, type CallQuery, type CallSortField } from '../../domain/CallRepository';

const PAGE_SIZE = 20;
const DEFAULT_PERIOD: Period = 'all';

/** The URL-backed view state; `period` is kept as a preset key and turned into dates per query. */
export interface CallListState {
  page: number;
  search?: string;
  status?: CallStatus;
  direction?: CallDirection;
  agent?: string;
  queue?: string;
  sentiment?: Sentiment;
  period: Period;
  uncategorizedOnly: boolean;
  sort: Sort<CallSortField>;
}

const pick = <T extends string>(values: readonly T[], value: string | null) =>
  values.find((v) => v === value);

/**
 * Call list state lives in the URL, so reload / back-navigation from the detail page restores
 * the same view and links can be shared.
 */
export function useCallListParams() {
  const [params, setParams] = useSearchParams();

  const periodParam = params.get('period');
  const state: CallListState = {
    page: Math.max(1, Number(params.get('page')) || 1),
    search: params.get('q') ?? undefined,
    status: pick(CALL_STATUSES, params.get('status')),
    direction: pick(CALL_DIRECTIONS, params.get('direction')),
    agent: params.get('agent') ?? undefined,
    queue: params.get('queue') ?? undefined,
    sentiment: pick(SENTIMENTS, params.get('sentiment')),
    period: isPeriod(periodParam) ? periodParam : DEFAULT_PERIOD,
    uncategorizedOnly: params.get('uncategorized') === '1',
    sort: {
      field: pick(CALL_SORT_FIELDS, params.get('sort')) ?? 'startedAt',
      direction: params.get('dir') === 'asc' ? 'asc' : 'desc',
    },
  };

  const { period, ...rest } = state;
  const query: CallQuery = { ...rest, pageSize: PAGE_SIZE, startedIn: periodRange(period) };

  const update = (changes: Partial<CallListState>) => {
    const next = { ...state, page: 1, ...changes };
    const entries: Record<string, string | undefined> = {
      page: next.page > 1 ? String(next.page) : undefined,
      q: next.search || undefined,
      status: next.status,
      direction: next.direction,
      agent: next.agent,
      queue: next.queue,
      sentiment: next.sentiment,
      period: next.period === DEFAULT_PERIOD ? undefined : next.period,
      uncategorized: next.uncategorizedOnly ? '1' : undefined,
      sort: next.sort.field === 'startedAt' ? undefined : next.sort.field,
      dir: next.sort.direction === 'desc' ? undefined : next.sort.direction,
    };
    setParams(
      Object.fromEntries(Object.entries(entries).filter(([, v]) => v !== undefined)) as Record<
        string,
        string
      >,
    );
  };

  const reset = () => setParams({});

  const isFiltered = Boolean(
    state.search ||
    state.status ||
    state.direction ||
    state.agent ||
    state.queue ||
    state.sentiment ||
    state.period !== DEFAULT_PERIOD ||
    state.uncategorizedOnly,
  );

  return { state, query, update, reset, isFiltered };
}
