import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Kpis } from '../../domain/analytics';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters, useDashboardFilterStore } from '../dashboardFilterStore';
import { KpiCards } from './KpiCards';

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
  hourDelta: { total: 0.025 },
};

const typeBreakdown = [
  { value: 'شکایت', count: 6, share: 0.6 },
  { value: 'گفت‌وگو', count: 4, share: 0.4 },
];

const fakeRepository = () =>
  ({
    getKpis: vi.fn(async () => kpis),
    getBreakdown: vi.fn(async (dimension: string) => (dimension === 'type' ? typeBreakdown : [])),
  }) as unknown as AnalyticsRepository;

const renderCards = (repository: AnalyticsRepository) =>
  renderWithProviders({
    initialPath: '/dashboard',
    routes: [{ path: '/dashboard', element: <KpiCards /> }],
    wrapper: (children) => (
      <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
    ),
  });

beforeEach(() => resetDashboardFilters());

describe('KpiCards', () => {
  it('shows the total KPI with a type-filter caption on the overview tab', async () => {
    renderCards(fakeRepository());

    // تب «کلی» فقط «کل» + فیلتر موضوع (بر اساس نوع تیکت).
    expect(await screen.findByText('کل')).toBeInTheDocument();
    expect(screen.getByLabelText('فیلتر موضوع برای کل')).toBeInTheDocument();
    expect(await screen.findByText('+۲٫۵٪ نسبت به ساعت قبل')).toBeInTheDocument();
  });

  it('stays silent about deltas until the first snapshot lands', () => {
    renderCards(fakeRepository());

    expect(screen.queryByText(/نسبت به ساعت قبل/)).not.toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(1);
  });

  it('keeps «کل» at the grand total while a type is filtered', async () => {
    const repository = fakeRepository();
    useDashboardFilterStore.getState().setDimension('type', 'شکایت');
    renderCards(repository);

    expect(await screen.findByText('کل')).toBeInTheDocument();
    // فیلتر نوع نباید به KPI «کل» برسد.
    expect(vi.mocked(repository.getKpis)).toHaveBeenLastCalledWith({
      filters: {},
      range: undefined,
    });
    // اما شمارش گزینه‌های dropdown مستقل از فیلتر می‌ماند (بدون فیلتر نوع).
    expect(
      vi.mocked(repository.getBreakdown).mock.calls.every(
        ([dimension, scope]) => dimension !== 'type' || scope.filters.type === undefined,
      ),
    ).toBe(true);
  });

  it('lists every ticket type with its own count next to it', async () => {
    const repository = fakeRepository();
    useDashboardFilterStore.getState().setDimension('type', 'شکایت');
    renderCards(repository);

    const select = (await screen.findByLabelText('فیلتر موضوع برای کل')) as HTMLSelectElement;
    expect(select.value).toBe('شکایت');
    // شمارش هر نوع کنار خودش می‌آید (پس از رسیدن breakdown).
    expect(await screen.findByRole('option', { name: 'شکایت (۶)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'گفت‌وگو (۴)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'پیشنهاد (۰)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'همه موضوعات' })).toBeInTheDocument();

    await userEvent.selectOptions(select, 'پیشنهاد');
    expect(useDashboardFilterStore.getState().filters.type).toBe('پیشنهاد');
  });
});
