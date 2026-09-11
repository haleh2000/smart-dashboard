import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { BreakdownItem } from '../../domain/analytics';
import { seriesColor } from './chartColors';
import { useChartTooltip } from './ChartTooltip';
import './DonutChart.css';

interface DonutChartProps {
  items: readonly BreakdownItem[];
  selected?: string;
  onSelect: (value: string) => void;
  /** Accessible name of the chart. */
  label: string;
}

const RADIUS = 38;

/** «پراکندگی موضوع اصلی تماس»: share of each value; slices and legend rows are click-to-filter. */
export function DonutChart({ items, selected, onSelect, label }: DonutChartProps) {
  const { bind, tooltip } = useChartTooltip();
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const offsets = items.map((_, i) =>
    items.slice(0, i).reduce((sum, item) => sum + item.share * 100, 0),
  );

  return (
    <div className="donut">
      <div className="donut__figure">
        <svg viewBox="0 0 100 100" className="donut__svg" role="group" aria-label={label}>
          <circle className="donut__track" cx="50" cy="50" r={RADIUS} pathLength={100} />
          {items.map((item, index) => {
            const length = item.share * 100;
            return (
              <circle
                key={item.value}
                className={cn(
                  'donut__slice',
                  selected !== undefined && item.value !== selected && 'donut__slice--dimmed',
                  item.value === selected && 'donut__slice--selected',
                )}
                cx="50"
                cy="50"
                r={RADIUS}
                pathLength={100}
                stroke={seriesColor(index)}
                strokeDasharray={`${length} ${100 - length}`}
                strokeDashoffset={-(offsets[index] ?? 0)}
                role="button"
                tabIndex={0}
                aria-pressed={item.value === selected}
                aria-label={`${item.value}: ${formatPersianNumber(item.count)} (${formatPercent(item.share)})`}
                onClick={() => onSelect(item.value)}
                onKeyDown={(event) => event.key === 'Enter' && onSelect(item.value)}
                {...bind({ title: item.value, count: item.count, share: item.share })}
              />
            );
          })}
        </svg>
        <div className="donut__center" aria-hidden="true">
          <strong>{formatPersianNumber(total)}</strong>
          <span>رکورد</span>
        </div>
      </div>

      <ul className="donut__legend">
        {items.map((item, index) => (
          <li key={item.value}>
            <button
              type="button"
              className={cn(
                'donut__legend-item',
                selected !== undefined && item.value !== selected && 'donut__legend-item--dimmed',
              )}
              aria-pressed={item.value === selected}
              onClick={() => onSelect(item.value)}
            >
              <span className="donut__swatch" style={{ background: seriesColor(index) }} />
              <span className="donut__legend-label">{item.value}</span>
              <span className="donut__legend-value">{formatPercent(item.share)}</span>
            </button>
          </li>
        ))}
      </ul>
      {tooltip}
    </div>
  );
}
