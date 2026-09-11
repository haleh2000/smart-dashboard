import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { CustomerProfile } from '../../domain/customer';
import type { CustomerRepository } from '../../domain/CustomerRepository';
import { CustomerRepositoryProvider } from '../customerServices';
import { CustomerProfilePage } from './CustomerProfilePage';

const customer: CustomerProfile = {
  nationalId: '0012345678',
  fullName: 'مریم کاظمی',
  mobile: '09121234567',
  status: 'active',
  kind: 'individual',
  city: 'تهران',
  isVip: true,
  activePolicyCount: 1,
  openTicketCount: 2,
  gender: 'female',
  customerSince: new Date('2020-01-01T00:00:00Z'),
  policies: [
    {
      number: '1404/01/123456',
      line: 'ثالث خودرو',
      status: 'active',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-01-01T00:00:00Z'),
      premium: 12_000_000,
      insuredItem: 'پلاک 12ب345-66',
    },
  ],
  claims: [
    {
      number: 'CL-7654321',
      policyNumber: '1404/01/123456',
      line: 'ثالث خودرو',
      filedAt: new Date('2026-05-01T00:00:00Z'),
      status: 'paid',
      amount: 50_000_000,
      paidAmount: 40_000_000,
    },
  ],
};

const fakeRepository = (profile: CustomerProfile | null = customer): CustomerRepository => ({
  list: vi.fn(),
  getOverview: vi.fn(),
  getProfile: vi.fn(async () => profile),
  getInteractions: vi.fn(async () => [
    {
      id: 't-1',
      kind: 'complaint' as const,
      refId: '140001',
      at: new Date('2026-08-01T10:00:00Z'),
      title: 'تاخیر در پرداخت',
      channel: 'وب',
      open: true,
      sentiment: 'negative' as const,
    },
  ]),
  getSentimentHistory: vi.fn(async () => [
    {
      at: new Date('2026-08-01T10:00:00Z'),
      sentiment: 'negative' as const,
      source: 'ticket' as const,
    },
  ]),
});

const renderPage = (repository: CustomerRepository) =>
  renderWithProviders({
    initialPath: '/customers/0012345678',
    routes: [
      { path: '/customers/:nationalId', element: <CustomerProfilePage /> },
      { path: '/tickets/:ticketId', element: <p>ticket page</p> },
    ],
    wrapper: (children) => (
      <CustomerRepositoryProvider value={repository}>{children}</CustomerRepositoryProvider>
    ),
  });

describe('CustomerProfilePage', () => {
  it('renders the identity card of the customer', async () => {
    renderPage(fakeRepository());

    expect(await screen.findByRole('heading', { name: 'مریم کاظمی' })).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getAllByText('۰۰۱۲۳۴۵۶۷۸').length).toBeGreaterThan(0);
  });

  it('switches to the claims tab', async () => {
    renderPage(fakeRepository());
    await screen.findByRole('heading', { name: 'مریم کاظمی' });

    await userEvent.click(screen.getByRole('tab', { name: /خسارت‌ها/ }));

    expect(screen.getByText('CL-۷۶۵۴۳۲۱')).toBeInTheDocument();
    expect(screen.getByText('پرداخت‌شده')).toBeInTheDocument();
  });

  it('links interactions to their ticket', async () => {
    const { router } = renderPage(fakeRepository());
    await screen.findByRole('heading', { name: 'مریم کاظمی' });

    await userEvent.click(screen.getByRole('tab', { name: 'تعاملات' }));
    await userEvent.click(await screen.findByRole('link', { name: 'تاخیر در پرداخت' }));

    expect(router.state.location.pathname).toBe('/tickets/140001');
  });

  it('shows a not-found state for an unknown national id', async () => {
    renderPage(fakeRepository(null));

    expect(await screen.findByText('مشتری‌ای با این کدملی پیدا نشد.')).toBeInTheDocument();
  });
});
