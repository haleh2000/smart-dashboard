import { mockTickets } from '@/mocks/tickets';
import { subscribeToTicketFeed } from '@/modules/tickets';
import { MockAnalyticsRepository } from './MockAnalyticsRepository';
import { startKpiSimulator, stopKpiSimulator, tickKpiSimulator } from './devKpiSimulator';

const all = { filters: {} };

describe('devKpiSimulator', () => {
  it('adds a live ticket, notifies KPI listeners and moves the totals', async () => {
    const repository = new MockAnalyticsRepository();
    const before = await repository.getKpis(all);
    const listener = vi.fn();
    const unsubscribe = subscribeToTicketFeed(listener);

    tickKpiSimulator();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(mockTickets.length).toBeGreaterThan(before.total);
    expect((await repository.getKpis(all)).total).toBeGreaterThan(before.total);
    unsubscribe();
  });

  it('keeps ticking on its interval until stopped', () => {
    vi.useFakeTimers();
    try {
      const before = mockTickets.length;
      startKpiSimulator(1_000);
      vi.advanceTimersByTime(3_000);
      expect(mockTickets.length).toBeGreaterThan(before);

      stopKpiSimulator();
      const settled = mockTickets.length;
      vi.advanceTimersByTime(5_000);
      expect(mockTickets.length).toBe(settled);
    } finally {
      stopKpiSimulator();
      vi.useRealTimers();
    }
  });
});
