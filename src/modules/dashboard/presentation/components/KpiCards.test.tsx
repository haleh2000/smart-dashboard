import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { Kpis } from '../../domain/analytics';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters } from '../dashboardFilterStore';
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

const fakeRepository = () =>
  ({
    getKpis: vi.fn(async () => kpis),
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
  it('shows every KPI its hour-over-hour change under the label', async () => {
    renderCards(fakeRepository());

    expect(await screen.findByText('+۲٫۵٪ نسبت به ساعت قبل')).toBeInTheDocument();
    expect(screen.getAllByText(/نسبت به ساعت قبل/)).toHaveLength(9);
    expect(screen.getAllByText('— نسبت به ساعت قبل')).toHaveLength(8);
  });

  it('stays silent about deltas until the first snapshot lands', () => {
    renderCards(fakeRepository());

    expect(screen.queryByText(/نسبت به ساعت قبل/)).not.toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(9);
  });
});
