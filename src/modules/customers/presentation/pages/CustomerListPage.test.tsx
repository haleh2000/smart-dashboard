import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { CustomerSummary } from '../../domain/customer';
import type { CustomerRepository } from '../../domain/CustomerRepository';
import { CustomerRepositoryProvider } from '../customerServices';
import { CustomerListPage } from './CustomerListPage';

const summary: CustomerSummary = {
  nationalId: '0012345678',
  fullName: 'امیر رضایی',
  mobile: '09121234567',
  status: 'active',
  kind: 'corporate',
  corporateName: 'بانک ملت',
  city: 'مشهد',
  isVip: false,
  activePolicyCount: 2,
  openTicketCount: 1,
};

const fakeRepository = (): CustomerRepository => ({
  list: vi.fn(async (query) => ({
    items: [summary],
    total: 1,
    page: query.page,
    pageSize: query.pageSize,
  })),
  getOverview: vi.fn(async () => ({
    total: 1,
    active: 1,
    vip: 0,
    corporate: 1,
    withOpenTickets: 1,
    atRisk: 0,
    lastSentiment: { positive: 0, neutral: 0, negative: 0 },
  })),
  getProfile: vi.fn(),
  getInteractions: vi.fn(),
  getSentimentHistory: vi.fn(),
});

const renderPage = (repository: CustomerRepository) =>
  renderWithProviders({
    initialPath: '/customers',
    routes: [
      { path: '/customers', element: <CustomerListPage /> },
      { path: '/customers/:nationalId', element: <p>profile page</p> },
    ],
    wrapper: (children) => (
      <CustomerRepositoryProvider value={repository}>{children}</CustomerRepositoryProvider>
    ),
  });

describe('CustomerListPage', () => {
  it('passes the VIP filter to the repository and keeps it in the URL', async () => {
    const repository = fakeRepository();
    const { router } = renderPage(repository);
    await screen.findByText('امیر رضایی');

    await userEvent.click(screen.getByLabelText('فقط مشتریان VIP'));

    expect(repository.list).toHaveBeenLastCalledWith(expect.objectContaining({ vipOnly: true }));
    expect(router.state.location.search).toBe('?vip=1');
  });

  it('opens Customer 360 when a row is clicked', async () => {
    const { router } = renderPage(fakeRepository());

    await userEvent.click(await screen.findByText('مشهد'));

    expect(router.state.location.pathname).toBe('/customers/0012345678');
  });
});
