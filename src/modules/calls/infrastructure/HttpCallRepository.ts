import { ApiError, type HttpClient } from '@/shared/http';
import type { SubjectNode, SubjectPath } from '@/shared/domain/insights';
import type { Page } from '@/shared/domain/pagination';
import { subjectTree } from '@/mocks/reference';
import { mapCrmCallToCall, type CrmCall } from '../domain/crmCall';
import type { Call, IncomingCall } from '../domain/call';
import type {
  CallFilter,
  CallFilterOptions,
  CallQuery,
  CallRepository,
  CallSummary,
} from '../domain/CallRepository';

type CallPageDto = {
  items: CrmCall[];
  total: number;
  page: number;
  pageSize: number;
};

const toTree = (tree: Record<string, Record<string, string[]>>): SubjectNode[] =>
  Object.entries(tree).map(([label, children]) => ({
    label,
    children: Object.entries(children).map(([child, leaves]) => ({
      label: child,
      children: leaves.map((leaf) => ({ label: leaf, children: [] })),
    })),
  }));

const toQuery = (query: CallQuery | CallFilter) => {
  const page = 'page' in query ? query.page : undefined;
  const pageSize = 'pageSize' in query ? query.pageSize : undefined;
  const sort = 'sort' in query ? query.sort : undefined;

  return {
    page,
    pageSize,
    search: query.search,
    status: query.status,
    direction: query.direction,
    agent: query.agent,
    queue: query.queue,
    sentiment: query.sentiment,
    from: query.startedIn?.from?.toISOString(),
    to: query.startedIn?.to?.toISOString(),
    uncategorizedOnly: query.uncategorizedOnly,
    sort: sort?.field,
    dir: sort?.direction,
  };
};

/** Talks to VOC Panel Nest `/call` endpoints. */
export class HttpCallRepository implements CallRepository {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  async list(query: CallQuery): Promise<Page<Call>> {
    const page = await this.#http.get<CallPageDto>('/call', { query: toQuery(query) });
    return {
      items: page.items.map(mapCrmCallToCall),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  summarize(filter: CallFilter) {
    return this.#http.get<CallSummary>('/call/summary', { query: toQuery(filter) });
  }

  async getById(id: string): Promise<Call | null> {
    try {
      const raw = await this.#http.get<CrmCall>(`/call/${id}`);
      return mapCrmCallToCall(raw);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return null;
      throw error;
    }
  }

  getFilterOptions() {
    return this.#http.get<CallFilterOptions>('/call/filter-options');
  }

  async getSubjectTree(): Promise<SubjectNode[]> {
    return toTree(subjectTree);
  }

  async categorize(id: string, subject: SubjectPath): Promise<Call> {
    const call = await this.getById(id);
    if (!call) throw new Error(`Call ${id} not found`);
    return { ...call, subject };
  }

  subscribeIncoming(_listener: (call: IncomingCall) => void) {
    return () => undefined;
  }
}
