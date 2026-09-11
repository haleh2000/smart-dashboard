import { SENTIMENTS } from '@/shared/domain/insights';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { sentimentMeta } from '@/shared/ui';
import type { SentimentOverview } from '../../domain/analytics';
import { useChartTooltip } from './ChartTooltip';
import './SentimentTab.css';

interface SentimentMatrixProps {
  matrix: SentimentOverview['matrix'];
  /** Selected customer sentiment (dashboard filter). */
  selected?: string;
  onSelect: (customerSentiment: string) => void;
}

/**
 * Customer × operator sentiment: how often a calm, courteous operator meets an upset customer.
 * A cell filters the dashboard by its customer sentiment.
 */
export function SentimentMatrix({ matrix, selected, onSelect }: SentimentMatrixProps) {
  const { bind, tooltip } = useChartTooltip();
  const cells = SENTIMENTS.flatMap((c) => SENTIMENTS.map((a) => matrix[c][a]));
  const max = Math.max(1, ...cells);
  const total = cells.reduce((sum, n) => sum + n, 0);

  return (
    <div className="sentiment-matrix">
      <div
        className="sentiment-matrix__grid"
        role="group"
        aria-label="احساس مشتری در برابر اپراتور"
      >
        <span className="sentiment-matrix__corner">مشتری ↓ / اپراتور ←</span>
        {SENTIMENTS.map((agent) => (
          <span key={agent} className="sentiment-matrix__head">
            {sentimentMeta[agent].label}
          </span>
        ))}
        {SENTIMENTS.map((customer) => (
          <div key={customer} className="sentiment-matrix__row">
            <span className="sentiment-matrix__head sentiment-matrix__head--row">
              {sentimentMeta[customer].label}
            </span>
            {SENTIMENTS.map((agent) => {
              const count = matrix[customer][agent];
              const intensity = Math.round((count / max) * 85) + 5;
              const title = `مشتری ${sentimentMeta[customer].label} — اپراتور ${sentimentMeta[agent].label}`;
              return (
                <button
                  key={agent}
                  type="button"
                  className={cn(
                    'sentiment-matrix__cell',
                    intensity > 55 && 'sentiment-matrix__cell--strong',
                    selected !== undefined &&
                      selected !== customer &&
                      'sentiment-matrix__cell--dimmed',
                  )}
                  style={{
                    background: `color-mix(in srgb, var(--chart-series-1) ${intensity}%, var(--chart-track))`,
                  }}
                  aria-pressed={selected === customer}
                  aria-label={`${title}: ${formatPersianNumber(count)}`}
                  onClick={() => onSelect(customer)}
                  {...bind({ title, count, share: total ? count / total : 0 })}
                >
                  <strong>{formatPersianNumber(count)}</strong>
                  <small>{formatPercent(total ? count / total : 0)}</small>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {tooltip}
    </div>
  );
}
