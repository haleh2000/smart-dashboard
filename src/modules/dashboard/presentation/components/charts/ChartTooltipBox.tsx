import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import '../ChartTooltip.css';

export interface TooltipRow {
  name: string;
  value: number;
  color: string;
  /** Between 0 and 1. */
  share?: number;
}

interface ChartTooltipBoxProps {
  title: string;
  rows: readonly TooltipRow[];
  /** Formats values that aren't plain counts (durations, percentages). */
  format?: (value: number) => string;
  footer?: string;
}

/** «Hover → Tooltip با تعداد و درصد», rendered inside a Recharts `<Tooltip content>`. */
export function ChartTooltipBox({
  title,
  rows,
  format = formatPersianNumber,
  footer,
}: ChartTooltipBoxProps) {
  return (
    <div className="chart-tooltip chart-tooltip--static" role="tooltip">
      <strong className="chart-tooltip__title">{title}</strong>
      {rows.map((row) => (
        <span key={row.name} className="chart-tooltip__row">
          <span className="chart-tooltip__swatch" style={{ background: row.color }} />
          {rows.length > 1 && <span className="chart-tooltip__name">{row.name}</span>}
          <span className="chart-tooltip__value">
            {format(row.value)}
            {row.share !== undefined && ` · ${formatPercent(row.share)}`}
          </span>
        </span>
      ))}
      {footer && <span className="chart-tooltip__subtitle">{footer}</span>}
    </div>
  );
}
