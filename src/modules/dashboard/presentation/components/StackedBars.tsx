import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import type { CrossBreakdown } from '../../domain/analytics';
import { seriesColor } from './chartColors';
import { useChartTooltip } from './ChartTooltip';
import './StackedBars.css';

const DEFAULT_MAX_VISIBLE = 5;

interface StackedBarsProps {
  data: CrossBreakdown;
  /** Selected row / column values (from the filter store). */
  selectedRow?: string;
  selectedColumn?: string;
  onSelectRow: (row: string) => void;
  /** A segment filters by both its row and its column. */
  onSelectSegment: (row: string, column: string) => void;
  formatColumn?: (value: string) => string;
  /** Show this many rows before collapsing with a "more" button. 0 = no limit. */
  maxVisibleRows?: number;
  /** Custom display order for rows. Unlisted rows go to the end. */
  rowOrder?: readonly string[];
}

/** 100% stacked bars («%GT Count of … by … and ChanelType»): one row per value, split by column. */
export function StackedBars({
  data,
  selectedRow,
  selectedColumn,
  onSelectRow,
  onSelectSegment,
  formatColumn = (value) => value,
  maxVisibleRows = DEFAULT_MAX_VISIBLE,
  rowOrder,
}: StackedBarsProps) {
  const { bind, tooltip } = useChartTooltip();
  const [expanded, setExpanded] = useState(false);
  const colorOf = (column: string) => seriesColor(data.columns.indexOf(column));

  const sortedRows = rowOrder
    ? [...data.rows].sort((a, b) => {
        const ai = rowOrder.indexOf(a.value);
        const bi = rowOrder.indexOf(b.value);
        const aRank = ai >= 0 ? ai : rowOrder.length;
        const bRank = bi >= 0 ? bi : rowOrder.length;
        return aRank - bRank;
      })
    : data.rows;

  const hasOverflow = maxVisibleRows > 0 && sortedRows.length > maxVisibleRows;
  const visibleRows = hasOverflow && !expanded ? sortedRows.slice(0, maxVisibleRows) : sortedRows;

  return (
    <div className="stacked">
      <Legend items={data.columns.map((c) => ({ label: formatColumn(c), color: colorOf(c) }))} />
      <ul className={cn('stacked__rows', hasOverflow && !expanded && 'stacked__rows--collapsed')}>
        {visibleRows.map((row) => {
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
      {hasOverflow && (
        <div className="stacked__toggle-row">
          <button
            type="button"
            className="stacked__toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'کمتر' : `بیشتر `}
            <span className={cn('stacked__toggle-icon', expanded && 'stacked__toggle-icon--expanded')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </span>
          </button>
        </div>
      )}
      {tooltip}
      <p className="cross-hm__note">اعداد کنار هر عنوان، تعداد کل تیکت‌های آن کانال را نشان می‌دهد.</p>
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
