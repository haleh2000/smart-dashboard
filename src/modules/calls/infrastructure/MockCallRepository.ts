import { mockCalls } from '@/mocks/calls';
import { delay } from '@/mocks/delay';
import { subjectTree } from '@/mocks/reference';
import type { SubjectNode, SubjectPath } from '@/shared/domain/insights';
import type { Page } from '@/shared/domain/pagination';
import { isWithinRange } from '@/shared/domain/period';
import { subjectAgreement, type Call } from '../domain/call';
import type {
  CallFilter,
  CallQuery,
  CallRepository,
  CallSortField,
  CallSummary,
} from '../domain/CallRepository';
import { subscribeToFeed } from './incomingFeed';

const matchesSearch = (call: Call, term: string) =>
  [call.id, call.caller.mobile, call.caller.nationalId, call.caller.fullName].some((value) =>
    value?.includes(term),
  );

const sortValue: Record<CallSortField, (call: Call) => number | string> = {
  startedAt: (c) => c.startedAt.getTime(),
  durationSec: (c) => c.durationSec,
  waitSec: (c) => c.waitSec,
  status: (c) => c.status,
  agent: (c) => c.agent ?? '',
};

const compare = (a: Call, b: Call, field: CallSortField) => {
  const left = sortValue[field](a);
  const right = sortValue[field](b);
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'fa');
};

const distinct = (values: (string | undefined)[]) =>
  [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b, 'fa'),
  );

const toTree = (): SubjectNode[] =>
  Object.entries(subjectTree).map(([level1, level2s]) => ({
    label: level1,
    children: Object.entries(level2s).map(([level2, level3s]) => ({
      label: level2,
      children: level3s.map((level3) => ({ label: level3, children: [] })),
    })),
  }));

/** Calls added by the dev simulator, shared by every repository instance (it's one fake backend). */
const simulatedCalls: Call[] = [];

export const addSimulatedCall = (call: Call) => {
  simulatedCalls.unshift(call);
};

/** In-memory adapter. Filtering/sorting/paging here mimics what the backend is expected to do. */
export class MockCallRepository implements CallRepository {
  private calls: Call[];

  constructor(calls: Call[] = mockCalls) {
    this.calls = [...calls];
  }

  private all() {
    return [...simulatedCalls, ...this.calls];
  }

  private filter(query: CallFilter) {
    const term = query.search?.trim();
    return this.all().filter(
      (call) =>
        (!term || matchesSearch(call, term)) &&
        (!query.status || call.status === query.status) &&
        (!query.direction || call.direction === query.direction) &&
        (!query.agent || call.agent === query.agent) &&
        (!query.queue || call.queue === query.queue) &&
        (!query.sentiment || call.analysis?.sentiment === query.sentiment) &&
        isWithinRange(call.startedAt, query.startedIn) &&
        (!query.uncategorizedOnly || (call.status === 'answered' && !call.subject)),
    );
  }

  async list(query: CallQuery): Promise<Page<Call>> {
    await delay();
    const { page, pageSize, sort } = query;
    const direction = sort.direction === 'asc' ? 1 : -1;
    const filtered = this.filter(query).sort((a, b) => compare(a, b, sort.field) * direction);

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async summarize(query: CallFilter): Promise<CallSummary> {
    await delay(150);
    const calls = this.filter(query);
    const answered = calls.filter((c) => c.status === 'answered');
    const analyzed = calls.filter((c) => c.analysis);
    const reviewed = analyzed.filter((c) => c.subject);
    const average = (values: number[]) =>
      values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    const ratio = (part: number, whole: number) => (whole ? part / whole : 0);
    return {
      total: calls.length,
      answered: answered.length,
      missed: calls.filter((c) => c.status === 'missed').length,
      live: calls.filter((c) => c.status === 'ringing' || c.status === 'ongoing').length,
      avgWaitSec: average(calls.filter((c) => c.status !== 'ringing').map((c) => c.waitSec)),
      avgTalkSec: average(answered.map((c) => c.durationSec)),
      negativeShare: ratio(
        analyzed.filter((c) => c.analysis?.sentiment === 'negative').length,
        analyzed.length,
      ),
      uncategorized: answered.filter((c) => !c.subject).length,
      aiAgreement: ratio(
        reviewed.filter(
          (c) => subjectAgreement(c.subject, c.analysis!.detectedSubject) === 'match',
        ).length,
        reviewed.length,
      ),
    };
  }

  async getById(id: string) {
    await delay();
    return this.all().find((call) => call.id === id) ?? null;
  }

  async getFilterOptions() {
    await delay(100);
    const all = this.all();
    return {
      agents: distinct(all.map((call) => call.agent)),
      queues: distinct(all.map((call) => call.queue)),
    };
  }

  async getSubjectTree() {
    await delay(100);
    return toTree();
  }

  async categorize(id: string, subject: SubjectPath) {
    await delay(300);
    const update = (list: Call[]) => {
      const index = list.findIndex((call) => call.id === id);
      if (index === -1) return undefined;
      const updated = { ...list[index]!, subject };
      list[index] = updated;
      return updated;
    };
    const updated = update(simulatedCalls) ?? update(this.calls);
    if (!updated) throw new Error(`Call ${id} not found`);
    return updated;
  }

  subscribeIncoming(listener: Parameters<CallRepository['subscribeIncoming']>[0]) {
    return subscribeToFeed(listener);
  }
}
