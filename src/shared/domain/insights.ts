
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface SubjectPath {
  level1: string;
  level2: string;
  level3: string;
}

export interface SubjectNode {
  label: string;
  children: SubjectNode[];
}

export type Speaker = 'agent' | 'customer';

export interface TranscriptLine {
  speaker: Speaker;
  text: string;
  atSec: number;
  sentiment?: Sentiment;
}

export const sentimentScore = (values: readonly Sentiment[]) =>
  values.length
    ? (values.filter((s) => s === 'positive').length -
        values.filter((s) => s === 'negative').length) /
      values.length
    : 0;

export const SENTIMENT_SHIFTS = ['improved', 'unchanged', 'worsened'] as const;
export type SentimentShift = (typeof SENTIMENT_SHIFTS)[number];

const sentimentRank: Record<Sentiment, number> = { negative: 0, neutral: 1, positive: 2 };

export const sentimentShift = (
  lines: readonly TranscriptLine[],
  speaker: Speaker = 'customer',
): SentimentShift | undefined => {
  const scored = lines.filter((line) => line.speaker === speaker && line.sentiment);
  const first = scored[0]?.sentiment;
  const last = scored.at(-1)?.sentiment;
  if (scored.length < 2 || !first || !last) return undefined;
  const delta = sentimentRank[last] - sentimentRank[first];
  return delta > 0 ? 'improved' : delta < 0 ? 'worsened' : 'unchanged';
};

export const talkShare = (lines: readonly TranscriptLine[]): Record<Speaker, number> => {
  const words = (speaker: Speaker) =>
    lines
      .filter((line) => line.speaker === speaker)
      .reduce((sum, line) => sum + line.text.split(/\s+/).filter(Boolean).length, 0);
  const agent = words('agent');
  const customer = words('customer');
  const total = agent + customer;
  return total ? { agent: agent / total, customer: customer / total } : { agent: 0, customer: 0 };
};

export interface VoiceRecording {
  voiceId: string;
  durationSec: number;
  url?: string;
}
