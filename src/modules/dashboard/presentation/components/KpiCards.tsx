import {
  formatElapsed,
  formatPercent,
  formatPersianNumber,
  formatSignedPercent,
} from '@/shared/lib/format';
import { StatCard } from '@/shared/ui';
import type { KpiKey } from '../../domain/analytics';
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
  const delta = (key: KpiKey) => {
    if (data === undefined) return undefined;
    const change = data.hourDelta[key];
    return `${change === undefined ? '—' : formatSignedPercent(change)} نسبت به ساعت قبل`;
  };

  return (
    <div className="cards">
      <StatCard
        label="کل تیکت‌ها"
        subtitle={delta('total')}
        value={count(data?.total)}
        tone="primary"
      />
      <StatCard label="باز" subtitle={delta('open')} value={count(data?.open)} tone="warning" />
      <StatCard label="در حال بررسی" subtitle={delta('inReview')} value={count(data?.inReview)} />
      <StatCard
        label="بسته‌شده"
        subtitle={delta('closed')}
        value={count(data?.closed)}
        tone="success"
      />
      <StatCard
        label="نرخ حل"
        subtitle={delta('resolutionRate')}
        value={percent(data?.resolutionRate)}
      />
      <StatCard
        label="خارج از SLA"
        subtitle={delta('overdue')}
        value={count(data?.overdue)}
        tone="error"
      />
      <StatCard
        label="FCR (حل در اولین تماس)"
        subtitle={delta('fcrRate')}
        value={percent(data?.fcrRate)}
        tone="success"
      />
      <StatCard
        label="نرخ تکرار تماس"
        subtitle={delta('repeatCallRate')}
        value={percent(data?.repeatCallRate)}
        tone="warning"
      />
      <StatCard
        label="میانگین زمان حل"
        subtitle={delta('avgResolutionSec')}
        value={
          data ? (data.avgResolutionSec ? formatElapsed(data.avgResolutionSec) : '—') : PLACEHOLDER
        }
      />
    </div>
  );
}
