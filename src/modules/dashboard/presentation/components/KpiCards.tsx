import { formatElapsed, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { StatCard } from '@/shared/ui';
import { useDashboardScope } from '../dashboardFilterStore';
import { useKpis } from '../hooks/analyticsQueries';
import './KpiCards.css';

const PLACEHOLDER = '…';

/** «KPIهای کلیدی». Ticket figures come from the ticket table; FCR and repeat calls from calls. */
export function KpiCards() {
  const scope = useDashboardScope();
  const { data } = useKpis(scope);
  const count = (n: number | undefined) => (n === undefined ? PLACEHOLDER : formatPersianNumber(n));
  const percent = (n: number | undefined) => (n === undefined ? PLACEHOLDER : formatPercent(n));

  return (
    <div className="cards">
      <StatCard label="کل تیکت‌ها" value={count(data?.total)} tone="primary" />
      <StatCard label="باز" value={count(data?.open)} tone="warning" />
      <StatCard label="در حال بررسی" value={count(data?.inReview)} />
      <StatCard label="بسته‌شده" value={count(data?.closed)} tone="success" />
      <StatCard label="نرخ حل" value={percent(data?.resolutionRate)} />
      <StatCard label="خارج از SLA" value={count(data?.overdue)} tone="error" />
      <StatCard label="FCR (حل در اولین تماس)" value={percent(data?.fcrRate)} tone="success" />
      <StatCard label="نرخ تکرار تماس" value={percent(data?.repeatCallRate)} tone="warning" />
      <StatCard
        label="میانگین زمان حل"
        value={
          data ? (data.avgResolutionSec ? formatElapsed(data.avgResolutionSec) : '—') : PLACEHOLDER
        }
      />
    </div>
  );
}
