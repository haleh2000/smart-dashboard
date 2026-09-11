import type { Ticket } from '@/modules/tickets';
import { delay } from '@/mocks/delay';
import { mockTickets } from '@/mocks/tickets';
import type { BreakdownItem, Kpis } from '../domain/analytics';
import type { AnalyticsRepository } from '../domain/AnalyticsRepository';
import type { DashboardFilters, Dimension } from '../domain/filters';

const valueOf: Record<Dimension, (ticket: Ticket) => string> = {
  subject1: (t) => t.subject.level1,
  subject2: (t) => t.subject.level2,
  subject3: (t) => t.subject.level3,
  type: (t) => t.type,
  channel: (t) => t.channel,
  insuranceLine: (t) => t.insuranceLine,
  branch: (t) => t.branch,
};

/** Aggregates the in-memory dataset the way the backend is expected to. */
export class MockAnalyticsRepository implements AnalyticsRepository {
  private readonly tickets: Ticket[];

  constructor(tickets: Ticket[] = mockTickets) {
    this.tickets = tickets;
  }

  private filter(filters: DashboardFilters) {
    const active = Object.entries(filters) as [Dimension, string][];
    return this.tickets.filter((ticket) =>
      active.every(([dimension, value]) => valueOf[dimension](ticket) === value),
    );
  }

  async getBreakdown(dimension: Dimension, filters: DashboardFilters): Promise<BreakdownItem[]> {
    await delay(200);
    const tickets = this.filter(filters);
    const counts = new Map<string, number>();
    for (const ticket of tickets) {
      const value = valueOf[dimension](ticket);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts]
      .map(([value, count]) => ({ value, count, share: count / tickets.length }))
      .sort((a, b) => b.count - a.count);
  }

  async getKpis(filters: DashboardFilters): Promise<Kpis> {
    await delay(200);
    const tickets = this.filter(filters);
    const closed = tickets.filter((t) => t.status === 'closed').length;
    return {
      total: tickets.length,
      open: tickets.length - closed,
      closed,
      resolutionRate: tickets.length ? closed / tickets.length : 0,
    };
  }
}
