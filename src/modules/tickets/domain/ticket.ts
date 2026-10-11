import type {
  Priority,
  Sentiment,
  SubjectPath,
  TranscriptLine,
  VoiceRecording,
} from '@/shared/domain/insights';
import { toLatinDigits } from '@/shared/lib/format';

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

/**
 * ماژول‌های تیکت :
 * تماس‌ها = گفت‌وگو + ارتباط‌دهی (ورودی 1671)، تیکت‌ها = شکایت / پیگیری / درخواست / پیشنهاد.
 * بخشی از گفت‌وگوها و پیگیری‌ها (پشتیبانی هوشمند) تبدیل به تیکت/شکایت می‌شوند.
 */
export const TICKET_TYPES = [
  'گفت‌وگو',
  'ارتباط‌دهی',
  'شکایت',
  'پیگیری',
  'درخواست',
  'پیشنهاد',
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

/** نوع تماس (موضوع ۳ لایه تماس) در برابر نوع شکایت (موضوع ۳ لایه شکایت) — دو بحث جدا. */
export const CALL_TYPES: readonly string[] = ['گفت‌وگو', 'ارتباط‌دهی'];
export const COMPLAINT_TYPES: readonly string[] = ['شکایت', 'پیگیری'];
export const isCallType = (type: string) => (CALL_TYPES as readonly string[]).includes(type);

/**
 * وضعیت‌های تفصیلی شکایت — ترتیب متعارف نمایش در تب شکایات:
 * در جریان، ثبت یادداشت توسط امور مشتریان، ثبت شده، بعد بسته‌شده‌ها.
 */
export const COMPLAINT_OPEN_STATUSES = ['در جریان', 'ثبت یادداشت توسط امور مشتریان', 'ثبت شده'] as const;
export const COMPLAINT_CLOSED_STATUSES = [
  'رد شده - عدم آگاهی',
  'رد شده - خارج از ضوابط',
  'وارده - رسیدگی شده',
  'وارده - خارج از اختیارات اجرایی',
] as const;
/** پیگیری: همه وضعیت‌های شکایت + تبدیل به شکایت (تا شکایت کال نشود و آمار بالا نرود). */
export const FOLLOWUP_EXTRA_STATUSES = ['تبدیل به شکایت'] as const;
export const FOLLOWUP_OPEN_STATUSES = [...COMPLAINT_OPEN_STATUSES] as const;
export const FOLLOWUP_CLOSED_STATUSES = [
  ...COMPLAINT_CLOSED_STATUSES,
  ...FOLLOWUP_EXTRA_STATUSES,
] as const;
/** درخواست. */
export const REQUEST_OPEN_STATUSES = [
  'ثبت شده',
  'در جریان',
  'ثبت یادداشت توسط مالک پیگیری',
  'ثبت یادداشت توسط امور مشتریان',
] as const;
export const REQUEST_CLOSED_STATUSES = ['حل شده', 'رد شده'] as const;
/** پیشنهاد. */
export const SUGGESTION_OPEN_STATUSES = ['ثبت شده', 'در حال اجرا'] as const;
export const SUGGESTION_CLOSED_STATUSES = ['قابل قبول', 'غیر قابل قبول'] as const;

export const detailStatusesForType = (type: string): readonly string[] => {
  if (type === 'شکایت') return [...COMPLAINT_OPEN_STATUSES, ...COMPLAINT_CLOSED_STATUSES];
  if (type === 'پیگیری') return [...FOLLOWUP_OPEN_STATUSES, ...FOLLOWUP_CLOSED_STATUSES];
  if (type === 'درخواست') return [...REQUEST_OPEN_STATUSES, ...REQUEST_CLOSED_STATUSES];
  if (type === 'پیشنهاد') return [...SUGGESTION_OPEN_STATUSES, ...SUGGESTION_CLOSED_STATUSES];
  return [];
};

/** زیرمجموعه «باز» از وضعیت‌های تفصیلی هر ماژول (مبنای KPI «باز» در تب نوع). */
export const openDetailStatusesForType = (type: string): readonly string[] => {
  if (type === 'شکایت' || type === 'پیگیری') return [...COMPLAINT_OPEN_STATUSES];
  if (type === 'درخواست') return [...REQUEST_OPEN_STATUSES];
  if (type === 'پیشنهاد') return [...SUGGESTION_OPEN_STATUSES];
  return [];
};

/** زیرمجموعه «بسته‌شده» از وضعیت‌های تفصیلی هر ماژول (مبنای KPI «بسته‌شده»/«نرخ حل»). */
export const closedDetailStatusesForType = (type: string): readonly string[] => {
  if (type === 'شکایت') return [...COMPLAINT_CLOSED_STATUSES];
  if (type === 'پیگیری') return [...FOLLOWUP_CLOSED_STATUSES];
  if (type === 'درخواست') return [...REQUEST_CLOSED_STATUSES];
  if (type === 'پیشنهاد') return [...SUGGESTION_CLOSED_STATUSES];
  return [];
};

/** وضعیت «در حال بررسی» هر ماژول: حالتی که تیکت assign و در دست اقدام است. */
export const reviewDetailStatusesForType = (type: string): readonly string[] => {
  if (type === 'شکایت' || type === 'پیگیری' || type === 'درخواست') return ['در جریان'];
  if (type === 'پیشنهاد') return ['در حال اجرا'];
  return [];
};

const OPEN_DETAIL = new Set<string>([
  ...COMPLAINT_OPEN_STATUSES,
  ...REQUEST_OPEN_STATUSES,
  ...SUGGESTION_OPEN_STATUSES,
]);

const CLOSED_DETAIL = new Set<string>([
  ...COMPLAINT_CLOSED_STATUSES,
  ...FOLLOWUP_CLOSED_STATUSES,
  ...REQUEST_CLOSED_STATUSES,
  ...SUGGESTION_CLOSED_STATUSES,
]);

const REVIEW_DETAIL = new Set<string>(['در جریان', 'در حال اجرا']);

/** بسته‌بودن بر اساس وضعیت تفصیلی؛ وقتی خالی است به وضعیت CRM برمی‌گردیم. */
export const isClosedDetailStatus = (detailStatus: string | undefined, status: TicketStatus) =>
  detailStatus ? CLOSED_DETAIL.has(detailStatus) : status === 'closed';

/** بازبودن بر اساس وضعیت تفصیلی؛ وقتی خالی است به وضعیت CRM برمی‌گردیم. */
export const isOpenDetailStatus = (detailStatus: string | undefined, status: TicketStatus) =>
  detailStatus ? OPEN_DETAIL.has(detailStatus) : status !== 'closed';

/** «در حال بررسی» بر اساس وضعیت تفصیلی؛ وقتی خالی است به وضعیت CRM برمی‌گردیم. */
export const isReviewDetailStatus = (detailStatus: string | undefined, status: TicketStatus) =>
  detailStatus ? REVIEW_DETAIL.has(detailStatus) : REVIEWING_STATUSES.includes(status);

/** SLA فقط برای شکایت و پیگیری معنا دارد. */
export const hasSla = (type: string) => type === 'شکایت' || type === 'پیگیری';

/** «در حال بررسی»: the two CRM statuses the KPI card of the same name counts. */
export const REVIEWING_STATUSES: readonly TicketStatus[] = ['inProgress', 'underReview'];

/** «باز»: everything the CRM has not closed yet — the other side of the «بسته‌شده» KPI card. */
export const isOpenStatus = (status: TicketStatus) => status !== 'closed';

/** List-filter options: every CRM status plus the two KPI groups, so the table can show the KPI figures. */
export const TICKET_STATUS_FILTERS = [...TICKET_STATUSES, 'open', 'inReview'] as const;
export type TicketStatusFilter = (typeof TICKET_STATUS_FILTERS)[number];

/** Matches a ticket against a filter option; the groups (`open`, `inReview`) use the KPI card definitions. */
export const statusMatchesFilter = (status: TicketStatus, filter: TicketStatusFilter) =>
  filter === 'open'
    ? isOpenStatus(status)
    : filter === 'inReview'
      ? REVIEWING_STATUSES.includes(status)
      : status === filter;

export interface StatusFilterTicket {
  type: string;
  status: TicketStatus;
  detailStatus?: string;
}

/**
 * Detail-aware version of `statusMatchesFilter`: inside the شکایت/پیگیری/درخواست/پیشنهاد
 * modules the `open` / `inReview` / `closed` groups follow the detail statuses from the
 * employer session, so the dashboard KPI cards and the ticket table agree row for row.
 * Tickets without a detail status (گفت‌وگو/ارتباط‌دهی) fall back to the CRM status.
 */
export const ticketMatchesStatusFilter = (
  ticket: StatusFilterTicket,
  filter: TicketStatusFilter,
) =>
  filter === 'open'
    ? isOpenDetailStatus(ticket.detailStatus, ticket.status)
    : filter === 'inReview'
      ? isReviewDetailStatus(ticket.detailStatus, ticket.status)
      : filter === 'closed'
        ? isClosedDetailStatus(ticket.detailStatus, ticket.status)
        : ticket.status === filter;

/**
 * Splits the ticket search box into the tokens the repository matches against.
 * Users type the number the way the table renders it («T-۱۴۰۰۰۳»), with Persian
 * digits, with thousands separators, or with the word «تیکت» in front of it, so
 * each token is normalized back to its bare form before comparison. Several words
 * («۱۴۰۰۰۳ علی») become several tokens, all of which must match.
 */
export const ticketSearchTokens = (term: string): string[] => {
  const latin = toLatinDigits(term)
    // ٬ ، and , as thousands separators: «۱۴۰,۰۰۳» is still the number 140003.
    .replace(/[٬,\u066c]/g, '')
    // A «T»/«تیکت» marker in front of a number is decoration, like the «T-» in the table.
    .replace(/(?:^|[\s_\u200c-])(?:t|ticket|تیکت)[\s_\u200c-]*(?=\d)/gi, '');
  return latin
    .split(/\s+/)
    .map((token) => token.replace(/^[_\u200c-]+|[_\u200c-]+$/g, ''))
    .filter(Boolean);
};

/** The searchable text of a ticket, for every token of the search box. */
export const ticketSearchText = (ticket: Ticket): string[] => [
  ticket.id,
  ticket.customer.mobile,
  ticket.customer.nationalId,
];

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
  /** CRM ticket type: گفت‌وگو، ارتباط‌دهی، شکایت، پیگیری، درخواست، پیشنهاد. */
  type: string;
  status: TicketStatus;
  /** وضعیت تفصیلی مخصوص هر ماژول مبنای باز/بسته در تب‌های نوع. */
  detailStatus?: string;
  /** منشأ تبدیل: گفت‌وگو/پیگیریِ منجر به تیکت یا شکایت. */
  convertedFrom?: string;
  /** مقصد تبدیل: مثلاً پیگیریِ تبدیل‌شده به شکایت. */
  convertedTo?: string;
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
