import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { CrossBreakdown } from '../../domain/analytics';
import { seriesColor } from './chartColors';
import { useChartTooltip } from './ChartTooltip';
import './StackedBars.css';

interface StackedBarsProps {
  data: CrossBreakdown;
  /** Selected row / column values (from the filter store). */
  selectedRow?: string;
  selectedColumn?: string;
  onSelectRow: (row: string) => void;
  /** A segment filters by both its row and its column. */
  onSelectSegment: (row: string, column: string) => void;
  formatColumn?: (value: string) => string;
}

/** 100% stacked bars («%GT Count of … by … and ChanelType»): one row per value, split by column. */
export function StackedBars({
  data,
  selectedRow,
  selectedColumn,
  onSelectRow,
  onSelectSegment,
  formatColumn = (value) => value,
}: StackedBarsProps) {
  const { bind, tooltip } = useChartTooltip();
  const colorOf = (column: string) => seriesColor(data.columns.indexOf(column));

  return (
    <div className="stacked">
      <Legend items={data.columns.map((c) => ({ label: formatColumn(c), color: colorOf(c) }))} />
      <ul className="stacked__rows">
        {data.rows.map((row) => {
          const rowDimmed = selectedRow !== undefined && row.value !== selectedRow;
          return (
            <li key={row.value} className={cn('stacked__row', rowDimmed && 'stacked__row--dimmed')}>
              <button
                type="button"
                className="stacked__label"
                title={row.value}
                aria-pressed={row.value === selectedRow}
                onClick={() => onSelectRow(row.value)}
              >
                {row.value}
                <span className="stacked__total">{formatPersianNumber(row.total)}</span>
              </button>
              <div className="stacked__bar">
                {row.cells
                  .filter((cell) => cell.count > 0)
                  .map((cell) => {
                    const share = cell.count / row.total;
                    return (
                      <button
                        key={cell.value}
                        type="button"
                        className={cn(
                          'stacked__segment',
                          selectedColumn !== undefined &&
                            cell.value !== selectedColumn &&
                            'stacked__segment--dimmed',
                        )}
                        style={{ flexGrow: cell.count, background: colorOf(cell.value) }}
                        aria-label={`${row.value} — ${formatColumn(cell.value)}: ${formatPersianNumber(cell.count)} (${formatPercent(share)})`}
                        onClick={() => onSelectSegment(row.value, cell.value)}
                        {...bind({
                          title: row.value,
                          subtitle: formatColumn(cell.value),
                          count: cell.count,
                          share,
                        })}
                      />
                    );
                  })}
              </div>
            </li>
          );
        })}
      </ul>
      {tooltip}
    </div>
  );
}

export function Legend({ items }: { items: readonly { label: string; color: string }[] }) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.label} className="chart-legend__item">
          <span className="chart-legend__swatch" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
