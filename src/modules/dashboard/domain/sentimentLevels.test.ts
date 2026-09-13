import { describe, expect, it } from 'vitest';
import {
  classifySentimentLevel,
  dominantLevel,
  levelFilterValue,
  splitFromBreakdown,
  toFiveLevelSentiment,
} from './sentimentLevels';

describe('toFiveLevelSentiment', () => {
  it('preserves the split total exactly', () => {
    const rows = toFiveLevelSentiment({ positive: 4, neutral: 4, negative: 2, score: 0.2 });
    expect(rows.reduce((sum, row) => sum + row.count, 0)).toBe(10);
    expect(rows.find((row) => row.level === 'neutral')?.count).toBe(4);
  });

  it('returns all zeros without dividing by zero on an empty split', () => {
    const rows = toFiveLevelSentiment({ positive: 0, neutral: 0, negative: 0, score: 0 });
    expect(rows.every((row) => row.count === 0 && row.share === 0)).toBe(true);
  });

  it('leans the positive bucket towards «very satisfied» as the score grows', () => {
    const mild = toFiveLevelSentiment({ positive: 100, neutral: 0, negative: 0, score: 0.2 });
    const strong = toFiveLevelSentiment({ positive: 100, neutral: 0, negative: 0, score: 1 });
    const mildVery = mild.find((row) => row.level === 'verySatisfied')!.count;
    const strongVery = strong.find((row) => row.level === 'verySatisfied')!.count;
    expect(strongVery).toBeGreaterThan(mildVery);
    expect(mildVery + mild.find((row) => row.level === 'satisfied')!.count).toBe(100);
  });

  it('leans the negative bucket towards «angry» as the score drops', () => {
    const mild = toFiveLevelSentiment({ positive: 0, neutral: 0, negative: 100, score: -0.2 });
    const strong = toFiveLevelSentiment({ positive: 0, neutral: 0, negative: 100, score: -1 });
    expect(strong.find((row) => row.level === 'angry')!.count).toBeGreaterThan(
      mild.find((row) => row.level === 'angry')!.count,
    );
  });

  it('maps faces to the dashboard sentiment filter values', () => {
    expect(levelFilterValue).toEqual({
      angry: 'negative',
      dissatisfied: 'negative',
      neutral: 'neutral',
      satisfied: 'positive',
      verySatisfied: 'positive',
    });
  });
});

describe('dominantLevel', () => {
  it('picks the level with the most customers', () => {
    const rows = toFiveLevelSentiment({ positive: 7, neutral: 2, negative: 1, score: 0.2 });
    expect(dominantLevel(rows)).toBe('satisfied');
  });
});

describe('splitFromBreakdown', () => {
  it('rebuilds counts and the backend-style score from breakdown items', () => {
    const { split, total } = splitFromBreakdown([
      { value: 'positive', count: 6, share: 0.6 },
      { value: 'neutral', count: 3, share: 0.3 },
      { value: 'negative', count: 1, share: 0.1 },
    ]);
    expect(total).toBe(10);
    expect(split).toEqual({ positive: 6, neutral: 3, negative: 1, score: 0.5 });
  });

  it('treats missing buckets as zero and stays zero-safe', () => {
    const { split, total } = splitFromBreakdown([]);
    expect(total).toBe(0);
    expect(split.score).toBe(0);
  });
});

describe('classifySentimentLevel', () => {
  it('classifies negative with low score as angry', () => {
    expect(classifySentimentLevel('negative', -0.8)).toBe('angry');
  });

  it('classifies negative at -0.75 as angry', () => {
    expect(classifySentimentLevel('negative', -0.75)).toBe('angry');
  });

  it('classifies negative with mild score as dissatisfied', () => {
    expect(classifySentimentLevel('negative', -0.5)).toBe('dissatisfied');
  });

  it('classifies positive with high score as verySatisfied', () => {
    expect(classifySentimentLevel('positive', 0.8)).toBe('verySatisfied');
  });

  it('classifies positive at 0.75 as verySatisfied', () => {
    expect(classifySentimentLevel('positive', 0.75)).toBe('verySatisfied');
  });

  it('classifies positive with mild score as satisfied', () => {
    expect(classifySentimentLevel('positive', 0.5)).toBe('satisfied');
  });

  it('classifies neutral as neutral', () => {
    expect(classifySentimentLevel('neutral', 0)).toBe('neutral');
  });

  it('classifies undefined sentiment as neutral', () => {
    expect(classifySentimentLevel(undefined, -0.9)).toBe('neutral');
  });
});
