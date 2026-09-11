import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Kpis } from '../../domain/analytics';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters } from '../dashboardFilterStore';
import { DashboardPage } from './DashboardPage';

const kpis: Kpis = {
  total: 10,
  open: 4,
  inReview: 2,
  closed: 6,
  resolutionRate: 0.6,
  overdue: 1,
  fcrRate: 0.7,
  repeatCallRate: 0.2,
  avgResolutionSec: 3600,
};

const fakeRepository = (): AnalyticsRepository => ({
  getKpis: vi.fn(async () => kpis),
  getBreakdown: vi.fn(async (dimension) =>
    dimension === 'subject1'
      ? [
          { value: 'پس از صدور', count: 6, share: 0.6 },
          { value: 'صدور', count: 4, share: 0.4 },
        ]
      : [],
  ),
  getCrossBreakdown: vi.fn(async () => ({ columns: [], rows: [] })),
  getSubjectTable: vi.fn(async () => []),
  getSubjectLineTable: vi.fn(async () => ({ lines: [], rows: [], totals: {} })),
  getTrend: vi.fn(async () => ({ series: [], buckets: [] })),
  getOperatorStats: vi.fn(async () => []),
  getCallStats: vi.fn(async () => ({
    incoming: 0,
    ringing: 0,
    ongoing: 0,
    answered: 0,
    missed: 0,
    answerRate: 0,
    avgWaitSec: 0,
    avgTalkSec: 0,
  })),
  getCallHeatmap: vi.fn(async () => ({ counts: [], max: 0 })),
  getRepeatCalls: vi.fn(async () => ({
    repeatRate: 0,
    avgCallsPerCustomer: 0,
    avgTimeToResolveSec: 0,
    distribution: [],
  })),
});

const renderPage = (repository: AnalyticsRepository, path = '/dashboard') =>
  renderWithProviders({
    initialPath: path,
    routes: [{ path: '/dashboard', element: <DashboardPage /> }],
    wrapper: (children) => (
      <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
    ),
  });

beforeEach(() => resetDashboardFilters());

describe('DashboardPage', () => {
  it('cross-filters every query when a donut segment is clicked, and clears it from the chip', async () => {
    const repository = fakeRepository();
    renderPage(repository);

    const donut = (
      await screen.findByRole('heading', { name: 'پراکندگی موضوع اصلی تماس' })
    ).closest('section')!;
    // The first match is the SVG slice, the second its legend row; both filter.
    const [slice] = await within(donut).findAllByRole('button', { name: /^پس از صدور/ });
    await userEvent.click(slice!);

    const chip = await screen.findByRole('button', { name: 'حذف فیلتر موضوع اصلی: پس از صدور' });
    expect(repository.getKpis).toHaveBeenLastCalledWith({
      filters: { subject1: 'پس از صدور' },
      range: expect.any(Object),
    });

    await userEvent.click(chip);
    expect(screen.queryByRole('button', { name: /حذف فیلتر/ })).not.toBeInTheDocument();
  });

  it('changes the time range of every query', async () => {
    const repository = fakeRepository();
    renderPage(repository);
    await screen.findByText('۱۰');

    await userEvent.click(screen.getByRole('radio', { name: 'همه زمان‌ها' }));

    expect(repository.getKpis).toHaveBeenLastCalledWith({ filters: {}, range: undefined });
  });

  it('opens the tab named in the URL', async () => {
    renderPage(fakeRepository(), '/dashboard?tab=calls');

    expect(await screen.findByText('تماس‌های ورودی')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'تماس‌ها' })).toHaveAttribute('aria-selected', 'true');
  });
});
