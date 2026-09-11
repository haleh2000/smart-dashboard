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

  it('filters by enrichment fields and operator', async () => {
    const result = await repository.list({
      ...baseQuery,
      pageSize: 500,
      priority: 'high',
      operator: 'سارا احمدی',
    });

    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every(
        (t) =>
          t.enrichment?.priority === 'high' &&
          (t.followUpOwner === 'سارا احمدی' || t.complaintOwner.endsWith('سارا احمدی')),
      ),
    ).toBe(true);
  });

  it('sorts by any column, e.g. branch ascending', async () => {
    const { items } = await repository.list({
      ...baseQuery,
      pageSize: 500,
      sort: { field: 'branch', direction: 'asc' },
    });
    const branches = items.map((t) => t.branch);

    expect(branches).toEqual([...branches].sort((a, b) => a.localeCompare(b, 'fa')));
  });

  it('finds the neighbours of a ticket inside the same filtered list', async () => {
    const { items } = await repository.list(baseQuery);
    const middle = items[1]!;

    expect(await repository.getAdjacent(middle.id, {}, baseQuery.sort)).toEqual({
      previousId: items[0]!.id,
      nextId: items[2]!.id,
    });
  });

  it('stores notes and stars', async () => {
    const own = new MockTicketRepository();
    const id = mockTickets[0]!.id;
    await own.addNote(id, '  یادداشت تست  ');
    await own.setStarred(id, true);

    expect((await own.getNotes(id))[0]?.text).toBe('یادداشت تست');
    expect((await own.list({ ...baseQuery, starredOnly: true, search: id })).total).toBe(1);
  });
});
