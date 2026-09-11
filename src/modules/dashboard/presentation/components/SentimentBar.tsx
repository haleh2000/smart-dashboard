import { SENTIMENTS } from '@/shared/domain/insights';
import { cn } from '@/shared/lib/cn';
import { formatPercent, formatPersianNumber } from '@/shared/lib/format';
import { sentimentMeta } from '@/shared/ui';
import type { BreakdownItem } from '../../domain/analytics';
import { useChartTooltip } from './ChartTooltip';
import { Legend } from './StackedBars';
import './StackedBars.css';
import './SentimentBar.css';

/** Positive → teal, neutral → blue, negative → coral (chart-series tokens only). */
const sentimentColor = {
  positive: 'var(--chart-series-1)',
  neutral: 'var(--chart-series-5)',
  negative: 'var(--chart-series-2)',
} as const;

interface SentimentBarProps {
  items: readonly BreakdownItem[];
  selected?: string;
  onSelect: (sentiment: string) => void;
}

/** «تحلیل احساسات»: one 100% bar split into positive / neutral / negative. */
export function SentimentBar({ items, selected, onSelect }: SentimentBarProps) {
  const { bind, tooltip } = useChartTooltip();
  const segments = SENTIMENTS.map((sentiment) => ({
    sentiment,
    item: items.find((item) => item.value === sentiment),
  }));

  return (
    <div className="sentiment-bar">
      <Legend
        items={SENTIMENTS.map((s) => ({ label: sentimentMeta[s].label, color: sentimentColor[s] }))}
      />
      <div className="stacked__bar sentiment-bar__track">
        {segments.map(({ sentiment, item }) =>
          item && item.count > 0 ? (
            <button
              key={sentiment}
              type="button"
              className={cn(
                'stacked__segment',
                selected !== undefined && selected !== sentiment && 'stacked__segment--dimmed',
              )}
              style={{ flexGrow: item.count, background: sentimentColor[sentiment] }}
              aria-pressed={selected === sentiment}
              aria-label={`${sentimentMeta[sentiment].label}: ${formatPersianNumber(item.count)} (${formatPercent(item.share)})`}
              onClick={() => onSelect(sentiment)}
              {...bind({
                title: sentimentMeta[sentiment].label,
                count: item.count,
                share: item.share,
              })}
            />
          ) : null,
        )}
      </div>
      <dl className="sentiment-bar__figures">
        {segments.map(({ sentiment, item }) => (
          <div key={sentiment} className="sentiment-bar__figure">
            <dt>{sentimentMeta[sentiment].label}</dt>
            <dd>{formatPercent(item?.share ?? 0)}</dd>
          </div>
        ))}
      </dl>
      {tooltip}
    </div>
  );
}
