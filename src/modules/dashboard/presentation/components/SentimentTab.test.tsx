import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { SentimentOverview } from '../../domain/analytics';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters } from '../dashboardFilterStore';
import { SentimentTab } from './SentimentTab';

const row = (positive: number, neutral: number, negative: number) => ({
  positive,
  neutral,
  negative,
});

const overview: SentimentOverview = {
  analyzed: 10,
  customer: { ...row(4, 4, 2), score: 0.2 },
  agent: { ...row(7, 3, 0), score: 0.7 },
  matrix: { positive: row(4, 0, 0), neutral: row(2, 2, 0), negative: row(1, 1, 0) },
  journey: { improved: 3, unchanged: 6, worsened: 1 },
  trend: [
    { start: new Date('2026-08-01T00:00:00Z'), count: 10, customerScore: 0.2, agentScore: 0.7 },
  ],
  bySubject: [{ subject: 'پس از صدور', count: 10, customerScore: 0.2, agentScore: 0.7 }],
  byOperator: [
    { operator: 'سارا احمدی', count: 10, customerScore: 0.2, agentScore: 0.7, improvedShare: 0.3 },
  ],
};

const fakeRepository = () =>
  ({ getSentimentOverview: vi.fn(async () => overview) }) as unknown as AnalyticsRepository;

const renderTab = (repository: AnalyticsRepository) =>
  renderWithProviders({
    initialPath: '/dashboard',
    routes: [{ path: '/dashboard', element: <SentimentTab /> }],
    wrapper: (children) => (
      <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
    ),
  });

beforeEach(() => resetDashboardFilters());

describe('SentimentTab', () => {
  it('shows a gauge per side with its score', async () => {
    renderTab(fakeRepository());

    expect(await screen.findByRole('figure', { name: 'احساس مشتریان: +۲۰' })).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: 'احساس اپراتورها: +۷۰' })).toBeInTheDocument();
  });

  it('filters the dashboard by customer sentiment from the matrix', async () => {
    const repository = fakeRepository();
    renderTab(repository);

    await userEvent.click(
      await screen.findByRole('button', { name: 'مشتری منفی — اپراتور مثبت: ۱' }),
    );

    expect(repository.getSentimentOverview).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { sentiment: 'negative' } }),
    );
  });
});
