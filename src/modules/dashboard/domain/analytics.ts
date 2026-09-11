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

export type ResolutionStep = '1' | '2' | '3' | '4+' | 'open';

/**
 * «نرخ تکرار تماس»: calls per customer until the issue is solved. An issue is one caller's
 * calls about one main subject; it is solved by the first call marked as resolved.
 */
export interface RepeatCallStats {
  repeatRate: number;
  avgCallsPerCustomer: number;
  /** Mean time from a customer's first call to the resolving call, in seconds. */
  avgTimeToResolveSec: number;
  distribution: { bucket: '1' | '2' | '3' | '4+'; customers: number }[];
  /** Issues by the call that solved them (`open` = not solved yet), in step order. */
  resolution: { step: ResolutionStep; issues: number }[];
  /** Mean calls an issue needed until it was solved (solved issues only). */
  avgCallsToResolve: number;
  /** Main subjects that make customers call again, highest repeat rate first. */
  byReason: { subject: string; issues: number; repeatRate: number; avgCalls: number }[];
}

/** Positive / neutral / negative counts of one side of the conversations. */
export interface SentimentSplit {
  positive: number;
  neutral: number;
  negative: number;
  /** Between -1 (all negative) and 1 (all positive). */
  score: number;
}

/** «تحلیل احساسات دو طرف»: customer and operator sentiment of the analyzed calls. */
export interface SentimentOverview {
  analyzed: number;
  customer: SentimentSplit;
  agent: SentimentSplit;
  /** matrix[customerSentiment][agentSentiment] = calls. */
  matrix: Record<'positive' | 'neutral' | 'negative', Record<'positive' | 'neutral' | 'negative', number>>;
  /** How the customer's mood moved from the start to the end of the call. */
  journey: { improved: number; unchanged: number; worsened: number };
  /** Weekly scores of both sides, oldest first. */
  trend: { start: Date; count: number; customerScore: number; agentScore: number }[];
  /** Per main subject, most calls first. */
  bySubject: { subject: string; count: number; customerScore: number; agentScore: number }[];
  /** Per operator, busiest first. */
  byOperator: {
    operator: string;
    count: number;
    customerScore: number;
    agentScore: number;
    /** Share of the operator's calls where the customer ended happier than they started. */
    improvedShare: number;
  }[];
}

/** «تشخیص موضوع تماس توسط اپراتور و AI». */
export interface SubjectDetectionStats {
  /** Answered calls the AI analyzed. */
  analyzed: number;
  match: number;
  partial: number;
  mismatch: number;
  /** Detected by AI, not categorized by the operator yet. */
  pending: number;
  avgConfidence: number;
  /** Per main subject (as detected by the AI), most calls first. */
  bySubject: { subject: string; count: number; agreement: number; avgConfidence: number }[];
  /** Operator main subject → AI main subject, for the disagreements; most frequent first. */
  confusions: { agent: string; ai: string; count: number }[];
  confidenceBands: { band: 'low' | 'medium' | 'high' | 'veryHigh'; count: number }[];
}

/** One node of the multi-level «تحلیل دلایل اصلی تماس» tree (Subject1 → 2 → 3). */
export interface ReasonNode {
  label: string;
  count: number;
  /** Share of all calls in scope, between 0 and 1. */
  share: number;
  /** Share of analyzed calls under this node with a negative customer, between 0 and 1. */
  negativeShare: number;
  /** Share of answered calls under this node solved in that call, between 0 and 1. */
  fcrRate: number;
  /** Share of calls under this node from customers who called about it more than once. */
  repeatShare: number;
  children: ReasonNode[];
}

export interface CallReasons {
  total: number;
  /** Calls whose subject came from the AI because the operator had not categorized them. */
  aiOnly: number;
  nodes: ReasonNode[];
}
