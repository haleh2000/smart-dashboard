import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Call } from '../../domain/call';
import type { CallRepository } from '../../domain/CallRepository';
import { CallRepositoryProvider } from '../callServices';
import { CallListPage } from './CallListPage';

const call: Call = {
  id: 'C-7001',
  direction: 'inbound',
  status: 'answered',
  startedAt: new Date('2026-08-01T10:00:00Z'),
  durationSec: 125,
  waitSec: 12,
  caller: { mobile: '09120000000', nationalId: '0012345678', fullName: 'رضا تست' },
  queue: 'درمان',
  agent: 'سارا احمدی',
  transcript: [],
};

const fakeRepository = (): CallRepository => ({
  list: vi.fn(async (query) => ({
    items: [call],
    total: 1,
    page: query.page,
    pageSize: query.pageSize,
  })),
  getById: vi.fn(async () => call),
  getFilterOptions: vi.fn(async () => ({ agents: ['سارا احمدی'], queues: ['درمان'] })),
  getSubjectTree: vi.fn(async () => []),
  categorize: vi.fn(async () => call),
  subscribeIncoming: vi.fn(() => () => {}),
});

const renderPage = (repository: CallRepository) =>
  renderWithProviders({
    initialPath: '/calls',
    routes: [
      { path: '/calls', element: <CallListPage /> },
      { path: '/calls/:callId', element: <p>detail page</p> },
    ],
    wrapper: (children) => (
      <CallRepositoryProvider value={repository}>{children}</CallRepositoryProvider>
    ),
  });

describe('CallListPage', () => {
  it('renders calls with duration, status and an uncategorized marker', async () => {
    renderPage(fakeRepository());

    const table = await screen.findByRole('table');
    expect(within(table).getByText('رضا تست')).toBeInTheDocument();
    expect(within(table).getByText('۰۲:۰۵')).toBeInTheDocument();
    expect(within(table).getByText('پاسخ‌داده‌شده')).toBeInTheDocument();
    expect(within(table).getByText('دسته‌بندی‌نشده')).toBeInTheDocument();
  });

  it('passes filters to the repository and keeps them in the URL', async () => {
    const repository = fakeRepository();
    const { router } = renderPage(repository);
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('وضعیت'), 'missed');
    await userEvent.click(screen.getByLabelText('فقط دسته‌بندی‌نشده'));

    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'missed', uncategorizedOnly: true, page: 1 }),
    );
    expect(router.state.location.search).toBe('?status=missed&uncategorized=1');
  });

  it('opens the detail page when a row is clicked', async () => {
    const { router } = renderPage(fakeRepository());

    await userEvent.click(await screen.findByText('رضا تست'));

    expect(router.state.location.pathname).toBe('/calls/C-7001');
  });
});
