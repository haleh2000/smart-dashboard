import type { Sentiment, SubjectNode, SubjectPath } from '@/shared/domain/insights';
import type { Page, PageRequest, Sort } from '@/shared/domain/pagination';
import type { DateRange } from '@/shared/domain/period';
import type { Call, CallDirection, CallStatus, IncomingCall } from './call';

export const CALL_SORT_FIELDS = ['startedAt', 'durationSec', 'waitSec', 'status', 'agent'] as const;
export type CallSortField = (typeof CALL_SORT_FIELDS)[number];

export interface CallFilter {
  /** Matched against call id, caller mobile, national id and name. */
  search?: string;
  status?: CallStatus;
  direction?: CallDirection;
  agent?: string;
  queue?: string;
  sentiment?: Sentiment;
  startedIn?: DateRange;
  /** Only calls still waiting for the 3-level categorization. */
  uncategorizedOnly?: boolean;
}

export interface CallQuery extends PageRequest, CallFilter {
  sort: Sort<CallSortField>;
}

export interface CallFilterOptions {
  agents: string[];
  queues: string[];
}

/** Headline figures above the call list, for the calls matching the current filters. */
export interface CallSummary {
  total: number;
  answered: number;
  missed: number;
  /** Ringing or ongoing right now. */
  live: number;
  avgWaitSec: number;
  avgTalkSec: number;
  /** Share of analyzed calls with a negative customer, between 0 and 1. */
  negativeShare: number;
  /** Answered calls still waiting for the 3-level categorization. */
  uncategorized: number;
  /** Share of categorized, analyzed calls where the AI detected the same 3-level subject. */
  aiAgreement: number;
}

/** Port: implemented by an infrastructure adapter and injected in src/app/container.ts. */
export interface CallRepository {
  list(query: CallQuery): Promise<Page<Call>>;
  summarize(filter: CallFilter): Promise<CallSummary>;
  /** Resolves to null when the call does not exist. */
  getById(id: string): Promise<Call | null>;
  getFilterOptions(): Promise<CallFilterOptions>;
  /** The category tree used by the 3-level categorization. */
  getSubjectTree(): Promise<SubjectNode[]>;
  /** Saves the agent's 3-level categorization and returns the updated call. */
  categorize(id: string, subject: SubjectPath): Promise<Call>;
  /**
   * Live feed of calls ringing for the signed-in agent (WebSocket/SSE on the real API).
   * Returns an unsubscribe function.
   */
  subscribeIncoming(listener: (call: IncomingCall) => void): () => void;
}
