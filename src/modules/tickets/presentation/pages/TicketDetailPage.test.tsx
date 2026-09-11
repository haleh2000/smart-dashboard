import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerRepositoryProvider, type CustomerRepository } from '@/modules/customers';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Ticket } from '../../domain/ticket';
import type { TicketRepository } from '../../domain/TicketRepository';
import { TicketRepositoryProvider } from '../ticketServices';
import { TicketDetailPage } from './TicketDetailPage';

const ticket: Ticket = {
  id: '9001',
  createdAt: new Date('2026-08-01T10:00:00Z'),
  type: 'شکایت',
  status: 'inProgress',
  channel: 'تلفن',
  customer: { nationalId: '0012345678', mobile: '09120000000', fullName: 'مریم دهقانی' },
  subject: { level1: 'پس از صدور', level2: 'پرداخت خسارت', level3: 'تاخیر در پرداخت' },
  insuranceLine: 'ثالث خودرو',
  branch: 'تهران',
  complaintOwner: 'کارشناس',
  followUpOwner: 'سارا احمدی',
  complaintText: 'پرداخت خسارت انجام نشده است.',
  slaRemainingDays: -2,
  referralCount: 1,
  starred: false,
  enrichment: {
    sentiment: 'negative',
    priority: 'high',
    aiTags: ['تاخیر'],
    autoLabel: 'پرداخت خسارت — تاخیر در پرداخت',
    topic: 'پرداخت خسارت',
    suggestedScenario: 'پیگیری فوری پرونده خسارت',
    voice: { voiceId: 'VC-123456', durationSec: 95 },
    transcript: [{ speaker: 'customer', atSec: 3, text: 'هنوز پرداخت نشده.' }],
  },
};

const ticketRepository = (): TicketRepository => ({
  list: vi.fn(),
  getById: vi.fn(async () => ticket),
  getFilterOptions: vi.fn(),
  getAdjacent: vi.fn(async () => ({ previousId: '9000', nextId: null })),
  getTimeline: vi.fn(async () => [
    {
      id: 'e1',
      at: ticket.createdAt,
      kind: 'created' as const,
      actor: 'CRM',
      description: 'ثبت تیکت',
    },
  ]),
  getUpdates: vi.fn(async () => []),
  getNotes: vi.fn(async () => []),
  addNote: vi.fn(async (_id, text) => ({ id: 'n1', at: new Date(), author: 'من', text })),
  getDocuments: vi.fn(async () => []),
  setStarred: vi.fn(),
});

const customerRepository = (): CustomerRepository => ({
  list: vi.fn(),
  getOverview: vi.fn(),
  getProfile: vi.fn(async () => null),
  getInteractions: vi.fn(async () => []),
  getSentimentHistory: vi.fn(async () => []),
});

const renderPage = (repository: TicketRepository) =>
  renderWithProviders({
    initialPath: '/tickets/9001',
    routes: [{ path: '/tickets/:ticketId', element: <TicketDetailPage /> }],
    wrapper: (children) => (
      <TicketRepositoryProvider value={repository}>
        <CustomerRepositoryProvider value={customerRepository()}>
          {children}
        </CustomerRepositoryProvider>
      </TicketRepositoryProvider>
    ),
  });

describe('TicketDetailPage', () => {
  it('shows CRM key fields next to the SMART enrichment', async () => {
    renderPage(ticketRepository());

    expect(await screen.findByText('تیکت ۹۰۰۱')).toBeInTheDocument();
    expect(screen.getByText('پرداخت خسارت انجام نشده است.')).toBeInTheDocument();
    expect(screen.getByText('پیگیری فوری پرونده خسارت')).toBeInTheDocument();
    expect(screen.getByText('هنوز پرداخت نشده.')).toBeInTheDocument();
    expect(screen.getByText('۲ روز تاخیر')).toBeInTheDocument();
  });

  it('links to the previous ticket and disables «next» at the end of the list', async () => {
    renderPage(ticketRepository());
    await screen.findByText('تیکت ۹۰۰۱');

    // The neighbours load after the ticket itself.
    expect(
      await screen.findByRole('link', { name: 'تیکت قبلی' }, { timeout: 3000 }),
    ).toHaveAttribute('href', '/tickets/9000');
    expect(screen.queryByRole('link', { name: 'تیکت بعدی' })).not.toBeInTheDocument();
  });

  it('switches to the timeline tab', async () => {
    renderPage(ticketRepository());

    await userEvent.click(await screen.findByRole('tab', { name: 'جریان‌ها' }));

    expect(await screen.findByText(/ثبت تیکت/)).toBeInTheDocument();
  });

  it('validates and saves a note', async () => {
    const repository = ticketRepository();
    renderPage(repository);
    await userEvent.click(await screen.findByRole('tab', { name: 'یادداشت‌ها' }));

    await userEvent.click(screen.getByRole('button', { name: 'ثبت یادداشت' }));
    expect(screen.getByRole('alert')).toHaveTextContent('متن یادداشت را وارد کنید.');

    await userEvent.type(screen.getByLabelText('افزودن یادداشت'), 'با مشتری تماس گرفتم');
    await userEvent.click(screen.getByRole('button', { name: 'ثبت یادداشت' }));

    expect(repository.addNote).toHaveBeenCalledWith('9001', 'با مشتری تماس گرفتم');
    expect(await screen.findByText('با مشتری تماس گرفتم')).toBeInTheDocument();
  });
});
