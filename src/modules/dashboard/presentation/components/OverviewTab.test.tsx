import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import type { BreakdownItem } from '../../domain/analytics';
import type { DashboardScope, Dimension } from '../../domain/filters';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters, useDashboardFilterStore } from '../dashboardFilterStore';
import { OverviewTab } from './OverviewTab';

const fakeRepository = () => {
  const getBreakdown = vi.fn(
    async (dimension: Dimension, _scope: DashboardScope): Promise<BreakdownItem[]> =>
      dimension === 'type'
        ? [
            { value: 'شکایت', count: 6, share: 0.6 },
            { value: 'گفت‌وگو', count: 4, share: 0.4 },
          ]
        : [],
  );
  const repository = {
    getBreakdown,
    getCrossBreakdown: vi.fn(async () => ({ columns: [], rows: [] })),
    getSubjectTable: vi.fn(async () => []),
    getSubjectLineTable: vi.fn(async () => ({ lines: [], rows: [], totals: {} })),
    getTrend: vi.fn(async () => ({ series: [], buckets: [] })),
  } as unknown as AnalyticsRepository;
  return { repository, getBreakdown };
};

const renderTab = (repository: AnalyticsRepository) =>
  renderWithProviders({
    initialPath: '/dashboard',
    routes: [{ path: '/dashboard', element: <OverviewTab /> }],
    wrapper: (children) => (
      <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
    ),
  });

beforeEach(() => resetDashboardFilters());

describe('OverviewTab · شمای کلی همه موضوعات', () => {
  it('filters every query by the clicked type card and dims the other cards', async () => {
    const { repository, getBreakdown } = fakeRepository();
    renderTab(repository);

    const panel = (
      await screen.findByRole('heading', { name: /شمای کلی همه موضوعات/ })
    ).closest('section')!;
    const complaint = await within(panel).findByRole('button', { name: /^شکایت/ });
    await userEvent.click(complaint);

    expect(complaint).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel).getByRole('button', { name: /^پیشنهاد/ })).toHaveClass(
      'stat-card--dimmed',
    );
    expect(within(panel).getByRole('button', { name: /^شکایت/ })).not.toHaveClass(
      'stat-card--dimmed',
    );
    // چارت‌های تب با همان نوع فیلتر می‌شوند (شمارش خود کارت‌ها از فیلتر نوع مستقل می‌ماند).
    expect(getBreakdown.mock.calls.some(([, scope]) => scope.filters.type === 'شکایت')).toBe(true);
    expect(
      getBreakdown.mock.calls.some(
        ([dimension, scope]) => dimension === 'type' && scope.filters.type === undefined,
      ),
    ).toBe(true);
  });

  it('clears the filter when the selected card is clicked again', async () => {
    const { repository } = fakeRepository();
    renderTab(repository);

    const panel = (
      await screen.findByRole('heading', { name: /شمای کلی همه موضوعات/ })
    ).closest('section')!;
    const complaint = await within(panel).findByRole('button', { name: /^شکایت/ });
    await userEvent.click(complaint);
    await userEvent.click(await within(panel).findByRole('button', { name: /^شکایت/ }));

    expect(useDashboardFilterStore.getState().filters.type).toBeUndefined();
    expect(within(panel).getByRole('button', { name: /^پیشنهاد/ })).not.toHaveClass(
      'stat-card--dimmed',
    );
  });
});
