/**
 * AI-analysis vocabulary shared by tickets, calls, customers and the dashboard
 * (README → «تحلیل AI»: Sentiment، Auto Label، Priority، Topic، Tag، Suggested Scenario).
 */
export const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Three-level categorization (Subject1/2/3 = موضوع اصلی / موضوع فرعی / علت). */
export interface SubjectPath {
  level1: string;
  level2: string;
  level3: string;
}

/** One node of the subject tree offered by the 3-level categorization picker. */
export interface SubjectNode {
  label: string;
  children: SubjectNode[];
}

export type Speaker = 'agent' | 'customer';

/** One utterance of a speech-to-text transcript. */
export interface TranscriptLine {
  speaker: Speaker;
  text: string;
  /** Offset from the start of the recording, in seconds. */
  atSec: number;
  /** Emotion of this utterance, as scored by the AI services. */
  sentiment?: Sentiment;
}

/** Between -1 (all negative) and 1 (all positive); 0 when there is nothing to score. */
export const sentimentScore = (values: readonly Sentiment[]) =>
  values.length
    ? (values.filter((s) => s === 'positive').length -
        values.filter((s) => s === 'negative').length) /
      values.length
    : 0;

export const SENTIMENT_SHIFTS = ['improved', 'unchanged', 'worsened'] as const;
export type SentimentShift = (typeof SENTIMENT_SHIFTS)[number];

const sentimentRank: Record<Sentiment, number> = { negative: 0, neutral: 1, positive: 2 };

/**
 * How one side's mood moved during a conversation: its first scored utterance vs. its last.
 * Undefined when that side has fewer than two scored utterances.
 */
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

/** Share of the conversation's words spoken by each side, between 0 and 1. */
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

/** A recorded conversation from the Voices system. */
export interface VoiceRecording {
  voiceId: string;
  durationSec: number;
  /** Streamable file URL; absent when the Voices system has not exposed the file. */
  url?: string;
}
