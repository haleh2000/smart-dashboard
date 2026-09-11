import type { Call } from '@/modules/calls';
import type { Ticket } from '@/modules/tickets';
import { customerOfCall, mockCalls } from '@/mocks/calls';
import { delay } from '@/mocks/delay';
import { mockTickets } from '@/mocks/tickets';
import { isWithinRange } from '@/shared/domain/period';
import type {
  BreakdownItem,
  CallStats,
  CrossBreakdown,
  Heatmap,
  Kpis,
  OperatorStats,
  RepeatCallStats,
  SubjectLineTable,
  SubjectRow,
  Trend,
} from '../domain/analytics';
import type { AnalyticsRepository } from '../domain/AnalyticsRepository';
import { persianWeekday, type DashboardScope, type Dimension } from '../domain/filters';

type Accessor<T> = Record<Dimension, (record: T) => string | undefined>;

const ticketValue: Accessor<Ticket> = {
  subject1: (t) => t.subject.level1,
  subject2: (t) => t.subject.level2,
  subject3: (t) => t.subject.level3,
  type: (t) => t.type,
  channel: (t) => t.channel,
  insuranceLine: (t) => t.insuranceLine,
  branch: (t) => t.branch,
  sentiment: (t) => t.enrichment?.sentiment,
  operator: (t) => t.followUpOwner,
  weekday: (t) => String(persianWeekday(t.createdAt)),
  hour: (t) => String(t.createdAt.getHours()),
};

const callValue: Accessor<Call> = {
  subject1: (c) => c.subject?.level1,
  subject2: (c) => c.subject?.level2,
  subject3: (c) => c.subject?.level3,
  type: () => 'گفت‌وگو',
  channel: () => 'تلفن',
  insuranceLine: (c) => customerOfCall(c)?.policies[0]?.line,
  branch: (c) => customerOfCall(c)?.branch,
  sentiment: (c) => c.analysis?.sentiment,
  operator: (c) => c.agent,
  weekday: (c) => String(persianWeekday(c.startedAt)),
  hour: (c) => String(c.startedAt.getHours()),
};

/** Joins a subject path into one grouping key (subjects never contain it). */
const SEP = '\u241f';
const WEEK = 7 * 24 * 60 * 60 * 1000;
const average = (values: readonly number[]) =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
const ratio = (part: number, whole: number) => (whole ? part / whole : 0);
const seconds = (from: Date, to: Date) => (to.getTime() - from.getTime()) / 1000;

const countBy = <T>(items: readonly T[], key: (item: T) => string | undefined) => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = key(item);
    if (value !== undefined) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
};

const sortedEntries = (counts: Map<string, number>) =>
  [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/** Aggregates the in-memory dataset the way the backend is expected to. */
export class MockAnalyticsRepository implements AnalyticsRepository {
  private readonly tickets: Ticket[];
  private readonly calls: Call[];

  constructor(tickets: Ticket[] = mockTickets, calls: Call[] = mockCalls) {
    this.tickets = tickets;
    this.calls = calls;
  }

  private filterTickets({ filters, range }: DashboardScope) {
    const active = Object.entries(filters) as [Dimension, string][];
    return this.tickets.filter(
      (ticket) =>
        isWithinRange(ticket.createdAt, range) &&
        active.every(([dimension, value]) => ticketValue[dimension](ticket) === value),
    );
  }

  private filterCalls({ filters, range }: DashboardScope) {
    const active = Object.entries(filters) as [Dimension, string][];
    return this.calls.filter(
      (call) =>
        isWithinRange(call.startedAt, range) &&
        active.every(([dimension, value]) => callValue[dimension](call) === value),
    );
  }

  async getKpis(scope: DashboardScope): Promise<Kpis> {
    await delay(200);
    const tickets = this.filterTickets(scope);
    const calls = this.filterCalls(scope);
    const closed = tickets.filter((t) => t.status === 'closed');
    const answered = calls.filter((c) => c.status === 'answered');
    const perCaller = countBy(calls, (c) => c.caller.mobile);
    const resolutionTimes = closed.flatMap((t) =>
      t.closedAt ? [seconds(t.createdAt, t.closedAt)] : [],
    );

    return {
      total: tickets.length,
      open: tickets.length - closed.length,
      inReview: tickets.filter((t) => t.status === 'inProgress' || t.status === 'underReview')
        .length,
      closed: closed.length,
      resolutionRate: ratio(closed.length, tickets.length),
      overdue: tickets.filter((t) => t.status !== 'closed' && t.slaRemainingDays < 0).length,
      fcrRate: ratio(answered.filter((c) => c.resolvedOnFirstCall).length, answered.length),
      repeatCallRate: ratio([...perCaller.values()].filter((n) => n > 1).length, perCaller.size),
      avgResolutionSec: average(resolutionTimes),
    };
  }

  async getBreakdown(dimension: Dimension, scope: DashboardScope): Promise<BreakdownItem[]> {
    await delay(200);
    const counts = countBy(this.filterTickets(scope), ticketValue[dimension]);
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    return sortedEntries(counts).map(([value, count]) => ({
      value,
      count,
      share: ratio(count, total),
    }));
  }

  async getCrossBreakdown(
    rowDimension: Dimension,
    columnDimension: Dimension,
    scope: DashboardScope,
  ): Promise<CrossBreakdown> {
    await delay(200);
    const tickets = this.filterTickets(scope);
    const columns = sortedEntries(countBy(tickets, ticketValue[columnDimension])).map(([v]) => v);
    const rows = sortedEntries(countBy(tickets, ticketValue[rowDimension])).map(
      ([value, total]) => {
        const inRow = tickets.filter((t) => ticketValue[rowDimension](t) === value);
        const cells = countBy(inRow, ticketValue[columnDimension]);
        return {
          value,
          total,
          cells: columns.map((column) => ({ value: column, count: cells.get(column) ?? 0 })),
        };
      },
    );
    return { columns, rows };
  }

  async getSubjectTable(scope: DashboardScope): Promise<SubjectRow[]> {
    await delay(200);
    const tickets = this.filterTickets(scope);
    const counts = countBy(tickets, (t) =>
      [t.subject.level1, t.subject.level2, t.subject.level3].join(SEP),
    );
    return sortedEntries(counts).map(([key, count]) => {
      const [subject1 = '', subject2 = '', subject3 = ''] = key.split(SEP);
      const share = ratio(count, tickets.length);
      return { subject1, subject2, subject3, count, share, importance: share >= 0.05 ? 1 : 2 };
    });
  }

  async getSubjectLineTable(scope: DashboardScope): Promise<SubjectLineTable> {
    await delay(200);
    const tickets = this.filterTickets(scope);
    const lineCounts = countBy(tickets, (t) => t.insuranceLine);
    const lines = sortedEntries(lineCounts).map(([line]) => line);
    const groups = new Map<string, Ticket[]>();
    for (const ticket of tickets) {
      const key = [ticket.subject.level1, ticket.subject.level2, ticket.subject.level3].join(SEP);
      groups.set(key, [...(groups.get(key) ?? []), ticket]);
    }
    const rows = [...groups]
      .map(([key, group]) => {
        const [subject1 = '', subject2 = '', subject3 = ''] = key.split(SEP);
        const perLine = countBy(group, (t) => t.insuranceLine);
        return {
          subject1,
          subject2,
          subject3,
          share: ratio(group.length, tickets.length),
          lineShares: Object.fromEntries(
            lines.map((line) => [line, ratio(perLine.get(line) ?? 0, group.length)]),
          ),
        };
      })
      .sort((a, b) => b.share - a.share);
    return {
      lines,
      rows,
      totals: Object.fromEntries(
        lines.map((line) => [line, ratio(lineCounts.get(line) ?? 0, tickets.length)]),
      ),
    };
  }

  async getTrend(dimension: Dimension, scope: DashboardScope): Promise<Trend> {
    await delay(200);
    const tickets = this.filterTickets(scope);
    const series = sortedEntries(countBy(tickets, ticketValue[dimension])).map(([v]) => v);
    const end =
      scope.range?.to.getTime() ??
      Math.max(Date.now(), ...tickets.map((t) => t.createdAt.getTime() + 1));
    const earliest =
      scope.range?.from.getTime() ??
      Math.min(end - WEEK, ...tickets.map((t) => t.createdAt.getTime()));
    const weeks = Math.min(12, Math.max(1, Math.ceil((end - earliest) / WEEK)));
    const buckets = Array.from({ length: weeks }, (_, i) => {
      const start = end - (weeks - i) * WEEK;
      const inBucket = tickets.filter((t) => {
        const time = t.createdAt.getTime();
        return time >= start && time < start + WEEK;
      });
      const counts = countBy(inBucket, ticketValue[dimension]);
      return {
        start: new Date(start),
        counts: Object.fromEntries(series.map((value) => [value, counts.get(value) ?? 0])),
      };
    });
    return { series, buckets };
  }

  async getOperatorStats(scope: DashboardScope): Promise<OperatorStats[]> {
    await delay(200);
    const tickets = this.filterTickets(scope);
    const calls = this.filterCalls(scope);
    const operators = new Set([
      ...tickets.map((t) => t.followUpOwner),
      ...calls.flatMap((c) => (c.agent ? [c.agent] : [])),
    ]);
    return [...operators]
      .map((operator) => {
        const own = tickets.filter((t) => t.followUpOwner === operator);
        const answered = calls.filter((c) => c.agent === operator && c.status === 'answered');
        const handled = calls.filter((c) => c.agent === operator);
        const sentiments = [
          ...own.flatMap((t) => (t.enrichment ? [t.enrichment.sentiment] : [])),
          ...handled.flatMap((c) => (c.analysis ? [c.analysis.sentiment] : [])),
        ];
        return {
          operator,
          ticketCount: own.length,
          closedTicketCount: own.filter((t) => t.status === 'closed').length,
          callCount: handled.length,
          avgFirstResponseSec: average(
            own.flatMap((t) =>
              t.firstResponseAt ? [seconds(t.createdAt, t.firstResponseAt)] : [],
            ),
          ),
          avgHandlingSec: average(answered.map((c) => c.durationSec)),
          fcrRate: ratio(answered.filter((c) => c.resolvedOnFirstCall).length, answered.length),
          positiveShare: ratio(
            sentiments.filter((s) => s === 'positive').length,
            sentiments.length,
          ),
        };
      })
      .sort((a, b) => b.ticketCount + b.callCount - (a.ticketCount + a.callCount));
  }

  async getCallStats(scope: DashboardScope): Promise<CallStats> {
    await delay(200);
    const calls = this.filterCalls(scope);
    const by = (status: Call['status']) => calls.filter((c) => c.status === status);
    const answered = by('answered');
    const missed = by('missed');
    const inbound = calls.filter((c) => c.direction === 'inbound');
    return {
      incoming: inbound.length,
      ringing: by('ringing').length,
      ongoing: by('ongoing').length,
      answered: answered.length,
      missed: missed.length,
      answerRate: ratio(answered.length, answered.length + missed.length),
      avgWaitSec: average(calls.filter((c) => c.status !== 'ringing').map((c) => c.waitSec)),
      avgTalkSec: average(answered.map((c) => c.durationSec)),
    };
  }

  async getCallHeatmap(scope: DashboardScope): Promise<Heatmap> {
    await delay(200);
    const counts = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const call of this.filterCalls(scope)) {
      const row = counts[persianWeekday(call.startedAt)]!;
      const hour = call.startedAt.getHours();
      row[hour] = (row[hour] ?? 0) + 1;
    }
    return { counts, max: Math.max(0, ...counts.flat()) };
  }

  async getRepeatCalls(scope: DashboardScope): Promise<RepeatCallStats> {
    await delay(200);
    const calls = this.filterCalls(scope).filter(
      (c) => c.status === 'answered' || c.status === 'missed',
    );
    const byCaller = new Map<string, Call[]>();
    for (const call of calls)
      byCaller.set(call.caller.mobile, [...(byCaller.get(call.caller.mobile) ?? []), call]);
    const groups = [...byCaller.values()].map((group) =>
      [...group].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime()),
    );
    const buckets = { '1': 0, '2': 0, '3': 0, '4+': 0 };
    const timesToResolve: number[] = [];
    for (const group of groups) {
      const n = group.length;
      buckets[n >= 4 ? '4+' : (String(n) as '1' | '2' | '3')] += 1;
      const resolving = group.find((c) => c.resolvedOnFirstCall);
      if (resolving && group[0])
        timesToResolve.push(seconds(group[0].startedAt, resolving.startedAt));
    }
    return {
      repeatRate: ratio(groups.filter((g) => g.length > 1).length, groups.length),
      avgCallsPerCustomer: ratio(calls.length, groups.length),
      avgTimeToResolveSec: average(timesToResolve),
      distribution: (['1', '2', '3', '4+'] as const).map((bucket) => ({
        bucket,
        customers: buckets[bucket],
      })),
    };
  }
}
