import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { CallReasons, ReasonNode } from '../../domain/analytics';
import type { AnalyticsRepository } from '../../domain/AnalyticsRepository';
import { AnalyticsRepositoryProvider } from '../analyticsServices';
import { resetDashboardFilters } from '../dashboardFilterStore';
import { ReasonsTab } from './ReasonsTab';

const node = (label: string, count: number, children: ReasonNode[] = []): ReasonNode => ({
  label,
  count,
  share: count / 10,
  negativeShare: 0.2,
  fcrRate: 0.7,
  repeatShare: 0.3,
  children,
});

const reasons: CallReasons = {
  total: 10,
  aiOnly: 2,
  nodes: [
    node('پس از صدور', 6, [node('اعلام خسارت', 6, [node('ثبت پرونده خسارت', 6)])]),
    node('صدور', 4, [node('خرید', 4, [node('استعلام قیمت', 4)])]),
  ],
};

const fakeRepository = () =>
  ({
    getCallReasons: vi.fn(async () => reasons),
    getSubjectDetection: vi.fn(async () => ({
      analyzed: 10,
      match: 6,
      partial: 2,
      mismatch: 1,
      pending: 1,
      avgConfidence: 0.84,
      bySubject: [{ subject: 'صدور', count: 4, agreement: 0.75, avgConfidence: 0.8 }],
      confusions: [{ agent: 'صدور', ai: 'پس از صدور', count: 1 }],
      confidenceBands: [{ band: 'high', count: 10 }],
    })),
  }) as unknown as AnalyticsRepository;

const renderTab = (repository: AnalyticsRepository) =>
  renderWithProviders({
    initialPath: '/dashboard',
    routes: [{ path: '/dashboard', element: <ReasonsTab /> }],
    wrapper: (children) => (
      <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
    ),
  });

beforeEach(() => resetDashboardFilters());

describe('ReasonsTab', () => {
  it('drills down and cross-filters when a sunburst segment is clicked', async () => {
    const repository = fakeRepository();
    renderTab(repository);

    await userEvent.click(await screen.findByRole('button', { name: /^صدور › خرید:/ }));

    expect(repository.getSubjectDetection).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: { subject1: 'صدور', subject2: 'خرید' } }),
    );
    // The tree itself keeps querying without the subject filters.
    expect(repository.getCallReasons).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: {} }),
    );
  });

  it('shows the operator vs. AI agreement among reviewed calls', async () => {
    renderTab(fakeRepository());

    expect(
      await screen.findByRole('img', { name: 'نرخ تطابق اپراتور و AI: ۶۶٫۷٪' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/۲ تماس هنوز توسط اپراتور/)).toBeInTheDocument();
  });
});
