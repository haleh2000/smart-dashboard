import {
  parseTicketListParams,
  serializeTicketListParams,
  toTicketFilter,
} from './ticketListParams';

describe('ticket list URL state', () => {
  it('round-trips every filter through the URL', () => {
    const search =
      'q=0912&status=closed&priority=high&sentiment=negative&type=%D8%B4%DA%A9%D8%A7%DB%8C%D8%AA&operator=x&starred=1&period=7d&sort=branch&dir=asc&size=50&page=3';
    const state = parseTicketListParams(new URLSearchParams(search));

    expect(state).toMatchObject({
      page: 3,
      pageSize: 50,
      search: '0912',
      status: 'closed',
      priority: 'high',
      sentiment: 'negative',
      type: 'شکایت',
      operator: 'x',
      starredOnly: true,
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
});
