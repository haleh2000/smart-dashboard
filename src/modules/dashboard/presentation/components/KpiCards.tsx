import { hasSla, TICKET_TYPES } from '@/modules/tickets';
import {
  formatElapsed,
  formatPercent,
  formatPersianNumber,
  formatSignedPercent,
} from '@/shared/lib/format';
import { StatCard } from '@/shared/ui';
import { scopeForChart, type DashboardScope } from '../../domain/filters';
import type { KpiKey } from '../../domain/analytics';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useBreakdown, useKpis } from '../hooks/analyticsQueries';
import './KpiCards.css';

const PLACEHOLDER = '…';

export function KpiCards({ ticketType }: { ticketType?: string }) {
  const baseScope = useDashboardScope();
  const scope: DashboardScope =
    ticketType && ticketType !== 'calls'
      ? { ...baseScope, filters: { ...baseScope.filters, type: ticketType } }
      : ticketType === 'calls'
        ? baseScope
        :
          scopeForChart(baseScope, 'type');
  const { data } = useKpis(scope);
  const count = (n: number | undefined) => (n === undefined ? PLACEHOLDER : formatPersianNumber(n));
  const percent = (n: number | undefined) => (n === undefined ? PLACEHOLDER : formatPercent(n));
  const delta = (key: KpiKey) => {
    if (data === undefined) return undefined;
    const change = data.hourDelta[key];
    return `${change === undefined ? '—' : formatSignedPercent(change)} نسبت به ساعت قبل`;
  };

  if (!ticketType) {
    return (
      <div className="cards">
        <StatCard label="کل" subtitle={delta('total')} value={count(data?.total)} tone="primary" />
        <TotalSubjectCaption />
      </div>
    );
  }

  if (ticketType === 'calls') {
    return (
      <div className="cards">
        <StatCard
          label="میانگین زمان حل"
          subtitle={delta('avgResolutionSec')}
          value={
            data ? (data.avgResolutionSec ? formatElapsed(data.avgResolutionSec) : '—') : PLACEHOLDER
          }
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
      </div>
    );
  }

  return (
    <div className="cards">
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
      {hasSla(ticketType) && (
        <StatCard
          label="خارج از SLA"
          subtitle={delta('overdue')}
          value={count(data?.overdue)}
          tone="error"
        />
      )}
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
function TotalSubjectCaption() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useBreakdown('type', scopeForChart(scope, 'type'));
  const selected = scope.filters.type ?? '';
  const countOf = new Map((query.data ?? []).map((item) => [item.value, item.count]));
  return (
    <label className="kpi-caption">
      <span>فیلتر موضوع: {selected || 'همه موضوعات'}</span>
      <select
        aria-label="فیلتر موضوع برای کل"
        value={selected}
        onChange={(event) => {
          const value = event.target.value;
          if (value) toggle('type', value);
          else if (selected) toggle('type', selected);
        }}
      >
        <option value="">همه موضوعات</option>
        {TICKET_TYPES.map((type) => (
          <option key={type} value={type}>
            {type} ({formatPersianNumber(countOf.get(type) ?? 0)})
          </option>
        ))}
      </select>
    </label>
  );
}
