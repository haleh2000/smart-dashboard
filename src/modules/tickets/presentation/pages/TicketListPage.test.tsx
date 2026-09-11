import { screen, within } from '@testing-library/react';
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
  enrichment: null,
};

const fakeRepository = (): TicketRepository => ({
  list: vi.fn(async (query) => ({
    items: [ticket],
    total: 1,
    page: query.page,
    pageSize: query.pageSize,
  })),
  getById: vi.fn(async () => ticket),
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
    renderPage(fakeRepository());

    expect(await screen.findByRole('link', { name: '۹۰۰۱' })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('در انتظار')).toBeInTheDocument();
  });

  it('passes the status filter to the repository and keeps it in the URL', async () => {
    const repository = fakeRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('link', { name: '۹۰۰۱' });

    await userEvent.selectOptions(screen.getByLabelText('وضعیت'), 'closed');

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'closed', page: 1 }),
    );
    expect(router.state.location.search).toBe('?status=closed');
  });

  it('opens the detail page when a row is clicked', async () => {
    const { router } = renderPage(fakeRepository());

    await userEvent.click(await screen.findByText('تهران'));

    expect(router.state.location.pathname).toBe('/tickets/9001');
  });
});
