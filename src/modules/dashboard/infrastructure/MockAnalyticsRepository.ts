import { reportedSubject, subjectAgreement, type Call, type CallAnalysis } from '@/modules/calls';
import type { Ticket } from '@/modules/tickets';
import { customerOfCall, mockCalls } from '@/mocks/calls';
import { delay } from '@/mocks/delay';
import { mockTickets } from '@/mocks/tickets';
import {
  SENTIMENTS,
  sentimentScore,
  sentimentShift,
  type Sentiment,
} from '@/shared/domain/insights';
import { isWithinRange } from '@/shared/domain/period';
import type {
  BreakdownItem,
  CallReasons,
  CallStats,
  CrossBreakdown,
  Heatmap,
  Kpis,
  OperatorStats,
  ReasonNode,
  RepeatCallStats,
  ResolutionStep,
  SentimentOverview,
  SentimentSplit,
  SubjectDetectionStats,
  SubjectLineTable,
  SubjectRow,
  Trend,
} from '../domain/analytics';
import type { AnalyticsRepository } from '../domain/AnalyticsRepository';
import { classifySentimentLevel } from '../domain/sentimentLevels';
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
  sentimentLevel: (t) => {
    const lines = t.enrichment?.transcript;
    const customerSentiments = lines
      ?.filter((l) => l.speaker === 'customer' && l.sentiment)
      .map((l) => l.sentiment!);
    const score = sentimentScore(customerSentiments ?? []);
    return classifySentimentLevel(t.enrichment?.sentiment, score);
  },
  operator: (t) => t.followUpOwner,
  weekday: (t) => String(persianWeekday(t.createdAt)),
  hour: (t) => String(t.createdAt.getHours()),
};

// Calls the operator has not categorized yet are reported under the AI's detected subject.
const callValue: Accessor<Call> = {
  subject1: (c) => reportedSubject(c)?.level1,
  subject2: (c) => reportedSubject(c)?.level2,
  subject3: (c) => reportedSubject(c)?.level3,
  type: () => 'گفت‌وگو',
  channel: () => 'تلفن',
  insuranceLine: (c) => customerOfCall(c)?.policies[0]?.line,
  branch: (c) => customerOfCall(c)?.branch,
  sentiment: (c) => c.analysis?.sentiment,
  sentimentLevel: (c) => {
    const customerSentiments = c.transcript
      .filter((l) => l.speaker === 'customer' && l.sentiment)
      .map((l) => l.sentiment!);
    const score = sentimentScore(customerSentiments);
    return classifySentimentLevel(c.analysis?.sentiment, score);
  },
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

const groupBy = <T>(items: readonly T[], key: (item: T) => string | undefined) => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const value = key(item);
    if (value === undefined) continue;
    const group = groups.get(value);
    if (group) group.push(item);
    else groups.set(value, [item]);
  }
  return groups;
};

type Analyzed = Call & { analysis: CallAnalysis };
const isAnalyzed = (call: Call): call is Analyzed => call.analysis !== undefined;

const split = (values: readonly Sentiment[]): SentimentSplit => ({
  positive: values.filter((s) => s === 'positive').length,
  neutral: values.filter((s) => s === 'neutral').length,
  negative: values.filter((s) => s === 'negative').length,
  score: sentimentScore(values),
});

/** Weekly buckets ending at the range end (or now), at most 12, oldest first. */
const weekStarts = (range: DashboardScope['range'], dates: readonly Date[]) => {
  const end = range?.to.getTime() ?? Math.max(Date.now(), ...dates.map((d) => d.getTime() + 1));
  const earliest = range?.from.getTime() ?? Math.min(end - WEEK, ...dates.map((d) => d.getTime()));
  const weeks = Math.min(12, Math.max(1, Math.ceil((end - earliest) / WEEK)));
  return Array.from({ length: weeks }, (_, i) => end - (weeks - i) * WEEK);
};

/** One issue = one caller's calls about one main subject, oldest first. */
const issuesOf = (calls: readonly Call[]) =>
  [
    ...groupBy(calls, (c) => `${c.caller.mobile}${SEP}${reportedSubject(c)?.level1 ?? ''}`).values(),
  ].map((group) => [...group].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime()));

const LEVELS = ['level1', 'level2', 'level3'] as const;
const UNKNOWN = 'نامشخص';

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
    const starts = weekStarts(
      scope.range,
      tickets.map((t) => t.createdAt),
    );
    const buckets = starts.map((start) => {
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
    for (const group of groups) {
      const n = group.length;
      buckets[n >= 4 ? '4+' : (String(n) as '1' | '2' | '3')] += 1;
    }

    const issues = issuesOf(calls);
    const steps: Record<ResolutionStep, number> = { '1': 0, '2': 0, '3': 0, '4+': 0, open: 0 };
    const timesToResolve: number[] = [];
    const callsToResolve: number[] = [];
    for (const issue of issues) {
      const index = issue.findIndex((c) => c.resolvedOnFirstCall);
      const resolving = issue[index];
      if (!resolving || !issue[0]) {
        steps.open += 1;
        continue;
      }
      steps[index >= 3 ? '4+' : (String(index + 1) as '1' | '2' | '3')] += 1;
      callsToResolve.push(index + 1);
      timesToResolve.push(seconds(issue[0].startedAt, resolving.startedAt));
    }

    // Missed calls carry no subject: their issues are grouped as «نامشخص».
    const byReason = [...groupBy(issues, (issue) => reportedSubject(issue[0]!)?.level1 ?? UNKNOWN)]
      .map(([subject, group]) => ({
        subject,
        issues: group.length,
        repeatRate: ratio(group.filter((issue) => issue.length > 1).length, group.length),
        avgCalls: ratio(
          group.reduce((sum, issue) => sum + issue.length, 0),
          group.length,
        ),
      }))
      .sort((a, b) => b.repeatRate - a.repeatRate || b.issues - a.issues);

    return {
      repeatRate: ratio(groups.filter((g) => g.length > 1).length, groups.length),
      avgCallsPerCustomer: ratio(calls.length, groups.length),
      avgTimeToResolveSec: average(timesToResolve),
      distribution: (['1', '2', '3', '4+'] as const).map((bucket) => ({
        bucket,
        customers: buckets[bucket],
      })),
      resolution: (['1', '2', '3', '4+', 'open'] as const).map((step) => ({
        step,
        issues: steps[step],
      })),
      avgCallsToResolve: average(callsToResolve),
      byReason,
    };
  }

  async getSentimentOverview(scope: DashboardScope): Promise<SentimentOverview> {
    await delay(200);
    const calls = this.filterCalls(scope).filter(isAnalyzed);
    const customerOf = (c: Analyzed) => c.analysis.sentiment;
    const agentOf = (c: Analyzed) => c.analysis.agentSentiment;
    const scores = (group: readonly Analyzed[]) => ({
      count: group.length,
      customerScore: sentimentScore(group.map(customerOf)),
      agentScore: sentimentScore(group.map(agentOf)),
    });

    const matrix = Object.fromEntries(
      SENTIMENTS.map((customer) => [
        customer,
        Object.fromEntries(
          SENTIMENTS.map((agent) => [
            agent,
            calls.filter((c) => customerOf(c) === customer && agentOf(c) === agent).length,
          ]),
        ),
      ]),
    ) as SentimentOverview['matrix'];

    const shifts = calls.map((c) => sentimentShift(c.transcript, 'customer'));
    const trend = weekStarts(
      scope.range,
      calls.map((c) => c.startedAt),
    ).map((start) => ({
      start: new Date(start),
      ...scores(
        calls.filter((c) => {
          const time = c.startedAt.getTime();
          return time >= start && time < start + WEEK;
        }),
      ),
    }));

    return {
      analyzed: calls.length,
      customer: split(calls.map(customerOf)),
      agent: split(calls.map(agentOf)),
      matrix,
      journey: {
        improved: shifts.filter((s) => s === 'improved').length,
        unchanged: shifts.filter((s) => s === 'unchanged').length,
        worsened: shifts.filter((s) => s === 'worsened').length,
      },
      trend,
      bySubject: [...groupBy(calls, (c) => reportedSubject(c)?.level1)]
        .map(([subject, group]) => ({ subject, ...scores(group) }))
        .sort((a, b) => b.count - a.count),
      byOperator: [...groupBy(calls, (c) => c.agent)]
        .map(([operator, group]) => ({
          operator,
          ...scores(group),
          improvedShare: ratio(
            group.filter((c) => sentimentShift(c.transcript, 'customer') === 'improved').length,
            group.length,
          ),
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async getSubjectDetection(scope: DashboardScope): Promise<SubjectDetectionStats> {
    await delay(200);
    const calls = this.filterCalls(scope).filter(isAnalyzed);
    const agreementOf = (c: Analyzed) => subjectAgreement(c.subject, c.analysis.detectedSubject);
    const count = (agreement: string) => calls.filter((c) => agreementOf(c) === agreement).length;
    const confidence = (c: Analyzed) => c.analysis.detectionConfidence;
    const band = (c: Analyzed) => {
      const value = confidence(c);
      return value < 0.6 ? 'low' : value < 0.75 ? 'medium' : value < 0.9 ? 'high' : 'veryHigh';
    };
    const disagreements = calls.filter((c) => agreementOf(c) === 'mismatch');

    return {
      analyzed: calls.length,
      match: count('match'),
      partial: count('partial'),
      mismatch: count('mismatch'),
      pending: count('pending'),
      avgConfidence: average(calls.map(confidence)),
      bySubject: [...groupBy(calls, (c) => c.analysis.detectedSubject.level1)]
        .map(([subject, group]) => {
          const reviewed = group.filter((c) => agreementOf(c) !== 'pending');
          return {
            subject,
            count: group.length,
            agreement: ratio(
              reviewed.filter((c) => agreementOf(c) === 'match').length,
              reviewed.length,
            ),
            avgConfidence: average(group.map(confidence)),
          };
        })
        .sort((a, b) => b.count - a.count),
      confusions: sortedEntries(
        countBy(
          disagreements,
          (c) => `${c.subject?.level1 ?? ''}${SEP}${c.analysis.detectedSubject.level1}`,
        ),
      )
        .slice(0, 6)
        .map(([key, n]) => {
          const [agent = '', ai = ''] = key.split(SEP);
          return { agent, ai, count: n };
        }),
      confidenceBands: (['low', 'medium', 'high', 'veryHigh'] as const).map((b) => ({
        band: b,
        count: calls.filter((c) => band(c) === b).length,
      })),
    };
  }

  async getCallReasons(scope: DashboardScope): Promise<CallReasons> {
    await delay(200);
    const calls = this.filterCalls(scope).filter((c) => reportedSubject(c) !== undefined);
    const repeatIssues = new Set(issuesOf(calls).flatMap((issue) => (issue.length > 1 ? issue : [])));

    const nodesAt = (group: readonly Call[], depth: number): ReasonNode[] => {
      const level = LEVELS[depth];
      if (!level) return [];
      return [...groupBy(group, (c) => reportedSubject(c)?.[level])]
        .map(([label, members]) => {
          const analyzed = members.filter(isAnalyzed);
          const answered = members.filter((c) => c.status === 'answered');
          return {
            label,
            count: members.length,
            share: ratio(members.length, calls.length),
            negativeShare: ratio(
              analyzed.filter((c) => c.analysis.sentiment === 'negative').length,
              analyzed.length,
            ),
            fcrRate: ratio(answered.filter((c) => c.resolvedOnFirstCall).length, answered.length),
            repeatShare: ratio(members.filter((c) => repeatIssues.has(c)).length, members.length),
            children: nodesAt(members, depth + 1),
          };
        })
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    };

    return {
      total: calls.length,
      aiOnly: calls.filter((c) => !c.subject).length,
      nodes: nodesAt(calls, 0),
    };
  }
}
