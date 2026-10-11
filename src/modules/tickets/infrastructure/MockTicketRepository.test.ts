import { mockTickets } from '@/mocks/tickets';
import { formatPersianNumber } from '@/shared/lib/format';
import {
  isClosedDetailStatus,
  isOpenDetailStatus,
  isReviewDetailStatus,
} from '../domain/ticket';
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

  it('finds a ticket by its number however it was typed or rendered', async () => {
    const target = mockTickets[3]!;
    const typed = [
      target.id,
      formatPersianNumber(target.id),
      `T-${target.id}`,
      `T-${formatPersianNumber(target.id)}`,
      `تیکت ${formatPersianNumber(target.id)}`,
      `  ${target.id}  `,
    ];

    for (const search of typed) {
      const result = await repository.list({ ...baseQuery, search });
      expect(result.items.map((t) => t.id)).toContain(target.id);
    }
  });

  it('requires every word of a multi-word search to match', async () => {
    const target = mockTickets[3]!;

    const both = await repository.list({
      ...baseQuery,
      search: `${target.id} ${target.customer.nationalId}`,
    });
    expect(both.items.map((t) => t.id)).toEqual([target.id]);

    const impossible = await repository.list({
      ...baseQuery,
      search: `${target.id} ${target.customer.nationalId} 0000000000`,
    });
    expect(impossible.total).toBe(0);
  });

  it('does not match on the customer name', async () => {
    const target = mockTickets[3]!;

    const result = await repository.list({ ...baseQuery, search: target.customer.fullName });

    expect(result.total).toBe(0);
  });

  it('returns null for an unknown id', async () => {
    expect(await repository.getById('missing')).toBeNull();
  });

  it('filters by the KPI groups «باز» and «در حال بررسی» (detail-aware)', async () => {
    const query = { ...baseQuery, pageSize: 1000 };
    const open = await repository.list({ ...query, status: 'open' });
    const reviewing = await repository.list({ ...query, status: 'inReview' });

    expect(open.total).toBe(
      mockTickets.filter((t) => isOpenDetailStatus(t.detailStatus, t.status)).length,
    );
    expect(open.total + (await repository.list({ ...query, status: 'closed' })).total).toBe(
      mockTickets.length,
    );
    expect(reviewing.total).toBeGreaterThan(0);
    expect(
      reviewing.items.every((t) => isReviewDetailStatus(t.detailStatus, t.status)),
    ).toBe(true);
  });

  it('matches the closed group to the detail statuses, not the CRM status', async () => {
    const query = { ...baseQuery, pageSize: 1000 };
    const closed = await repository.list({ ...query, status: 'closed' });

    expect(closed.total).toBe(
      mockTickets.filter((t) => isClosedDetailStatus(t.detailStatus, t.status)).length,
    );
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

  it('filters by the entry channel and offers every channel as an option', async () => {
    const result = await repository.list({ ...baseQuery, pageSize: 500, channel: 'وب' });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((t) => t.channel === 'وب')).toBe(true);

    const options = await repository.getFilterOptions();
    const actual = mockTickets.map((t) => t.channel);
    expect(options.channels).toEqual([...new Set(actual)].sort((a, b) => a.localeCompare(b, 'fa')));
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
