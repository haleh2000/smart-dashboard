export interface BreakdownItem {
  value: string;
  count: number;
  /** Share of the filtered total, between 0 and 1. */
  share: number;
}

/** Headline figures (README → «KPIهای کلیدی»). Ticket figures come from the ticket table. */
export interface Kpis {
  total: number;
  open: number;
  /** In progress or under review. */
  inReview: number;
  closed: number;
  /** closed / total, between 0 and 1. */
  resolutionRate: number;
  /** Open tickets past their SLA. */
  overdue: number;
  /** «FCR»: answered calls solved in the first call, between 0 and 1. */
  fcrRate: number;
  /** Share of callers who called more than once, between 0 and 1. */
  repeatCallRate: number;
  /** Mean time to close a ticket, in seconds (0 when none closed). */
  avgResolutionSec: number;
}

/** Row × column counts for the 100% stacked bars («%GT Count of Major by Major and ChanelType»). */
export interface CrossBreakdown {
  /** Column values, most frequent first — the legend order. */
  columns: string[];
  rows: { value: string; total: number; cells: { value: string; count: number }[] }[];
}

export type Importance = 1 | 2;

/** One Subject3 row of the Power BI subject table. */
export interface SubjectRow {
  subject1: string;
  subject2: string;
  subject3: string;
  count: number;
  share: number;
  importance: Importance;
}

/** «درصد سهم هر Subject3 به تفکیک نوع بیمه». */
export interface SubjectLineTable {
  lines: string[];
  rows: {
    subject1: string;
    subject2: string;
    subject3: string;
    share: number;
    /** Share of this subject's records per line; each row sums to 1. */
    lineShares: Record<string, number>;
  }[];
  /** Share of all records per line. */
  totals: Record<string, number>;
}

/** Weekly counts per series value («روند کانال‌های ارتباطی»). */
export interface Trend {
  series: string[];
  buckets: { start: Date; counts: Record<string, number> }[];
}

/** «عملکرد اپراتورها». */
export interface OperatorStats {
  operator: string;
  ticketCount: number;
  closedTicketCount: number;
  callCount: number;
  /** Mean time from ticket creation to first response, in seconds. */
  avgFirstResponseSec: number;
  /** Mean talk time per answered call, in seconds. */
  avgHandlingSec: number;
  fcrRate: number;
  /** Share of analyzed conversations with a positive sentiment. */
  positiveShare: number;
}

/** «تماس‌ها»: incoming, current and answered calls. */
export interface CallStats {
  incoming: number;
  ringing: number;
  ongoing: number;
  answered: number;
  missed: number;
  answerRate: number;
  avgWaitSec: number;
  avgTalkSec: number;
}

/** Calls per Persian weekday (0 = Saturday) × hour of day. */
export interface Heatmap {
  /** counts[weekday][hour] */
  counts: number[][];
  max: number;
}

/** «نرخ تکرار تماس»: calls per customer until the issue is solved. */
export interface RepeatCallStats {
  repeatRate: number;
  avgCallsPerCustomer: number;
  /** Mean time from a customer's first call to the resolving call, in seconds. */
  avgTimeToResolveSec: number;
  distribution: { bucket: '1' | '2' | '3' | '4+'; customers: number }[];
}
