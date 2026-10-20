// Public API of the tickets module. Other code imports from "@/modules/tickets" only.
export type {
  Customer,
  Gender,
  Priority,
  Sentiment,
  StatusFilterTicket,
  SubjectPath,
  Ticket,
  TicketDocument,
  TicketEnrichment,
  TicketEvent,
  TicketNote,
  TicketStatus,
  TicketStatusFilter,
  TicketType,
  TicketUpdate,
} from './domain/ticket';
export {
  closedDetailStatusesForType,
  COMPLAINT_CLOSED_STATUSES,
  COMPLAINT_OPEN_STATUSES,
  detailStatusesForType,
  FOLLOWUP_CLOSED_STATUSES,
  FOLLOWUP_OPEN_STATUSES,
  hasSla,
  hasTicketSubject,
  isClosedDetailStatus,
  isOpenDetailStatus,
  isOpenStatus,
  isOverdue,
  isReviewDetailStatus,
  openDetailStatusesForType,
  REQUEST_CLOSED_STATUSES,
  REQUEST_OPEN_STATUSES,
  reviewDetailStatusesForType,
  REVIEWING_STATUSES,
  statusMatchesFilter,
  SUGGESTION_CLOSED_STATUSES,
  SUGGESTION_OPEN_STATUSES,
  ticketMatchesSearch,
  ticketMatchesStatusFilter,
  ticketSearchFields,
  TICKET_STATUSES,
  TICKET_STATUS_FILTERS,
  TICKET_TYPES,
} from './domain/ticket';
export { publishTicketUpdate, subscribeToTicketFeed } from './domain/ticketFeed';
export type {
  AdjacentTickets,
  SubjectFilterPath,
  TicketFilter,
  TicketFilterOptions,
  TicketQuery,
  TicketRepository,
  TicketSortField,
} from './domain/TicketRepository';
export { TICKET_SORT_FIELDS } from './domain/TicketRepository';
export { MockTicketRepository } from './infrastructure/MockTicketRepository';
export { TicketDetailPage } from './presentation/pages/TicketDetailPage';
export { TicketListPage } from './presentation/pages/TicketListPage';
export { statusMeta as ticketStatusMeta } from './presentation/ticketLabels';
export { ticketPaths } from './presentation/ticketPaths';
export { TicketRepositoryProvider } from './presentation/ticketServices';
