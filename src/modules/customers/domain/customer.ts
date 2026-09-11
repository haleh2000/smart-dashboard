import type { Sentiment } from '@/shared/domain/insights';

/**
 * Customer 360 (README → «پروفایل مشتری»): identity from CRM, policies and claims from the
 * Core Insurance Systems, interactions from CRM + call center, sentiment from AI services.
 * The backend aggregates; the frontend only renders. Re-check field names against api.yml.
 */
export const CUSTOMER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_KINDS = ['individual', 'corporate'] as const;
export type CustomerKind = (typeof CUSTOMER_KINDS)[number];

export interface CustomerSummary {
  nationalId: string;
  fullName: string;
  mobile: string;
  status: CustomerStatus;
  kind: CustomerKind;
  /** «مشتری سازمانی» — the organization for corporate customers. */
  corporateName?: string;
  city: string;
  isVip: boolean;
  activePolicyCount: number;
  openTicketCount: number;
  lastInteractionAt?: Date;
  lastSentiment?: Sentiment;
}

export const POLICY_STATUSES = ['active', 'expired', 'cancelled'] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export interface Policy {
  number: string;
  /** «رشته بیمه», e.g. ثالث خودرو. */
  line: string;
  status: PolicyStatus;
  startDate: Date;
  endDate: Date;
  /** Premium in Rials. */
  premium: number;
  /** What is insured: a plate number, a property address, a group plan… */
  insuredItem: string;
}

export const CLAIM_STATUSES = ['filed', 'underReview', 'approved', 'paid', 'rejected'] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface Claim {
  number: string;
  policyNumber: string;
  line: string;
  filedAt: Date;
  status: ClaimStatus;
  /** Claimed amount in Rials. */
  amount: number;
  /** Paid amount in Rials, once paid. */
  paidAmount?: number;
}

export interface CustomerProfile extends CustomerSummary {
  gender: 'male' | 'female';
  birthDate?: Date;
  email?: string;
  address?: string;
  /** «نام نماینده» — the insurance agent who sold the policy. */
  agentName?: string;
  customerSince: Date;
  policies: Policy[];
  claims: Claim[];
}

export const INTERACTION_KINDS = ['call', 'ticket', 'complaint'] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];

/** One entry in the customer's interaction history (calls, tickets, complaints). */
export interface Interaction {
  id: string;
  kind: InteractionKind;
  /** Id of the call or ticket it refers to. */
  refId: string;
  at: Date;
  title: string;
  channel: string;
  open: boolean;
  sentiment?: Sentiment;
}

/** One point of the «سابقه تحلیل احساسات». */
export interface SentimentPoint {
  at: Date;
  sentiment: Sentiment;
  source: 'call' | 'ticket';
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  /** Between -1 (all negative) and 1 (all positive); 0 when there is no data. */
  score: number;
}

/** Summarizes a sentiment history into counts and a single score. */
export const summarizeSentiment = (points: readonly SentimentPoint[]): SentimentSummary => {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  for (const point of points) counts[point.sentiment] += 1;
  const total = points.length;
  return { ...counts, score: total ? (counts.positive - counts.negative) / total : 0 };
};

/** Total claimed vs. paid across the customer's claims. */
export const claimTotals = (claims: readonly Claim[]) =>
  claims.reduce(
    (totals, claim) => ({
      claimed: totals.claimed + claim.amount,
      paid: totals.paid + (claim.paidAmount ?? 0),
    }),
    { claimed: 0, paid: 0 },
  );
