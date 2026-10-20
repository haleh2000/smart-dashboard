import {
  parseTicketListParams,
  serializeTicketListParams,
  ticketCustomRange,
  toTicketFilter,
} from './ticketListParams';

describe('ticket list URL state', () => {
  it('round-trips every filter through the URL', () => {
    const search = new URLSearchParams({
      q: '0912',
      status: 'closed',
      priority: 'high',
      sentiment: 'negative',
      type: 'شکایت',
      subject: 'پس از صدور',
      subject2: 'خسارت',
      subject3: 'ثبت پرونده خسارت',
      period: '7d',
      sort: 'branch',
      dir: 'asc',
      size: '50',
      page: '3',
    });
    const state = parseTicketListParams(search);

    expect(state).toMatchObject({
      page: 3,
      pageSize: 50,
      search: '0912',
      status: 'closed',
      priority: 'high',
      sentiment: 'negative',
      type: 'شکایت',
      subject1: 'پس از صدور',
      subject2: 'خسارت',
      subject3: 'ثبت پرونده خسارت',
      period: '7d',
      sort: { field: 'branch', direction: 'asc' },
    });
    expect(parseTicketListParams(serializeTicketListParams(state))).toEqual(state);
  });

  it('ignores unknown values and keeps defaults out of the URL', () => {
    const state = parseTicketListParams(new URLSearchParams('status=nope&size=7&sort=hack'));

    expect(state.status).toBeUndefined();
    expect(state.pageSize).toBe(20);
    expect(serializeTicketListParams(state).toString()).toBe('');
  });

  it('turns the period preset into a date range for the repository', () => {
    const state = parseTicketListParams(new URLSearchParams('period=30d'));

    expect(toTicketFilter(state).createdIn).toBeDefined();
    expect(toTicketFilter({ ...state, period: 'all' }).createdIn).toBeUndefined();
  });

  it('prefers a custom از/تا range over the period preset', () => {
    const state = parseTicketListParams(
      new URLSearchParams({
        period: '30d',
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-08-02T00:00:00.000Z',
      }),
    );

    expect(toTicketFilter(state).createdIn).toEqual({
      from: new Date('2026-08-01T00:00:00.000Z'),
      to: new Date('2026-08-02T00:00:00.000Z'),
    });
    expect(parseTicketListParams(serializeTicketListParams(state))).toEqual(state);
    expect(ticketCustomRange(state.from, state.to)).toEqual(toTicketFilter(state).createdIn);
    expect(ticketCustomRange('nonsense', undefined)).toBeNull();
  });
});
