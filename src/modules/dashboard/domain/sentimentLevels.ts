import type { Sentiment } from '@/shared/domain/insights';
import {
  SENTIMENT_LEVELS,
  type BreakdownItem,
  type SentimentLevel,
  type SentimentLevelRow,
  type SentimentSplit,
} from './analytics';

export { SENTIMENT_LEVELS };
export type { SentimentLevel, SentimentLevelRow };

/** Which dashboard `sentiment` filter each face toggles (cross-filtering parity). */
export const levelFilterValue: Record<SentimentLevel, 'positive' | 'neutral' | 'negative'> = {
  angry: 'negative',
  dissatisfied: 'negative',
  neutral: 'neutral',
  satisfied: 'positive',
  verySatisfied: 'positive',
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Estimates the five face levels from a three-bucket split alone. Only for
 * sources that report no per-call score (the ticket breakdown); call data uses
 * `classifySentimentLevel` per call instead. The outer buckets are divided by
 * score intensity (a strongly positive score puts most of the positive bucket
 * on «کاملا راضی», a barely positive one on «راضی», and symmetrically for the
 * negative side); the neutral bucket passes through untouched. Counts always
 * add up to the split total exactly.
 */
export function toFiveLevelSentiment(split: SentimentSplit): SentimentLevelRow[] {
  const { positive, neutral, negative, score } = split;
  const total = positive + neutral + negative;

  // 0.15 mirrors `scoreSentiment`'s neutral band; beyond it intensity grows to 1.
  const positiveIntensity = clamp01((score - 0.15) / 0.85);
  const negativeIntensity = clamp01((-score - 0.15) / 0.85);

  const verySatisfied = Math.round(positive * (0.35 + 0.45 * positiveIntensity));
  const angry = Math.round(negative * (0.35 + 0.45 * negativeIntensity));

  const counts: Record<SentimentLevel, number> = {
    angry,
    dissatisfied: negative - angry,
    neutral,
    satisfied: positive - verySatisfied,
    verySatisfied,
  };

  return SENTIMENT_LEVELS.map((level) => ({
    level,
    count: counts[level],
    share: total ? counts[level] / total : 0,
  }));
}

/** The level holding the most customers (first one wins ties). */
export function dominantLevel(rows: readonly SentimentLevelRow[]): SentimentLevel {
  let best: SentimentLevel = 'neutral';
  let bestCount = -1;
  for (const row of rows) {
    if (row.count > bestCount) {
      bestCount = row.count;
      best = row.level;
    }
  }
  return best;
}

/**
 * Classifies a record's sentiment into one of the five face levels.
 * Uses the 3-bucket sentiment plus a -1..1 score (e.g. computed from the
 * transcript) to distinguish angry from dissatisfied (and satisfied from
 * verySatisfied) within the same bucket.
 */
export const classifySentimentLevel = (
  sentiment: Sentiment | undefined,
  score: number,
): SentimentLevel => {
  if (sentiment === 'neutral' || sentiment === undefined) return 'neutral';
  if (sentiment === 'positive') return score >= 0.75 ? 'verySatisfied' : 'satisfied';
  // negative
  return score <= -0.75 ? 'angry' : 'dissatisfied';
};

/**
 * Rebuilds a `SentimentSplit` from `sentiment` breakdown items (ticket tab),
 * so the faces panel can render them. The score uses the same definition as
 * the backend (`sentimentScore`: positive share minus negative share).
 */
export function splitFromBreakdown(items: readonly BreakdownItem[]): {
  split: SentimentSplit;
  total: number;
} {
  const countOf = (value: string) => items.find((item) => item.value === value)?.count ?? 0;
  const positive = countOf('positive');
  const neutral = countOf('neutral');
  const negative = countOf('negative');
  const total = positive + neutral + negative;
  return {
    split: {
      positive,
      neutral,
      negative,
      score: total ? (positive - negative) / total : 0,
    },
    total,
  };
}
