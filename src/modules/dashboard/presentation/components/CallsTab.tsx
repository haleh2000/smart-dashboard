import { formatElapsed, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Panel, StatCard } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useCallHeatmap, useCallStats, useRepeatCalls } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { hourLabel, weekdayLabels } from '../dimensionLabels';
import { ColumnChart } from './charts/ColumnChart';
import { VolumeAreaChart } from './charts/VolumeAreaChart';
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

/** Calls per hour and per weekday: the heatmap's margins, as two readable charts. */
function PeakPanels() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const byHour = useCallHeatmap(scopeForChart(scope, 'hour'));
  const byWeekday = useCallHeatmap(scopeForChart(scope, 'weekday'));
  const share = (value: number, total: number) => (total ? value / total : 0);
  return (
    <div className="dashboard__grid dashboard__grid--wide">
      <Panel title="حجم تماس بر اساس ساعت">
        <ChartState query={byHour} isEmpty={(data) => data.max === 0} skeletonRows={5}>
          {(data) => {
            const hours = Array.from({ length: 24 }, (_, hour) =>
              data.counts.reduce((sum, row) => sum + (row[hour] ?? 0), 0),
            );
            const total = hours.reduce((sum, n) => sum + n, 0);
            return (
              <VolumeAreaChart
                label="تماس‌ها"
                items={hours.map((value, hour) => ({
                  key: String(hour),
                  label: hourLabel(hour),
                  value,
                  share: share(value, total),
                }))}
                selectedKey={scope.filters.hour}
                onSelect={(hour) => toggle('hour', hour)}
              />
            );
          }}
        </ChartState>
      </Panel>
      <Panel title="حجم تماس بر اساس روز هفته">
        <ChartState query={byWeekday} isEmpty={(data) => data.max === 0} skeletonRows={5}>
          {(data) => {
            const days = data.counts.map((row) => row.reduce((sum, n) => sum + n, 0));
            const total = days.reduce((sum, n) => sum + n, 0);
            const selectedDay = scope.filters.weekday;
            return (
              <ColumnChart
                label="تماس‌ها"
                series={4}
                height={260}
                items={days.map((value, day) => ({
                  label: weekdayLabels[day] ?? String(day),
                  value,
                  share: share(value, total),
                }))}
                selected={
                  selectedDay === undefined ? undefined : weekdayLabels[Number(selectedDay)]
                }
                onSelect={(label) => toggle('weekday', String(weekdayLabels.indexOf(label)))}
              />
            );
          }}
        </ChartState>
      </Panel>
    </div>
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
              <ColumnChart
                label="تعداد مشتریان"
                series={1}
                height={240}
                items={stats.distribution.map((d) => ({
                  label: bucketLabels[d.bucket],
                  value: d.customers,
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
      <PeakPanels />
      <HeatmapPanel />
      <RepeatCallsPanel />
    </div>
  );
}
