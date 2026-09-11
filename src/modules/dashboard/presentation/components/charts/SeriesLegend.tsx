import { cn } from '@/shared/lib/cn';
import './charts.css';

interface SeriesLegendProps {
  items: readonly { label: string; color: string }[];
  selected?: string;
  /** Makes each entry a filter toggle. */
  onSelect?: (label: string) => void;
}

/** Legend under a multi-series chart; identity never rests on color alone. */
export function SeriesLegend({ items, selected, onSelect }: SeriesLegendProps) {
  return (
    <ul className="series-legend">
      {items.map((item) => {
        const content = (
          <>
            <span className="series-legend__swatch" style={{ background: item.color }} />
            {item.label}
          </>
        );
        const dimmed = selected !== undefined && selected !== item.label;
        return (
          <li key={item.label}>
            {onSelect ? (
              <button
                type="button"
                className={cn('series-legend__item', dimmed && 'series-legend__item--dimmed')}
                aria-pressed={selected === item.label}
                onClick={() => onSelect(item.label)}
              >
                {content}
              </button>
            ) : (
              <span className="series-legend__item">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
