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

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type Priority = 'low' | 'medium' | 'high';

export interface Customer {
  nationalId: string;
  mobile: string;
  fullName: string;
  corporateName?: string;
}

/** Three-level categorization (Subject1/2/3 = نوع اصلی شکایت / نوع شکایت / علت شکایت). */
export interface SubjectPath {
  level1: string;
  level2: string;
  level3: string;
}

/** Data produced by SMART (AI + voice). Attached to a CRM ticket, never overwriting it. */
export interface TicketEnrichment {
  sentiment: Sentiment;
  priority: Priority;
  aiTags: string[];
  voiceId?: string;
  transcript?: string;
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
  insuranceLine: string;
  branch: string;
  complaintOwner: string;
  followUpOwner: string;
  complaintText: string;
  finalResponse?: string;
  enrichment: TicketEnrichment | null;
}
