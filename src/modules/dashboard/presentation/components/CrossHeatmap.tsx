import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { formatPersianNumber } from '@/shared/lib/format';
import type { CrossBreakdown } from '../../domain/analytics';
import { useChartTooltip } from './ChartTooltip';
import './CrossHeatmap.css';

const DEFAULT_MAX_VISIBLE = 5;

interface CrossHeatmapProps {
  data: CrossBreakdown;
  selectedRow?: string;
  selectedColumn?: string;
  onSelectRow: (row: string) => void;
  onSelectSegment: (row: string, column: string) => void;
  formatColumn?: (value: string) => string;
  /** Custom display order for rows. Unlisted rows go to the end. */
  rowOrder?: readonly string[];
  maxVisibleRows?: number;
}

export function CrossHeatmap({
  data,
  selectedRow,
  selectedColumn,
  onSelectRow,
  onSelectSegment,
  formatColumn = (v) => v,
  rowOrder,
  maxVisibleRows = DEFAULT_MAX_VISIBLE,
}: CrossHeatmapProps) {
  const { bind, tooltip } = useChartTooltip();
  const [expanded, setExpanded] = useState(false);
  const hasSelection = selectedRow !== undefined || selectedColumn !== undefined;

  const sortedRows = rowOrder
    ? [...data.rows].sort((a, b) => {
        const ai = rowOrder.indexOf(a.value);
        const bi = rowOrder.indexOf(b.value);
        return (ai >= 0 ? ai : rowOrder.length) - (bi >= 0 ? bi : rowOrder.length);
      })
    : data.rows;

  const hasOverflow = maxVisibleRows > 0 && sortedRows.length > maxVisibleRows;
  const visibleRows = hasOverflow && !expanded ? sortedRows.slice(0, maxVisibleRows) : sortedRows;

  const maxCellShare = sortedRows.reduce((max, row) => {
    const rowTotal = row.total || 1;
    return Math.max(max, ...row.cells.map((c) => c.count / rowTotal));
  }, 0);

  return (
    <div className="cross-hm-wrap">
      <div
        className="cross-hm"
        role="grid"
        aria-label="نقشه حرارتی کانال به تفکیک نوع"
        style={{ '--cross-hm-cols': data.columns.length } as React.CSSProperties}
      >
        {/* Header row */}
        <div className="cross-hm__row" role="row">
          <div className="cross-hm__corner" />
          {data.columns.map((col) => (
            <div key={col} className="cross-hm__col-head" role="columnheader" title={formatColumn(col)}>
              {formatColumn(col)}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {visibleRows.map((row) => {
          const rowTotal = row.total || 1;
          const isSelected = selectedRow === row.value;
          return (
            <div
              key={row.value}
              className={cn(
                'cross-hm__row',
                hasSelection && !isSelected && !row.cells.some((c) => selectedColumn === c.value) && 'cross-hm__row--dimmed'
              )}
              role="row"
            >
              <button
                type="button"
                className={cn('cross-hm__row-label', isSelected && 'cross-hm__row-label--active')}
                onClick={() => onSelectRow(row.value)}
                title={row.value}
              >
                {row.value}
                <span className="cross-hm__row-total">{formatPersianNumber(row.total)}</span>
              </button>
              {data.columns.map((col) => {
                const cell = row.cells.find((c) => c.value === col);
                const count = cell?.count ?? 0;
                const share = count / rowTotal;
                const intensity = maxCellShare > 0 ? Math.round((share / maxCellShare) * 100) : 0;
                const cellSelected = isSelected && selectedColumn === col;

                // ۵۰٪ و کمتر سفید می‌مانند، بالاتر از ۵۰٪ مشکی می‌شوند
                const isBrightBackground = intensity > 70;

                return (
                  <button
                    key={col}
                    type="button"
                    className={cn(
                      'cross-hm__cell',
                      hasSelection && !cellSelected && 'cross-hm__cell--dimmed'
                    )}
                    style={{
                      background: `color-mix(in srgb, var(--chart-series-1) ${intensity}%, var(--chart-track))`,
                    }}
                    onClick={() => onSelectSegment(row.value, col)}
                    {...bind({
                      title: `${row.value} — ${formatColumn(col)}`,
                      count,
                      share: rowTotal ? count / rowTotal : 0,
                    })}
                  >
                    {count > 0 ? (
                      <span
                        style={{
                          color: isBrightBackground ? '#000000' : '#ffffff',
                          fontWeight: 500,
                        }}
                        >
                        {formatPersianNumber(Math.round(share * 100))}٪
                      </span>
                    ) : ''}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {hasOverflow && (
        <div className="cross-hm__toggle-row">
          <button
            type="button"
            className="cross-hm__toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'کمتر' : `بیشتر `}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Legend scale */}
      <div className="cross-hm__scale" aria-hidden="true">
        <span>کم</span>
        <span className="cross-hm__scale-bar" />
        <span>زیاد</span>
      </div>
      <p className="cross-hm__note">اعداد کنار هر عنوان، تعداد کل تیکت‌های آن کانال را نشان می‌دهد.</p>
      {tooltip}
    </div>
  );
}
