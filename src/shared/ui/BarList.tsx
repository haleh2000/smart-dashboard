import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import './BarList.css';

export interface BarListRow {
  label: string;
  count: number;
  /** Share of the total, between 0 and 1. */
  share: number;
}

interface BarListProps {
  rows: readonly BarListRow[];
  /** Chart-series token index (1..5) the bars are painted with. */
  series?: 1 | 2 | 3 | 4 | 5;
  /** Currently selected row; the others fade out. */
  selected?: string;
  /** Makes every row a button (click-to-filter). */
  onSelect?: (label: string) => void;
}

/**
 * A horizontal ranking: bar width proportional to the largest entry. Preferred over a
 * pie because RTL labels stay readable and the order is unambiguous.
 */
export function BarList({ rows, series = 1, selected, onSelect }: BarListProps) {
  const largest = rows.reduce((max, row) => Math.max(max, row.count), 0);

  return (
    <ul className="bars">
      {rows.map((row) => {
        const content = (
          <>
            <div className="bars__head">
              <span className="bars__label" title={row.label}>
                {row.label}
              </span>
              <span className="bars__count">
                {formatPersianNumber(row.count)} · {formatPercent(row.share)}
              </span>
            </div>
            <div className="bars__track">
              <div
                className="bars__fill"
                style={{
                  width: largest === 0 ? '0%' : `${(row.count / largest) * 100}%`,
                  background: `var(--chart-series-${series})`,
                }}
              />
            </div>
          </>
        );
        return (
          <li
            key={row.label}
            className={cn(
              'bars__row',
              selected !== undefined && row.label !== selected && 'bars__row--dimmed',
            )}
          >
            {onSelect ? (
              <button
                type="button"
                className="bars__button"
                aria-pressed={row.label === selected}
                onClick={() => onSelect(row.label)}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
