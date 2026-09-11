import { mockCalls } from '@/mocks/calls';
import { mockTickets } from '@/mocks/tickets';
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
});
