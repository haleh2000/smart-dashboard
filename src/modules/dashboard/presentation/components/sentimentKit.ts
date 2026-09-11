import type { Sentiment } from '@/shared/domain/insights';
import { formatPersianNumber } from '@/shared/lib/format';

/** Positive → teal, neutral → blue, negative → coral (chart-series tokens only). */
export const sentimentColor: Record<Sentiment, string> = {
  positive: 'var(--chart-series-1)',
  neutral: 'var(--chart-series-5)',
  negative: 'var(--chart-series-2)',
};

/** Customer = series 1, operator = series 3, everywhere the two sides are compared. */
export const sideColor = { customer: 'var(--chart-series-1)', agent: 'var(--chart-series-3)' };

/** A -1..1 score as a signed Persian figure out of 100: «+۲۴»، «−۱۲»، «۰». */
export const formatScore = (score: number) => {
  const value = Math.round(score * 100);
  if (value > 0) return `+${formatPersianNumber(value)}`;
  if (value < 0) return `−${formatPersianNumber(-value)}`;
  return formatPersianNumber(0);
};

export const scoreSentiment = (score: number): Sentiment =>
  score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral';
