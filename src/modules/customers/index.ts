// Public API of the customers module. Other code imports from "@/modules/customers" only.
export type {
  Claim,
  ClaimStatus,
  CustomerKind,
  CustomerProfile,
  CustomerStatus,
  CustomerSummary,
  Interaction,
  InteractionKind,
  Policy,
  PolicyStatus,
  SentimentPoint,
  SentimentSummary,
} from './domain/customer';
export {
  claimTotals,
  CLAIM_STATUSES,
  CUSTOMER_KINDS,
  CUSTOMER_STATUSES,
  INTERACTION_KINDS,
  POLICY_STATUSES,
  summarizeSentiment,
} from './domain/customer';
export type {
  CustomerQuery,
  CustomerRepository,
  CustomerSortField,
} from './domain/CustomerRepository';
export { CUSTOMER_SORT_FIELDS } from './domain/CustomerRepository';
export { MockCustomerRepository } from './infrastructure/MockCustomerRepository';
export { CustomerInsuranceCard } from './presentation/components/CustomerInsuranceCard';
export { customerPaths } from './presentation/customerPaths';
export { CustomerRepositoryProvider } from './presentation/customerServices';
export { CustomerListPage } from './presentation/pages/CustomerListPage';
export { CustomerProfilePage } from './presentation/pages/CustomerProfilePage';
