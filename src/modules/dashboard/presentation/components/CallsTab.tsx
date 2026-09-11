import { useState, type CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatElapsed, formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { Panel, SegmentedControl, StatCard } from '@/shared/ui';
import { scopeForChart } from '../../domain/filters';
import { heatmapPeaks } from '../../domain/heatmap';
import { useDashboardFilterStore, useDashboardScope } from '../dashboardFilterStore';
import { useCallHeatmap, useCallStats, useRepeatCalls } from '../hooks/analyticsQueries';
import { ChartState } from './ChartState';
import { hourLabel, weekdayLabels } from '../dimensionLabels';
import { ColumnChart } from './charts/ColumnChart';
import { VolumeAreaChart } from './charts/VolumeAreaChart';
import { ClockHeatmap } from './ClockHeatmap';
import { Heatmap } from './Heatmap';
import { ResolutionFunnel } from './ResolutionFunnel';
import './CallsTab.css';
import './KpiCards.css';

const decimal = (value: number) => formatPersianNumber(value.toFixed(1)).replace('.', '٫');

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
            const { hourTotals, total } = heatmapPeaks(data);
            return (
              <VolumeAreaChart
                label="تماس‌ها"
                items={hourTotals.map((value, hour) => ({
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
            const { dayTotals, total } = heatmapPeaks(data);
            const selectedDay = scope.filters.weekday;
            return (
              <ColumnChart
                label="تماس‌ها"
                series={4}
                height={260}
                items={dayTotals.map((value, day) => ({
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

type HeatmapView = 'clock' | 'grid';
const viewOptions = [
  { value: 'clock', label: 'ساعت' },
  { value: 'grid', label: 'جدول' },
] as const satisfies readonly { value: HeatmapView; label: string }[];

/** «Heatmap»: when the calls peak, as a 24-hour clock (or the classic grid) plus the peak facts. */
function HeatmapPanel() {
  const scope = useDashboardScope();
  const togglePair = useDashboardFilterStore((state) => state.togglePair);
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const [view, setView] = useState<HeatmapView>('clock');
  const query = useCallHeatmap(scopeForChart(scope, 'weekday', 'hour'));
  const select = (weekday: string, hour: string) =>
    togglePair(['weekday', weekday], ['hour', hour]);

  return (
    <Panel
      title="ساعت پیک تماس‌ها — تراکم بر اساس روز و ساعت"
      actions={
        <SegmentedControl label="نمایش تراکم" options={viewOptions} value={view} onChange={setView} />
      }
    >
      <ChartState query={query} isEmpty={(data) => data.max === 0} skeletonRows={7}>
        {(data) => {
          const peaks = heatmapPeaks(data);
          const maxSlot = peaks.topSlots[0]?.count ?? 1;
          return (
            <div className={cn('peak-layout', view === 'grid' && 'peak-layout--grid')}>
              <div className="peak-layout__chart">
                {view === 'clock' ? (
                  <ClockHeatmap
                    data={data}
                    peaks={peaks}
                    selectedWeekday={scope.filters.weekday}
                    selectedHour={scope.filters.hour}
                    onSelect={select}
                  />
                ) : (
                  <Heatmap
                    data={data}
                    selectedWeekday={scope.filters.weekday}
                    selectedHour={scope.filters.hour}
                    onSelect={select}
                  />
                )}
              </div>
              <aside className="peak-facts" aria-label="خلاصه ساعات پیک">
                <div className="peak-facts__hero">
                  <span className="peak-facts__eyebrow">پیک هفته</span>
                  <strong className="peak-facts__headline">
                    {weekdayLabels[peaks.peak.weekday]} · {hourLabel(peaks.peak.hour)}
                  </strong>
                  <span className="peak-facts__sub">
                    {formatPersianNumber(peaks.peak.count)} تماس ·{' '}
                    {decimal(peaks.total ? (peaks.peak.count / peaks.total) * 168 : 0)} برابر میانگین
                    هر ساعت
                  </span>
                </div>
                <div className="peak-facts__grid">
                  <button
                    type="button"
                    className="peak-facts__fact"
                    onClick={() => toggle('weekday', String(peaks.busiestDay.weekday))}
                  >
                    <span className="peak-facts__fact-label">شلوغ‌ترین روز</span>
                    <span className="peak-facts__fact-value">
                      {weekdayLabels[peaks.busiestDay.weekday]}
                    </span>
                    <span className="peak-facts__fact-meta">
                      {formatPersianNumber(peaks.busiestDay.count)} تماس
                    </span>
                  </button>
                  <button
                    type="button"
                    className="peak-facts__fact"
                    onClick={() => toggle('hour', String(peaks.busiestHour.hour))}
                  >
                    <span className="peak-facts__fact-label">شلوغ‌ترین ساعت</span>
                    <span className="peak-facts__fact-value">
                      {hourLabel(peaks.busiestHour.hour)}
                    </span>
                    <span className="peak-facts__fact-meta">
                      {formatPersianNumber(peaks.busiestHour.count)} تماس
                    </span>
                  </button>
                  {peaks.quietestHour && (
                    <button
                      type="button"
                      className="peak-facts__fact"
                      onClick={() => toggle('hour', String(peaks.quietestHour!.hour))}
                    >
                      <span className="peak-facts__fact-label">آرام‌ترین ساعت</span>
                      <span className="peak-facts__fact-value">
                        {hourLabel(peaks.quietestHour.hour)}
                      </span>
                      <span className="peak-facts__fact-meta">
                        {formatPersianNumber(peaks.quietestHour.count)} تماس
                      </span>
                    </button>
                  )}
                </div>
                <h4 className="peak-facts__title">پرترافیک‌ترین بازه‌ها</h4>
                <ol className="peak-facts__slots">
                  {peaks.topSlots.map((slot, rank) => (
                    <li key={`${slot.weekday}-${slot.hour}`}>
                      <button
                        type="button"
                        className={cn(
                          'peak-facts__slot',
                          scope.filters.weekday === String(slot.weekday) &&
                            scope.filters.hour === String(slot.hour) &&
                            'peak-facts__slot--active',
                        )}
                        style={{ '--bar': `${(slot.count / maxSlot) * 100}%` } as CSSProperties}
                        onClick={() => select(String(slot.weekday), String(slot.hour))}
                      >
                        <span className="peak-facts__rank">{formatPersianNumber(rank + 1)}</span>
                        <span className="peak-facts__slot-name">
                          {weekdayLabels[slot.weekday]} {hourLabel(slot.hour)}
                        </span>
                        <span className="peak-facts__slot-count">
                          {formatPersianNumber(slot.count)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          );
        }}
      </ChartState>
    </Panel>
  );
}

/**
 * «تحلیل نرخ تکرار تماس»: was the issue solved in the first call, and if not, after how many
 * calls — plus the subjects that make customers call back.
 */
function RepeatCallsPanel() {
  const scope = useDashboardScope();
  const toggle = useDashboardFilterStore((state) => state.toggle);
  const query = useRepeatCalls(scope);
  return (
    <Panel title="نرخ تکرار تماس — آیا مشکل در تماس اول حل شد؟">
      <ChartState query={query}>
        {(stats) => {
          const issues = stats.resolution.reduce((sum, s) => sum + s.issues, 0);
          const first = stats.resolution.find((s) => s.step === '1')?.issues ?? 0;
          const maxRepeat = Math.max(0.01, ...stats.byReason.map((r) => r.repeatRate));
          return (
            <div className="dashboard__section">
              <div className="cards">
                <StatCard
                  label="حل در تماس اول"
                  value={formatPercent(issues ? first / issues : 0)}
                  hint={`${formatPersianNumber(first)} از ${formatPersianNumber(issues)} مسئله`}
                  tone="success"
                />
                <StatCard
                  label="نرخ تکرار تماس"
                  value={formatPercent(stats.repeatRate)}
                  hint="مشتریانی که بیش از یک بار تماس گرفتند"
                  tone="warning"
                />
                <StatCard
                  label="میانگین تماس تا حل"
                  value={stats.avgCallsToResolve ? decimal(stats.avgCallsToResolve) : '—'}
                />
                <StatCard
                  label="میانگین زمان تا حل"
                  value={stats.avgTimeToResolveSec ? formatElapsed(stats.avgTimeToResolveSec) : '—'}
                />
              </div>
              <div className="repeat-layout">
                <section>
                  <h4 className="repeat-layout__title">مسئله در کدام تماس حل شد؟</h4>
                  <ResolutionFunnel resolution={stats.resolution} />
                </section>
                <section>
                  <h4 className="repeat-layout__title">موضوعاتی که باعث تماس مجدد می‌شوند</h4>
                  <ul className="repeat-reasons">
                    {stats.byReason.map((reason) => (
                      <li key={reason.subject}>
                        <button
                          type="button"
                          className={cn(
                            'repeat-reasons__row',
                            scope.filters.subject1 !== undefined &&
                              scope.filters.subject1 !== reason.subject &&
                              'repeat-reasons__row--dimmed',
                          )}
                          style={
                            { '--bar': `${(reason.repeatRate / maxRepeat) * 100}%` } as CSSProperties
                          }
                          aria-pressed={scope.filters.subject1 === reason.subject}
                          onClick={() => toggle('subject1', reason.subject)}
                        >
                          <span className="repeat-reasons__name">{reason.subject}</span>
                          <span className="repeat-reasons__meter" aria-hidden="true" />
                          <span className="repeat-reasons__rate">
                            {formatPercent(reason.repeatRate)}
                          </span>
                          <span className="repeat-reasons__meta">
                            {formatPersianNumber(reason.issues)} مسئله · {decimal(reason.avgCalls)}{' '}
                            تماس
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          );
        }}
      </ChartState>
    </Panel>
  );
}

/** README → «تماس‌ها»: incoming / ongoing / answered calls, peak hours and repeat calls. */
export function CallsTab() {
  return (
    <div className="dashboard__section">
      <CallStatsCards />
      <HeatmapPanel />
      <PeakPanels />
      <RepeatCallsPanel />
    </div>
  );
}
