import { formatElapsed, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { StatCard } from '@/shared/ui';
import type { CallFilter } from '../../domain/CallRepository';
import { useCallSummary } from '../hooks/callQueries';
import './CallSummaryStrip.css';

const PLACEHOLDER = '…';

/** Headline figures for the calls matching the list's current filters. */
export function CallSummaryStrip({ filter }: { filter: CallFilter }) {
  const { data } = useCallSummary(filter);
  const count = (n?: number) => (n === undefined ? PLACEHOLDER : formatPersianNumber(n));
  const percent = (n?: number) => (n === undefined ? PLACEHOLDER : formatPercent(n));
  const answerRate = data && data.answered + data.missed ? data.answered / (data.answered + data.missed) : 0;

  return (
    <div className="call-summary" aria-label="خلاصه تماس‌ها">
      <StatCard label="کل تماس‌ها" value={count(data?.total)} tone="primary" />
      <StatCard
        label="پاسخ‌داده‌شده"
        value={count(data?.answered)}
        hint={data && `نرخ پاسخ ${formatPercent(answerRate)}`}
        tone="success"
      />
      <StatCard label="از دست رفته" value={count(data?.missed)} tone="error" />
      <StatCard label="جاری" value={count(data?.live)} tone="warning" />
      <StatCard
        label="میانگین انتظار"
        value={data ? formatElapsed(data.avgWaitSec) : PLACEHOLDER}
        hint={data && `مکالمه ${formatElapsed(data.avgTalkSec)}`}
      />
      <StatCard label="مکالمات منفی" value={percent(data?.negativeShare)} tone="error" />
      <StatCard label="دسته‌بندی‌نشده" value={count(data?.uncategorized)} tone="warning" />
      <StatCard label="تطابق AI و اپراتور" value={percent(data?.aiAgreement)} tone="success" />
    </div>
  );
}
