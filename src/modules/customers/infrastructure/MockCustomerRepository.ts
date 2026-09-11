import type { Call } from '@/modules/calls';
import type { Ticket } from '@/modules/tickets';
import { mockCalls } from '@/mocks/calls';
import { mockCustomers, type MockCustomer } from '@/mocks/customers';
import { delay } from '@/mocks/delay';
import { mockTickets } from '@/mocks/tickets';
import type { Page } from '@/shared/domain/pagination';
import type {
  CustomerProfile,
  CustomerSummary,
  Interaction,
  SentimentPoint,
} from '../domain/customer';
import type {
  CustomerQuery,
  CustomerRepository,
  CustomerSortField,
} from '../domain/CustomerRepository';

const UNCATEGORIZED = 'دسته‌بندی‌نشده';

const ticketInteraction = (ticket: Ticket): Interaction => ({
  id: `t-${ticket.id}`,
  kind: ticket.type === 'شکایت' ? 'complaint' : 'ticket',
  refId: ticket.id,
  at: ticket.createdAt,
  title: ticket.subject.level3,
  channel: ticket.channel,
  open: ticket.status !== 'closed',
  sentiment: ticket.enrichment?.sentiment,
});

const callInteraction = (call: Call): Interaction => ({
  id: `c-${call.id}`,
  kind: 'call',
  refId: call.id,
  at: call.startedAt,
  title: call.subject?.level3 ?? UNCATEGORIZED,
  channel: 'تلفن',
  open: call.status === 'ringing' || call.status === 'ongoing',
  sentiment: call.analysis?.sentiment,
});

const compareBy: Record<CustomerSortField, (a: CustomerSummary, b: CustomerSummary) => number> = {
  fullName: (a, b) => a.fullName.localeCompare(b.fullName, 'fa'),
  lastInteractionAt: (a, b) =>
    (a.lastInteractionAt?.getTime() ?? 0) - (b.lastInteractionAt?.getTime() ?? 0),
  openTicketCount: (a, b) => a.openTicketCount - b.openTicketCount,
  activePolicyCount: (a, b) => a.activePolicyCount - b.activePolicyCount,
};

/** In-memory Customer 360: joins the CRM customers with tickets and calls like the backend would. */
export class MockCustomerRepository implements CustomerRepository {
  private readonly customers: MockCustomer[];
  private readonly tickets: Ticket[];
  private readonly calls: Call[];

  constructor(
    customers: MockCustomer[] = mockCustomers,
    tickets: Ticket[] = mockTickets,
    calls: Call[] = mockCalls,
  ) {
    this.customers = customers;
    this.tickets = tickets;
    this.calls = calls;
  }

  private interactionsOf(nationalId: string) {
    return [
      ...this.tickets.filter((t) => t.customer.nationalId === nationalId).map(ticketInteraction),
      ...this.calls.filter((c) => c.caller.nationalId === nationalId).map(callInteraction),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());
  }

  private summarize(customer: MockCustomer): CustomerProfile {
    // Strip the mock-only `branch`; everything else is the CRM profile.
    const profile: CustomerProfile & { branch?: string } = { ...customer };
    delete profile.branch;
    const interactions = this.interactionsOf(customer.nationalId);
    const latest = interactions[0];
    return {
      ...profile,
      activePolicyCount: customer.policies.filter((p) => p.status === 'active').length,
      openTicketCount: this.tickets.filter(
        (t) => t.customer.nationalId === customer.nationalId && t.status !== 'closed',
      ).length,
      lastInteractionAt: latest?.at,
      lastSentiment: interactions.find((i) => i.sentiment)?.sentiment,
    };
  }

  async list({
    page,
    pageSize,
    search,
    status,
    kind,
    vipOnly,
    sort,
  }: CustomerQuery): Promise<Page<CustomerSummary>> {
    await delay();
    const term = search?.trim();
    const direction = sort.direction === 'asc' ? 1 : -1;
    const filtered = this.customers
      .filter(
        (c) =>
          (!term || [c.fullName, c.mobile, c.nationalId].some((v) => v.includes(term))) &&
          (!status || c.status === status) &&
          (!kind || c.kind === kind) &&
          (!vipOnly || c.isVip),
      )
      .map((c) => this.summarize(c))
      .sort((a, b) => compareBy[sort.field](a, b) * direction);

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async getProfile(nationalId: string) {
    await delay();
    const customer = this.customers.find((c) => c.nationalId === nationalId);
    return customer ? this.summarize(customer) : null;
  }

  async getInteractions(nationalId: string) {
    await delay();
    return this.interactionsOf(nationalId);
  }

  async getSentimentHistory(nationalId: string): Promise<SentimentPoint[]> {
    await delay();
    return this.interactionsOf(nationalId)
      .filter((i): i is Interaction & Required<Pick<Interaction, 'sentiment'>> => !!i.sentiment)
      .map((i) => ({
        at: i.at,
        sentiment: i.sentiment,
        source: i.kind === 'call' ? ('call' as const) : ('ticket' as const),
      }))
      .reverse();
  }
}
