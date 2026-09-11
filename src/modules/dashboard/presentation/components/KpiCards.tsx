import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { StatCard } from '@/shared/ui';
import { useDashboardFilterStore } from '../dashboardFilterStore';
import { useKpis } from '../hooks/analyticsQueries';
import './KpiCards.css';

const PLACEHOLDER = '…';

export function KpiCards() {
  const filters = useDashboardFilterStore((state) => state.filters);
  const { data } = useKpis(filters);
  const value = (n: number | undefined) => (n === undefined ? PLACEHOLDER : formatPersianNumber(n));

  return (
    <div className="cards">
      <StatCard label="کل تیکت‌ها" value={value(data?.total)} tone="primary" />
      <StatCard label="باز" value={value(data?.open)} tone="warning" />
      <StatCard label="بسته‌شده" value={value(data?.closed)} tone="success" />
      <StatCard label="نرخ حل" value={data ? formatPercent(data.resolutionRate) : PLACEHOLDER} />
    </div>
  );
}
