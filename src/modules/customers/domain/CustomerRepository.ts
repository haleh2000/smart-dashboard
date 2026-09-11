import type { Page, PageRequest, Sort } from '@/shared/domain/pagination';
import type {
  CustomerKind,
  CustomerProfile,
  CustomerStatus,
  CustomerSummary,
  Interaction,
  SentimentPoint,
} from './customer';

export const CUSTOMER_SORT_FIELDS = [
  'fullName',
  'lastInteractionAt',
  'openTicketCount',
  'activePolicyCount',
] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export interface CustomerQuery extends PageRequest {
  /** Matched against name, mobile and national id. */
  search?: string;
  status?: CustomerStatus;
  kind?: CustomerKind;
  vipOnly?: boolean;
  sort: Sort<CustomerSortField>;
}

/** Headline figures above the customer list (whole customer base). */
export interface CustomerOverview {
  total: number;
  active: number;
  vip: number;
  corporate: number;
  /** Customers with at least one open ticket. */
  withOpenTickets: number;
  /** Customers whose latest analyzed conversation was negative: the churn-risk list. */
  atRisk: number;
  /** Latest analyzed sentiment per customer. */
  lastSentiment: { positive: number; neutral: number; negative: number };
}

/** Port: implemented by an infrastructure adapter and injected in src/app/container.ts. */
export interface CustomerRepository {
  list(query: CustomerQuery): Promise<Page<CustomerSummary>>;
  getOverview(): Promise<CustomerOverview>;
  /** Resolves to null when no customer has this national id. */
  getProfile(nationalId: string): Promise<CustomerProfile | null>;
  /** Newest first. */
  getInteractions(nationalId: string): Promise<Interaction[]>;
  /** Oldest first, for plotting. */
  getSentimentHistory(nationalId: string): Promise<SentimentPoint[]>;
}
