import { mockCustomers } from '@/mocks/customers';
import { mockTickets } from '@/mocks/tickets';
import { MockCustomerRepository } from './MockCustomerRepository';

const repository = new MockCustomerRepository();
const sort = { field: 'fullName', direction: 'asc' } as const;

describe('MockCustomerRepository', () => {
  it('searches by national id and pages the result', async () => {
    const target = mockCustomers[3]!;
    const page = await repository.list({ page: 1, pageSize: 10, search: target.nationalId, sort });

    expect(page.items.map((c) => c.nationalId)).toContain(target.nationalId);
    expect(page.items.length).toBeLessThanOrEqual(10);
  });

  it('filters VIP customers only', async () => {
    const page = await repository.list({ page: 1, pageSize: 500, vipOnly: true, sort });

    expect(page.total).toBeGreaterThan(0);
    expect(page.items.every((c) => c.isVip)).toBe(true);
  });

  it('builds a profile with open tickets and no mock-only fields', async () => {
    const ticket = mockTickets.find((t) => t.status !== 'closed')!;
    const profile = await repository.getProfile(ticket.customer.nationalId);

    expect(profile).not.toBeNull();
    expect(profile!.openTicketCount).toBeGreaterThan(0);
    expect(profile).not.toHaveProperty('branch');
  });

  it('returns interactions newest first and sentiment history oldest first', async () => {
    const nationalId = mockTickets[0]!.customer.nationalId;
    const interactions = await repository.getInteractions(nationalId);
    const history = await repository.getSentimentHistory(nationalId);

    expect(interactions.length).toBeGreaterThan(0);
    for (let i = 1; i < interactions.length; i += 1)
      expect(interactions[i - 1]!.at.getTime()).toBeGreaterThanOrEqual(
        interactions[i]!.at.getTime(),
      );
    for (let i = 1; i < history.length; i += 1)
      expect(history[i - 1]!.at.getTime()).toBeLessThanOrEqual(history[i]!.at.getTime());
  });

  it('resolves unknown customers to null', async () => {
    expect(await repository.getProfile('0000000000')).toBeNull();
  });
});
