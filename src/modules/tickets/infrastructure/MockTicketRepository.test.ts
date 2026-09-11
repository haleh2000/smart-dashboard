import { mockTickets } from '@/mocks/tickets';
import { MockTicketRepository } from './MockTicketRepository';

const repository = new MockTicketRepository();
const baseQuery = {
  page: 1,
  pageSize: 10,
  sort: { field: 'createdAt', direction: 'desc' },
} as const;

describe('MockTicketRepository', () => {
  it('pages and sorts newest first', async () => {
    const result = await repository.list(baseQuery);

    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(mockTickets.length);
    const times = result.items.map((t) => t.createdAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('filters by status and searches by id', async () => {
    const target = mockTickets[3]!;
    const result = await repository.list({
      ...baseQuery,
      search: target.id,
      status: target.status,
    });

    expect(result.items.map((t) => t.id)).toContain(target.id);
    expect(result.items.every((t) => t.status === target.status)).toBe(true);
  });

  it('returns null for an unknown id', async () => {
    expect(await repository.getById('missing')).toBeNull();
  });
});
