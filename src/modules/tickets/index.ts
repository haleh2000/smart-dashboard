// Public API of the tickets module. Other code imports from "@/modules/tickets" only.
export type {
  Customer,
  Gender,
  Priority,
  Sentiment,
  SubjectPath,
  Ticket,
  TicketDocument,
  TicketEnrichment,
  TicketEvent,
  TicketNote,
  TicketStatus,
  TicketUpdate,
} from './domain/ticket';
export { isOverdue, TICKET_STATUSES } from './domain/ticket';
export type {
  AdjacentTickets,
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
