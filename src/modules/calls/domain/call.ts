import type {
  Priority,
  Sentiment,
  SubjectPath,
  TranscriptLine,
  VoiceRecording,
} from '@/shared/domain/insights';

/**
 * A call from the call center (سیتاک), with its recording (Voices) and AI analysis.
 * Field names are provisional; re-check them against api.yml.
 */
export const CALL_STATUSES = ['ringing', 'ongoing', 'answered', 'missed'] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const CALL_DIRECTIONS = ['inbound', 'outbound'] as const;
export type CallDirection = (typeof CALL_DIRECTIONS)[number];

export interface Caller {
  mobile: string;
  /** Present when the number belongs to a known customer. */
  nationalId?: string;
  fullName?: string;
}

export interface CallAnalysis {
  sentiment: Sentiment;
  priority: Priority;
  autoLabel: string;
  topic: string;
  tags: string[];
  suggestedScenario?: string;
  /** One-paragraph AI summary of the conversation. */
  summary: string;
}

export interface Call {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  startedAt: Date;
  /** Talk time in seconds (0 for missed / ringing calls). */
  durationSec: number;
  /** Time spent in the queue before an agent answered, in seconds. */
  waitSec: number;
  caller: Caller;
  /** Call-center queue, e.g. «خسارت»، «درمان». */
  queue: string;
  agent?: string;
  /** 3-level categorization; missing until the agent categorizes the call. */
  subject?: SubjectPath;
  /** CRM ticket opened for this call, if any. */
  ticketId?: string;
  /** Whether the issue was solved in this call (FCR). */
  resolvedOnFirstCall?: boolean;
  voice?: VoiceRecording;
  transcript: TranscriptLine[];
  analysis?: CallAnalysis;
}

/** The popup payload pushed by the call center when a call rings for this agent. */
export interface IncomingCall {
  callId: string;
  startedAt: Date;
  queue: string;
  caller: Caller;
  /** Customer 360 highlights, when the caller is a known customer. */
  customer?: {
    nationalId: string;
    fullName: string;
    isVip: boolean;
    openTicketCount: number;
    lastSentiment?: Sentiment;
    /** Calls in the last 7 days, to spot repeat callers. */
    recentCallCount: number;
  };
}

export const isCategorized = (call: Pick<Call, 'subject'>) => call.subject !== undefined;

/** A partially filled path from the 3-level picker is only complete when all levels are set. */
export const isCompleteSubject = (subject: Partial<SubjectPath>): subject is SubjectPath =>
  Boolean(subject.level1 && subject.level2 && subject.level3);
