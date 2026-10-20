import { allSubjectPaths } from '@/mocks/reference';
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

  it('sends a ۱۰ digit token to the national id and an ۱۱ digit one to the mobile', async () => {
    const target = mockTickets[3]!;

    for (const search of [target.customer.nationalId, target.customer.mobile]) {
      const result = await repository.list({ ...baseQuery, search });
      expect(result.items.map((t) => t.id)).toContain(target.id);
    }
  });

  it('matches letters against the customer name', async () => {
    const target = mockTickets[3]!;
    const lastName = target.customer.fullName.split(' ').at(-1)!;

    const result = await repository.list({ ...baseQuery, search: lastName });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((t) => t.customer.fullName.includes(lastName))).toBe(true);
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

  it('filters by the enrichment fields', async () => {
    const result = await repository.list({ ...baseQuery, pageSize: 500, priority: 'high' });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((t) => t.enrichment?.priority === 'high')).toBe(true);
  });

  it('filters by every level of the subject path', async () => {
    const target = mockTickets.find((t) => t.subject?.level3.length)!;
    const result = await repository.list({
      ...baseQuery,
      pageSize: 500,
      subject1: target.subject!.level1,
      subject2: target.subject!.level2,
      subject3: target.subject!.level3,
    });

    expect(result.total).toBeGreaterThan(0);
    expect(
      result.items.every(
        (t) =>
          t.subject?.level1 === target.subject!.level1 &&
          t.subject?.level2 === target.subject!.level2 &&
          t.subject?.level3 === target.subject!.level3,
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

  it('offers every path of the reference taxonomy, not only the sampled tickets', async () => {
    const options = await repository.getFilterOptions();

    expect(options.subjectPaths).toEqual(allSubjectPaths());
    expect(options.subjectPaths.length).toBeGreaterThan(mockTickets.length / 10);
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
    expect((await own.getById(id))?.starred).toBe(true);
  });
});
