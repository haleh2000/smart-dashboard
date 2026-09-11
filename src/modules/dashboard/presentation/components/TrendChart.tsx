import { cn } from '@/shared/lib/cn';
import { formatDate, formatPersianNumber } from '@/shared/lib/format';
import type { Trend } from '../../domain/analytics';
import { seriesColor } from './chartColors';
import { useChartTooltip } from './ChartTooltip';
import { Legend } from './StackedBars';
import './TrendChart.css';

interface TrendChartProps {
  data: Trend;
  selected?: string;
  onSelect: (series: string) => void;
}

/** Weekly stacked columns («توزیع و روند کانال‌های ارتباطی»). A segment filters by its series. */
export function TrendChart({ data, selected, onSelect }: TrendChartProps) {
  const { bind, tooltip } = useChartTooltip();
  const totals = data.buckets.map((bucket) =>
    Object.values(bucket.counts).reduce((sum, n) => sum + n, 0),
  );
  const max = Math.max(1, ...totals);

  return (
    <div className="trend">
      <Legend items={data.series.map((s, i) => ({ label: s, color: seriesColor(i) }))} />
      <div className="trend__plot">
        {data.buckets.map((bucket, index) => {
          const total = totals[index] ?? 0;
          return (
            <div key={bucket.start.toISOString()} className="trend__column">
              <span className="trend__total">{formatPersianNumber(total)}</span>
              <div className="trend__stack" style={{ height: `${(total / max) * 80}%` }}>
                {data.series.map((series, seriesIndex) => {
                  const count = bucket.counts[series] ?? 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={series}
                      type="button"
                      className={cn(
                        'trend__segment',
                        selected !== undefined && selected !== series && 'trend__segment--dimmed',
                      )}
                      style={{ flexGrow: count, background: seriesColor(seriesIndex) }}
                      aria-label={`هفته ${formatDate(bucket.start)} — ${series}: ${formatPersianNumber(count)}`}
                      onClick={() => onSelect(series)}
                      {...bind({
                        title: series,
                        subtitle: `هفته منتهی به ${formatDate(new Date(bucket.start.getTime() + 6 * 86_400_000))}`,
                        count,
                        share: total ? count / total : 0,
                      })}
                    />
                  );
                })}
              </div>
              <span className="trend__label">{formatDate(bucket.start).slice(5)}</span>
            </div>
          );
        })}
      </div>
      {tooltip}
    </div>
  );
}
