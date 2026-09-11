import { mockTickets } from '@/mocks/tickets';
import { MockAnalyticsRepository } from './MockAnalyticsRepository';

const repository = new MockAnalyticsRepository();

describe('MockAnalyticsRepository', () => {
  it('returns a breakdown whose shares add up to 1, largest first', async () => {
    const items = await repository.getBreakdown('branch', {});

    expect(items.reduce((sum, i) => sum + i.count, 0)).toBe(mockTickets.length);
    expect(items.reduce((sum, i) => sum + i.share, 0)).toBeCloseTo(1);
    expect(items[0]!.count).toBeGreaterThanOrEqual(items.at(-1)!.count);
  });

  it('applies filters to KPIs', async () => {
    const all = await repository.getKpis({});
    const tehran = await repository.getKpis({ branch: 'تهران' });

    expect(tehran.total).toBeLessThan(all.total);
    expect(tehran.open + tehran.closed).toBe(tehran.total);
  });
});
