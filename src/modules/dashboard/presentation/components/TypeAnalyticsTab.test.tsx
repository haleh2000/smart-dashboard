import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import type { BreakdownItem } from '../../domain/analytics';
import type { DashboardScope, Dimension } from '../../domain/filters';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters, useDashboardFilterStore } from '../dashboardFilterStore';
import { TypeAnalyticsTab } from './TypeAnalyticsTab';

vi.mock('./charts/ColumnChart', () => ({
  ColumnChart: ({ items }: { items: readonly { label: string; value: number }[] }) => (
    <div data-testid="detail-status-chart">
      {items.map((item) => (
        <span key={item.label}>{`${item.label}=${item.value}`}</span>
      ))}
    </div>
  ),
}));

const detailStatuses: BreakdownItem[] = [
  { value: 'ثبت شده', count: 4, share: 0.4 },
  { value: 'در حال اجرا', count: 5, share: 0.5 },
  { value: 'قابل قبول', count: 1, share: 0.1 },
];

const fakeRepository = () => {
  const getBreakdown = vi.fn(
    async (_dimension: Dimension, _scope: DashboardScope): Promise<BreakdownItem[]> =>
      detailStatuses,
  );
  const repository = {
    getBreakdown,
    getSubjectTable: vi.fn(async () => []),
    getSubjectLineTable: vi.fn(async () => ({ lines: [], rows: [], totals: {} })),
    getBranchResponseTime: vi.fn(async () => []),
    getBranchSla: vi.fn(async () => []),
  } as unknown as AnalyticsRepository;
  return { repository, getBreakdown };
};

const renderTab = (repository: AnalyticsRepository) =>
  renderWithProviders({
    initialPath: '/dashboard',
    routes: [{ path: '/dashboard', element: <TypeAnalyticsTab type="درخواست" /> }],
    wrapper: (children) => (
      <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
    ),
  });

beforeEach(() => {
  resetDashboardFilters();
  useDashboardFilterStore.getState().setDimension('type', 'درخواست');
});

describe('TypeAnalyticsTab · وضعیت تفصیلی', () => {
  it('queries the status breakdown inside the pinned type filter', async () => {
    const { repository, getBreakdown } = fakeRepository();
    renderTab(repository);

    await screen.findByRole('heading', {
      name: 'وضعیت تیکت‌های درخواست (باز / بسته‌شده)',
    });
    const detailCall = getBreakdown.mock.calls.find(([dimension]) => dimension === 'detailStatus');
    expect(detailCall?.[1].filters).toMatchObject({ type: 'درخواست' });
  });

  it('shows only this module statuses, zero-filled in the domain order', async () => {
    const { repository } = fakeRepository();
    renderTab(repository);

    const title = await screen.findByRole('heading', {
      name: 'وضعیت تیکت‌های درخواست (باز / بسته‌شده)',
    });
    const panel = title.closest('section')!;
    const chart = await within(panel).findByTestId('detail-status-chart');
    const rows = [...chart.querySelectorAll('span')].map((span) => span.textContent);

    expect(rows).toEqual([
      'ثبت شده=4',
      'در جریان=0',
      'ثبت یادداشت توسط مالک پیگیری=0',
      'ثبت یادداشت توسط امور مشتریان=0',
      'حل شده=0',
      'رد شده=0',
    ]);
  });
});
