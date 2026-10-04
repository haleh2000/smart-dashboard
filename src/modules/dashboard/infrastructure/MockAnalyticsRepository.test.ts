import { mockCalls } from '@/mocks/calls';
import { mockTickets } from '@/mocks/tickets';
import { MockCallRepository, simulateIncomingCall } from '@/modules/calls';
import { MockTicketRepository, type TicketStatusFilter } from '@/modules/tickets';
import { periodRange } from '@/shared/domain/period';
import { MockAnalyticsRepository } from './MockAnalyticsRepository';

const repository = new MockAnalyticsRepository();
const all = { filters: {} };

describe('MockAnalyticsRepository', () => {
  it('returns a breakdown whose shares add up to 1, largest first', async () => {
    const items = await repository.getBreakdown('branch', all);

    expect(items.reduce((sum, i) => sum + i.count, 0)).toBe(mockTickets.length);
    expect(items.reduce((sum, i) => sum + i.share, 0)).toBeCloseTo(1);
    expect(items[0]!.count).toBeGreaterThanOrEqual(items.at(-1)!.count);
  });

  it('applies filters and the time range to KPIs', async () => {
    const everything = await repository.getKpis(all);
    const tehran = await repository.getKpis({ filters: { branch: 'تهران' } });
    const lastWeek = await repository.getKpis({ filters: {}, range: periodRange('7d') });

    expect(tehran.total).toBeLessThan(everything.total);
    expect(tehran.open + tehran.closed).toBe(tehran.total);
    expect(lastWeek.total).toBeLessThan(everything.total);
    expect(everything.fcrRate).toBeGreaterThan(0);
    expect(everything.fcrRate).toBeLessThanOrEqual(1);
  });

  it('reports the same figures the ticket table lists', async () => {
    const tickets = new MockTicketRepository();
    const listed = async (status?: TicketStatusFilter) =>
      (
        await tickets.list({
          page: 1,
          pageSize: 1,
          sort: { field: 'createdAt', direction: 'desc' },
          status,
        })
      ).total;
    const kpis = await repository.getKpis({ filters: {}, range: undefined });

    expect(kpis.total).toBe(await listed());
    expect(kpis.open).toBe(await listed('open'));
    expect(kpis.inReview).toBe(await listed('inReview'));
    expect(kpis.closed).toBe(await listed('closed'));
  });

  it('returns an hour-over-hour delta for every KPI key', async () => {
    const kpis = await repository.getKpis(all);

    expect(Object.keys(kpis.hourDelta).sort()).toEqual(
      [
        'avgResolutionSec',
        'closed',
        'fcrRate',
        'inReview',
        'open',
        'overdue',
        'repeatCallRate',
        'resolutionRate',
        'total',
      ].sort(),
    );
    // Mock tickets only ever gain age, so totals never drop hour over hour.
    expect(kpis.hourDelta.total).toBeGreaterThanOrEqual(0);
    expect(kpis.hourDelta.resolutionRate).toBeTypeOf('number');
  });

  it('splits every cross-breakdown row into its columns', async () => {
    const { rows, columns } = await repository.getCrossBreakdown('channel', 'type', all);

    expect(columns.length).toBeGreaterThan(1);
    for (const row of rows)
      expect(row.cells.reduce((sum, cell) => sum + cell.count, 0)).toBe(row.total);
  });

  it('ranks subject rows and marks the large ones as importance 1', async () => {
    const rows = await repository.getSubjectTable(all);

    expect(rows.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1);
    expect(rows.every((r) => (r.share >= 0.05 ? r.importance === 1 : r.importance === 2))).toBe(
      true,
    );
  });

  it('gives every subject × line row shares that add up to 1', async () => {
    const table = await repository.getSubjectLineTable(all);

    for (const row of table.rows)
      expect(Object.values(row.lineShares).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(Object.values(table.totals).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('counts every call exactly once in the heatmap', async () => {
    const heatmap = await repository.getCallHeatmap(all);

    expect(heatmap.counts).toHaveLength(7);
    expect(heatmap.counts.flat().reduce((a, b) => a + b, 0)).toBe(mockCalls.length);
  });

  it('narrows call figures to the selected operator', async () => {
    const [first] = await repository.getOperatorStats(all);
    const everyone = await repository.getCallStats(all);
    const one = await repository.getCallStats({ filters: { operator: first!.operator } });

    expect(one.answered).toBeGreaterThan(0);
    expect(one.answered).toBeLessThan(everyone.answered);
    expect(one.missed).toBe(0); // missed calls have no operator
  });

  it('buckets callers by how many times they called', async () => {
    const stats = await repository.getRepeatCalls(all);

    expect(stats.distribution.map((d) => d.bucket)).toEqual(['1', '2', '3', '4+']);
    expect(stats.repeatRate).toBeGreaterThan(0);
  });

  it('follows every issue to the call that solved it', async () => {
    const stats = await repository.getRepeatCalls(all);
    const issues = stats.resolution.reduce((sum, s) => sum + s.issues, 0);

    expect(stats.resolution.map((s) => s.step)).toEqual(['1', '2', '3', '4+', 'open']);
    expect(issues).toBe(stats.byReason.reduce((sum, r) => sum + r.issues, 0));
    expect(stats.avgCallsToResolve).toBeGreaterThanOrEqual(1);
  });

  it('scores both sides of every analyzed call', async () => {
    const overview = await repository.getSentimentOverview(all);
    const analyzed = mockCalls.filter((c) => c.analysis).length;
    const cells = Object.values(overview.matrix).flatMap((row) => Object.values(row));

    expect(overview.analyzed).toBe(analyzed);
    expect(overview.agent.positive + overview.agent.neutral + overview.agent.negative).toBe(
      analyzed,
    );
    expect(cells.reduce((a, b) => a + b, 0)).toBe(analyzed);
    expect(overview.journey.improved).toBeGreaterThan(0);
  });

  it('splits AI detection into match / partial / mismatch / pending', async () => {
    const stats = await repository.getSubjectDetection(all);

    expect(stats.match + stats.partial + stats.mismatch + stats.pending).toBe(stats.analyzed);
    expect(stats.match).toBeGreaterThan(stats.mismatch);
    expect(stats.avgConfidence).toBeGreaterThan(0.5);
  });

  it('builds a three-level reason tree whose children add up to their parent', async () => {
    const reasons = await repository.getCallReasons(all);

    expect(reasons.nodes.reduce((sum, n) => sum + n.count, 0)).toBe(reasons.total);
    for (const node of reasons.nodes) {
      expect(node.children.reduce((sum, n) => sum + n.count, 0)).toBe(node.count);
      for (const child of node.children)
        expect(child.children.reduce((sum, n) => sum + n.count, 0)).toBe(child.count);
    }
  });

  it('reports the same call figures the call table lists', async () => {
    const calls = new MockCallRepository();
    const summary = await calls.summarize({});
    const inbound = (
      await calls.list({
        page: 1,
        pageSize: 1,
        sort: { field: 'startedAt', direction: 'desc' },
        direction: 'inbound',
      })
    ).total;
    const stats = await repository.getCallStats(all);

    expect(stats.ringing + stats.ongoing).toBe(summary.live);
    expect(stats.answered).toBe(summary.answered);
    expect(stats.missed).toBe(summary.missed);
    expect(stats.avgWaitSec).toBe(summary.avgWaitSec);
    expect(stats.avgTalkSec).toBe(summary.avgTalkSec);
    expect(stats.answerRate).toBe(summary.answered / (summary.answered + summary.missed));
    expect(stats.incoming).toBe(inbound);
  });

  it('moves the call figures when the table gains a call, and stays equal to it', async () => {
    const calls = new MockCallRepository();
    const before = await repository.getCallStats(all);
    const tableBefore = await calls.summarize({});
    const incoming = simulateIncomingCall();

    try {
      const stats = await repository.getCallStats(all);
      const table = await calls.summarize({});

      expect(stats.ringing).toBe(before.ringing + 1);
      expect(stats.incoming).toBe(before.incoming + 1);
      expect(table.live).toBe(tableBefore.live + 1);
      expect(stats.ringing + stats.ongoing).toBe(table.live);
      expect(stats.answered).toBe(table.answered);
      expect(stats.missed).toBe(table.missed);
    } finally {
      const index = mockCalls.findIndex((call) => call.id === incoming.callId);
      if (index >= 0) mockCalls.splice(index, 1);
    }
  });
});
