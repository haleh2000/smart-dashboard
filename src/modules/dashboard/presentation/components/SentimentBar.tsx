import type { BreakdownItem } from '../../domain/analytics';
import { splitFromBreakdown } from '../../domain/sentimentLevels';
import { CustomerSentimentFaces } from './SentimentFaces';

interface SentimentBarProps {
  items: readonly BreakdownItem[];
  selected?: string;
  onSelect: (sentiment: string) => void;
}

/**
 * «تحلیل احساسات مشتریان»: same data and same behavior as before — one click
 * toggles the dashboard `sentiment` cross-filter (`positive` / `neutral` /
 * `negative`), a second click clears it — only the look changed: five
 * illustrated mood faces instead of the 100% stacked bar.
 */
export function SentimentBar({ items, selected, onSelect }: SentimentBarProps) {
  const { split, total } = splitFromBreakdown(items);
  return (
    <CustomerSentimentFaces
      split={split}
      analyzed={total}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
