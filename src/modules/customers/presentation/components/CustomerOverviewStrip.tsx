import { SENTIMENTS } from '@/shared/domain/insights';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { StatCard, sentimentMeta } from '@/shared/ui';
import { useCustomerOverview } from '../hooks/customerQueries';
import './CustomerOverviewStrip.css';

const PLACEHOLDER = '…';

/** Headline figures of the customer base, with the latest-sentiment split. */
export function CustomerOverviewStrip() {
  const { data } = useCustomerOverview();
  const count = (n?: number) => (n === undefined ? PLACEHOLDER : formatPersianNumber(n));
  const analyzed = data
    ? data.lastSentiment.positive + data.lastSentiment.neutral + data.lastSentiment.negative
    : 0;

  return (
    <div className="customer-overview">
      <div className="customer-overview__cards">
        <StatCard label="کل مشتریان" value={count(data?.total)} tone="primary" />
        <StatCard label="فعال" value={count(data?.active)} tone="success" />
        <StatCard label="VIP" value={count(data?.vip)} tone="warning" />
        <StatCard label="سازمانی" value={count(data?.corporate)} />
        <StatCard label="دارای تیکت باز" value={count(data?.withOpenTickets)} tone="warning" />
        <StatCard
          label="در معرض ریزش"
          value={count(data?.atRisk)}
          hint="آخرین مکالمه منفی"
          tone="error"
        />
      </div>
      {data && analyzed > 0 && (
        <div className="customer-overview__sentiment">
          <span className="customer-overview__title">آخرین احساس مشتریان</span>
          <div className="customer-overview__bar" role="img" aria-label="توزیع آخرین احساس مشتریان">
            {SENTIMENTS.map((s) => (
              <span
                key={s}
                className={`customer-overview__segment customer-overview__segment--${s}`}
                style={{ flexGrow: data.lastSentiment[s] }}
              />
            ))}
          </div>
          <div className="customer-overview__legend">
            {SENTIMENTS.map((s) => (
              <span key={s} className={`customer-overview__key customer-overview__key--${s}`}>
                {sentimentMeta[s].label} {formatPercent(data.lastSentiment[s] / analyzed)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
