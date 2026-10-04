import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrentUserContext } from '@/modules/auth';
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
  hourDelta: { total: 0.025 },
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
    resolution: [],
    avgCallsToResolve: 0,
    byReason: [],
  })),
  getSentimentOverview: vi.fn(async () => {
    const zero = { positive: 0, neutral: 0, negative: 0 };
    return {
      analyzed: 0,
      customer: { ...zero, score: 0 },
      agent: { ...zero, score: 0 },
      matrix: { positive: zero, neutral: zero, negative: zero },
      journey: { improved: 0, unchanged: 0, worsened: 0 },
      trend: [],
      bySubject: [],
      byOperator: [],
    };
  }),
  getSubjectDetection: vi.fn(async () => ({
    analyzed: 0,
    match: 0,
    partial: 0,
    mismatch: 0,
    pending: 0,
    avgConfidence: 0,
    bySubject: [],
    confusions: [],
    confidenceBands: [],
  })),
  getCallReasons: vi.fn(async () => ({ total: 0, aiOnly: 0, nodes: [] })),
  getBranchResponseTime: vi.fn(async () => []),
});

const renderPage = (repository: AnalyticsRepository, path = '/dashboard') =>
  renderWithProviders({
    initialPath: path,
    routes: [{ path: '/dashboard', element: <DashboardPage /> }],
    wrapper: (children) => (
      <CurrentUserContext
        value={{ id: '1', fullName: 'کاربر آزمایشی', mobile: '09120000000', role: 'supervisor' }}
      >
        <AnalyticsRepositoryProvider value={repository}>{children}</AnalyticsRepositoryProvider>
      </CurrentUserContext>
    ),
  });

beforeEach(() => resetDashboardFilters());

interface PickerTarget {
  /** Jalali year, Persian digits. */
  year: string;
  month: string;
  day: string;
  hours: number;
  minutes: number;
}

/** Opens the Jalali picker on `field` and walks year → month → day → time → «تأیید». */
/** Opens the Jalali picker on `field` and walks year → month → day → time → «تأیید». */
const pickInJalaliPicker = (field: string, target: PickerTarget) => {
  // Every query is scoped to the range panel or the modal, never the dashboard.
  const panel = () => within(screen.getByRole('dialog', { name: 'بازه زمانی سفارشی' }));
  fireEvent.click(panel().getByRole('button', { name: field }));

  const modal = within(screen.getByRole('dialog', { name: field }));
  fireEvent.click(modal.getByRole('button', { name: 'انتخاب سال' }));
  fireEvent.click(modal.getByRole('button', { name: target.year }));
  fireEvent.click(modal.getByRole('button', { name: target.month }));
  fireEvent.click(
    modal.getByRole('button', { name: `${target.day} ${target.month} ${target.year}` }),
  );
  fireEvent.change(modal.getByLabelText('ساعت'), { target: { value: String(target.hours) } });
  fireEvent.change(modal.getByLabelText('دقیقه'), { target: { value: String(target.minutes) } });
  fireEvent.click(modal.getByRole('button', { name: 'تأیید' }));
};
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
      range: undefined,
    });

    await userEvent.click(chip);
    expect(screen.queryByRole('button', { name: /حذف فیلتر/ })).not.toBeInTheDocument();
  });

  it('changes the time range of every query', async () => {
    const repository = fakeRepository();
    renderPage(repository);
    await screen.findByText('۱۰');

    await userEvent.click(screen.getByRole('radio', { name: '۳۰ روز اخیر' }));
    expect(repository.getKpis).toHaveBeenLastCalledWith({
      filters: {},
      range: expect.any(Object),
    });

    await userEvent.click(screen.getByRole('radio', { name: 'همه زمان‌ها' }));
    expect(repository.getKpis).toHaveBeenLastCalledWith({ filters: {}, range: undefined });
  });

  it('filters every query with a hand-picked date and hour range, until a preset is picked', async () => {
    const repository = fakeRepository();
    renderPage(repository);
    await screen.findByText('۱۰');

    await userEvent.click(screen.getByRole('button', { name: 'انتخاب محدوده زمانی' }));
    // ۲۰ دی ۱۴۰۴ = 2026-01-10, ۲۲ دی ۱۴۰۴ = 2026-01-12.
    pickInJalaliPicker('از (تاریخ و ساعت)', {
      year: '۱۴۰۴',
      month: 'دی',
      day: '۲۰',
      hours: 8,
      minutes: 30,
    });
    pickInJalaliPicker('تا (تاریخ و ساعت)', {
      year: '۱۴۰۴',
      month: 'دی',
      day: '۲۲',
      hours: 18,
      minutes: 45,
    });
    await userEvent.click(screen.getByRole('button', { name: 'اعمال' }));

    expect(repository.getKpis).toHaveBeenLastCalledWith({
      filters: {},
      range: { from: new Date(2026, 0, 10, 8, 30), to: new Date(2026, 0, 12, 18, 45) },
    });
    // No preset stays highlighted while the custom range drives the queries.
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    }

    await userEvent.click(screen.getByRole('radio', { name: '۳۰ روز اخیر' }));
    expect(repository.getKpis).toHaveBeenLastCalledWith({
      filters: {},
      range: expect.any(Object),
    });
  });

  it('refuses to apply an inverted custom range', async () => {
    renderPage(fakeRepository());
    await screen.findByText('۱۰');

    await userEvent.click(screen.getByRole('button', { name: 'انتخاب محدوده زمانی' }));
    // Same Jalali day, so the bounds leave it selectable — the start simply
    // lands after the end.
    pickInJalaliPicker('از (تاریخ و ساعت)', {
      year: '۱۴۰۴',
      month: 'دی',
      day: '۲۰',
      hours: 18,
      minutes: 0,
    });
    pickInJalaliPicker('تا (تاریخ و ساعت)', {
      year: '۱۴۰۴',
      month: 'دی',
      day: '۲۰',
      hours: 8,
      minutes: 0,
    });

    expect(screen.getByRole('button', { name: 'اعمال' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('تاریخ شروع باید قبل از تاریخ پایان باشد.');
  });

  it('opens the tab named in the URL', async () => {
    renderPage(fakeRepository(), '/dashboard?tab=calls');

    expect(await screen.findByText('تماس‌های ورودی')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'تماس‌ها و ساعات پیک' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
