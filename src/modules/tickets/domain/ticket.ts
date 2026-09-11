import type {
  Priority,
  Sentiment,
  SubjectPath,
  TranscriptLine,
  VoiceRecording,
} from '@/shared/domain/insights';

export type { Priority, Sentiment, SubjectPath };

/**
 * Ticket as received from CRM (the source of truth) plus SMART enrichment.
 * Field names follow README → "صفحه‌های تیکت بر اساس CRM فعلی"; re-check them against api.yml.
 */
export const TICKET_STATUSES = [
  'pending',
  'inProgress',
  'registered',
  'underReview',
  'referred',
  'closed',
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type Gender = 'male' | 'female';

export interface Customer {
  nationalId: string;
  mobile: string;
  fullName: string;
  gender?: Gender;
  /** «مشتری سازمانی» — the organization the customer is insured through. */
  corporateName?: string;
}

/** Data produced by SMART (AI + voice). Attached to a CRM ticket, never overwriting it. */
export interface TicketEnrichment {
  sentiment: Sentiment;
  priority: Priority;
  aiTags: string[];
  /** «Auto Label»: the AI's one-line classification of the conversation. */
  autoLabel: string;
  /** «Topic» detected by the AI (may differ from the CRM subject). */
  topic: string;
  /** «Suggested Scenario»: the playbook the AI recommends for handling the ticket. */
  suggestedScenario?: string;
  voice?: VoiceRecording;
  transcript: TranscriptLine[];
}

export interface Ticket {
  id: string;
  createdAt: Date;
  /** CRM ticket type, e.g. «گفت‌وگو»، «شکایت». */
  type: string;
  status: TicketStatus;
  channel: string;
  customer: Customer;
  subject: SubjectPath;
  /** «نوع بیمه‌نامه». */
  insuranceLine: string;
  branch: string;
  complaintOwner: string;
  followUpOwner: string;
  complaintText: string;
  finalResponse?: string;
  /** «شماره پرونده» (claim / plate number). */
  fileNumber?: string;
  description?: string;
  /** «ریشه‌یابی». */
  rootCause?: string;
  /** «درخواست مالک پیگیری تیکت». */
  followUpRequest?: string;
  /** «نظر امور مشتریان در خصوص SLA». */
  slaOpinion?: string;
  /** Working days left on the SLA; negative when overdue. */
  slaRemainingDays: number;
  referralCount: number;
  firstResponseAt?: Date;
  closedAt?: Date;
  /** Per-user bookmark kept by SMART («ستاره‌دار کردن»). */
  starred: boolean;
  enrichment: TicketEnrichment | null;
}

export const isOverdue = (ticket: Pick<Ticket, 'slaRemainingDays' | 'status'>) =>
  ticket.status !== 'closed' && ticket.slaRemainingDays < 0;

/** «جریان‌ها»: what happened to the ticket, in order. */
export const TICKET_EVENT_KINDS = [
  'created',
  'assigned',
  'referred',
  'call',
  'statusChanged',
  'responded',
  'closed',
] as const;
export type TicketEventKind = (typeof TICKET_EVENT_KINDS)[number];

export interface TicketEvent {
  id: string;
  at: Date;
  kind: TicketEventKind;
  actor: string;
  description: string;
}

/** «آپدیت‌ها»: a CRM field change. */
export interface TicketUpdate {
  id: string;
  at: Date;
  actor: string;
  field: string;
  from?: string;
  to: string;
}

/** «یادداشت‌ها». */
export interface TicketNote {
  id: string;
  at: Date;
  author: string;
  text: string;
}

/** «اسناد». */
export interface TicketDocument {
  id: string;
  name: string;
  sizeBytes: number;
  uploadedAt: Date;
  url?: string;
}

export const NOTE_MAX_LENGTH = 1000;

export type NoteError = 'empty' | 'tooLong';

/** Returns why the note can't be saved, or null when it can. */
export const validateNote = (text: string): NoteError | null => {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';
  if (trimmed.length > NOTE_MAX_LENGTH) return 'tooLong';
  return null;
};
