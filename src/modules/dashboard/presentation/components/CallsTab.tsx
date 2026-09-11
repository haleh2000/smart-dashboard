import { formatElapsed, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { BarList, Panel, StatCard } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useCallHeatmap, useCallStats, useRepeatCalls } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { Heatmap } from './Heatmap';
import './KpiCards.css';

/** «تعداد تماس‌های ورودی، جاری و پاسخ‌داده‌شده». */
export function CallStatsCards() {
  const scope = useDashboardScope();
  const query = useCallStats(scope);
  return (
    <ChartState query={query} skeletonRows={2}>
      {(stats) => (
        <div className="cards">
          <StatCard
            label="تماس‌های ورودی"
            value={formatPersianNumber(stats.incoming)}
            tone="primary"
          />
          <StatCard label="در حال زنگ" value={formatPersianNumber(stats.ringing)} tone="warning" />
          <StatCard
            label="تماس‌های جاری"
            value={formatPersianNumber(stats.ongoing)}
            tone="warning"
          />
          <StatCard
            label="پاسخ‌داده‌شده"
            value={formatPersianNumber(stats.answered)}
            tone="success"
          />
          <StatCard label="از دست رفته" value={formatPersianNumber(stats.missed)} tone="error" />
          <StatCard label="نرخ پاسخ‌گویی" value={formatPercent(stats.answerRate)} />
          <StatCard label="میانگین انتظار در صف" value={formatElapsed(stats.avgWaitSec)} />
          <StatCard label="میانگین مکالمه" value={formatElapsed(stats.avgTalkSec)} />
        </div>
      )}
    </ChartState>
  );
}

function HeatmapPanel() {
  const scope = useDashboardScope();
  const togglePair = useDashboardFilterStore((state) => state.togglePair);
  const query = useCallHeatmap(scopeForChart(scope, 'weekday', 'hour'));
  return (
    <Panel title="ساعات پرترافیک — تراکم تماس‌ها بر اساس روز و ساعت">
      <ChartState query={query} isEmpty={(data) => data.max === 0} skeletonRows={7}>
        {(data) => (
          <Heatmap
            data={data}
            selectedWeekday={scope.filters.weekday}
            selectedHour={scope.filters.hour}
            onSelect={(weekday, hour) => togglePair(['weekday', weekday], ['hour', hour])}
          />
        )}
      </ChartState>
    </Panel>
  );
}

const bucketLabels = {
  '1': '۱ تماس',
  '2': '۲ تماس',
  '3': '۳ تماس',
  '4+': '۴ تماس و بیشتر',
} as const;

/** «نرخ تکرار تماس»: calls per customer until the issue is solved, and time to solve. */
function RepeatCallsPanel() {
  const scope = useDashboardScope();
  const query = useRepeatCalls(scope);
  return (
    <Panel title="نرخ تکرار تماس">
      <ChartState query={query}>
        {(stats) => {
          const customers = stats.distribution.reduce((sum, d) => sum + d.customers, 0);
          return (
            <div className="dashboard__section">
              <div className="cards">
                <StatCard
                  label="نرخ تکرار"
                  value={formatPercent(stats.repeatRate)}
                  tone="warning"
                />
                <StatCard
                  label="میانگین تماس هر مشتری"
                  value={formatPersianNumber(stats.avgCallsPerCustomer.toFixed(1)).replace(
                    '.',
                    '٫',
                  )}
                />
                <StatCard
                  label="میانگین زمان تا حل"
                  value={stats.avgTimeToResolveSec ? formatElapsed(stats.avgTimeToResolveSec) : '—'}
                />
              </div>
              <BarList
                series={2}
                rows={stats.distribution.map((d) => ({
                  label: bucketLabels[d.bucket],
                  count: d.customers,
                  share: customers ? d.customers / customers : 0,
                }))}
              />
            </div>
          );
        }}
      </ChartState>
    </Panel>
  );
}

/** README → «تماس‌ها»: incoming / ongoing / answered calls and peak hours. */
export function CallsTab() {
  return (
    <div className="dashboard__section">
      <CallStatsCards />
      <HeatmapPanel />
      <RepeatCallsPanel />
    </div>
  );
}
