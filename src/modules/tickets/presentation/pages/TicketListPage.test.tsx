import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Ticket } from '../../domain/ticket';
import type { TicketRepository } from '../../domain/TicketRepository';
import { TicketRepositoryProvider } from '../ticketServices';
import { TicketListPage } from './TicketListPage';

const ticket: Ticket = {
  id: '9001',
  createdAt: new Date('2026-08-01T10:00:00Z'),
  type: 'شکایت',
  status: 'pending',
  channel: 'تلفن',
  customer: { nationalId: '0012345678', mobile: '09120000000', fullName: 'تست' },
  subject: { level1: 'پس از صدور', level2: 'خسارت', level3: 'ثبت پرونده خسارت' },
  insuranceLine: 'ثالث خودرو',
  branch: 'تهران',
  complaintOwner: 'اپراتور',
  followUpOwner: 'اپراتور',
  complaintText: '',
  slaRemainingDays: 3,
  referralCount: 0,
  starred: false,
  enrichment: null,
};

const fakeTicketRepository = (): TicketRepository => ({
  list: vi.fn(async (query) => ({
    items: [ticket],
    total: 1,
    page: query.page,
    pageSize: query.pageSize,
  })),
  getById: vi.fn(async () => ticket),
  getFilterOptions: vi.fn(async () => ({
    types: ['شکایت', 'پیشنهاد'],
    subjectPaths: [
      { level1: 'پس از صدور', level2: 'خسارت', level3: 'ثبت پرونده خسارت' },
      { level1: 'پس از صدور', level2: 'خسارت', level3: 'عدم پرداخت خسارت' },
      { level1: 'پیش از صدور', level2: 'صدور', level3: 'ابطال بیمه‌نامه' },
    ],
  })),
  getAdjacent: vi.fn(async () => ({ previousId: null, nextId: null })),
  getTimeline: vi.fn(async () => []),
  getUpdates: vi.fn(async () => []),
  getNotes: vi.fn(async () => []),
  addNote: vi.fn(async (_id, text) => ({ id: 'n', at: new Date(), author: 'من', text })),
  getDocuments: vi.fn(async () => []),
  setStarred: vi.fn(async () => undefined),
});

const renderPage = (repository: TicketRepository) =>
  renderWithProviders({
    initialPath: '/tickets',
    routes: [
      { path: '/tickets', element: <TicketListPage /> },
      { path: '/tickets/:ticketId', element: <p>detail page</p> },
    ],
    wrapper: (children) => (
      <TicketRepositoryProvider value={repository}>{children}</TicketRepositoryProvider>
    ),
  });

describe('TicketListPage', () => {
  it('renders tickets from the injected repository with a status badge', async () => {
    renderPage(fakeTicketRepository());

    expect(await screen.findByRole('link', { name: 'T-۹۰۰۱' })).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]!).getByText('در انتظار')).toBeInTheDocument();
  });

  it('passes the status filter to the repository and keeps it in the URL', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    await userEvent.selectOptions(screen.getByLabelText('وضعیت'), 'closed');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'closed', page: 1 }),
    );
    expect(router.state.location.search).toBe('?status=closed');
  });

  it('filters from the dropdown on the وضعیت column header', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    const header = await screen.findByRole('columnheader', { name: /وضعیت/ });
    const status = within(header).getByLabelText('وضعیت');
    const values = within(status)
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value);
    expect(values).toEqual(expect.arrayContaining(['open', 'inReview', 'closed']));

    await userEvent.selectOptions(status, 'closed');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'closed', page: 1 }),
    );
    expect(router.state.location.search).toBe('?status=closed');
  });

  it('filters by sentiment and priority from their column headers', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    const sentiment = within(
      await screen.findByRole('columnheader', { name: /احساس/ }),
    ).getByLabelText('احساس');
    const priority = within(
      screen.getByRole('columnheader', { name: /اولویت/ }),
    ).getByLabelText('اولویت');

    await userEvent.selectOptions(sentiment, 'negative');
    await userEvent.selectOptions(priority, 'high');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sentiment: 'negative', priority: 'high' }),
    );
    expect(router.state.location.search).toContain('priority=high');
  });

  it('cascades the three subject levels, each offering only its own children', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    const level1 = within(
      await screen.findByRole('columnheader', { name: /نوع اصلی شکایت/ }),
    ).getByLabelText('نوع اصلی شکایت');
    const values = (select: HTMLElement) =>
      within(select)
        .getAllByRole('option')
        .map((option) => (option as HTMLOptionElement).value);
    expect(values(level1)).toEqual(['', 'پس از صدور', 'پیش از صدور']);

    const level2 = within(
      screen.getByRole('columnheader', { name: /نوع شکایت/ }),
    ).getByLabelText('نوع شکایت');
    const level3 = within(
      screen.getByRole('columnheader', { name: /علت شکایت/ }),
    ).getByLabelText('علت شکایت');
    // Before a level is picked the dropdown offers that whole level, never an empty list.
    expect(values(level2)).toEqual(['', 'خسارت', 'صدور']);
    expect(values(level3)).toEqual([
      '',
      'ابطال بیمه‌نامه',
      'ثبت پرونده خسارت',
      'عدم پرداخت خسارت',
    ]);

    await userEvent.selectOptions(level1, 'پس از صدور');

    expect(values(level2)).toEqual(['', 'خسارت']);
    // With a level1 but no level2 yet, the third level narrows to that level1's own leaves.
    expect(values(level3)).toEqual(['', 'ثبت پرونده خسارت', 'عدم پرداخت خسارت']);

    await userEvent.selectOptions(level2, 'خسارت');

    expect(values(level3)).toEqual(['', 'ثبت پرونده خسارت', 'عدم پرداخت خسارت']);
    await userEvent.selectOptions(level3, 'عدم پرداخت خسارت');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subject1: 'پس از صدور',
        subject2: 'خسارت',
        subject3: 'عدم پرداخت خسارت',
        page: 1,
      }),
    );
    expect(router.state.location.search).toContain('subject3=');

    // Moving a parent drops the levels below it, which no longer exist under it.
    await userEvent.selectOptions(level1, 'پیش از صدور');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subject1: 'پیش از صدور',
        subject2: undefined,
        subject3: undefined,
      }),
    );
  });

  it('filters by the ticket type from its column header', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    const type = within(
      await screen.findByRole('columnheader', { name: /نوع تیکت/ }),
    ).getByLabelText('نوع تیکت');

    await userEvent.selectOptions(type, 'شکایت');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'شکایت', page: 1 }),
    );
    expect(router.state.location.search).toBe('?type=' + encodeURIComponent('شکایت'));
  });

  it('keeps the title of a filtered column inert, so a click never filters', async () => {
  const repository = fakeTicketRepository();
  renderPage(repository);
  await screen.findByRole('link', { name: 'T-۹۰۰۱' });

  const status = await screen.findByRole('columnheader', { name: /وضعیت/ });
  expect(within(status).queryByRole('button')).toBeNull();

  await userEvent.click(within(status).getByText('وضعیت'));

  expect(repository.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined }));
}); 

  it('leaves every other column without a filter', async () => {
    renderPage(fakeTicketRepository());
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    for (const header of ['شماره تیکت', 'نام مشتری', 'کدملی', 'موبایل', 'نام شعبه']) {
      const cell = screen.queryByRole('columnheader', { name: new RegExp(header) });
      expect(cell?.querySelector('select, input') ?? null).toBeNull();
    }
  });

  it('searches as you type, without pressing the جستجو button', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    await userEvent.type(screen.getByLabelText('جستجو'), '۹۰۰۱');

    await waitFor(() =>
      expect(repository.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '9001' }),
      ),
    );
    expect(router.state.location.search).toBe('?q=9001');
  });

  it('keeps typing while an earlier search is still settling', async () => {
    const repository = fakeTicketRepository();
    renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    const input = screen.getByLabelText('جستجو');
    await userEvent.type(input, 'T-');
    await userEvent.type(input, '۹۰۰۱');

    await waitFor(() => expect(input).toHaveValue('T-۹۰۰۱'));
  });

  it('clears the search box when the filters are reset', async () => {
    renderPage(fakeTicketRepository());
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    const input = screen.getByLabelText('جستجو');
    await userEvent.type(input, '۹۰۰۱');
    const reset = await screen.findByRole('button', { name: 'حذف فیلترها' });

    await userEvent.click(reset);

    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('sends the ticket number as typed from the table to the repository', async () => {
    const repository = fakeTicketRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: 'T-۹۰۰۱' });

    await userEvent.type(screen.getByLabelText('جستجو'), 'T-۹۰۰۱');
    await userEvent.click(screen.getByRole('button', { name: 'جستجو' }));

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: '9001', page: 1 }),
    );
    expect(router.state.location.search).toBe('?q=9001');
  });

  it('shows the channel of each ticket and never turns a header into a sort button', async () => {
    const repository = fakeTicketRepository();
    renderPage(repository);

    expect(await screen.findByRole('cell', { name: 'تلفن' })).toBeInTheDocument();
    expect(
      within(screen.getAllByRole('rowgroup')[0]!).queryAllByRole('button'),
    ).toHaveLength(0); // no header is a button; only the filter dropdowns are interactive
  });

  it('stars a ticket from the row actions', async () => {
    const repository = fakeTicketRepository();
    renderPage(repository);

    await userEvent.click(await screen.findByRole('button', { name: 'ستاره‌دار کردن' }));

    expect(repository.setStarred).toHaveBeenCalledWith('9001', true);
  });

  it('opens the detail page when a row is clicked', async () => {
    const { router } = renderPage(fakeTicketRepository());

    await userEvent.click(await screen.findByText('تهران'));

    expect(router.state.location.pathname).toBe('/tickets/9001');
  });
});
