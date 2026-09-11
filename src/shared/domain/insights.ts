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
}

/** A recorded conversation from the Voices system. */
export interface VoiceRecording {
  voiceId: string;
  durationSec: number;
  /** Streamable file URL; absent when the Voices system has not exposed the file. */
  url?: string;
}
