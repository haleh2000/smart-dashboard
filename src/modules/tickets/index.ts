// Public API of the tickets module. Other code imports from "@/modules/tickets" only.
export type {
  Customer,
  Priority,
  Sentiment,
  SubjectPath,
  Ticket,
  TicketEnrichment,
  TicketStatus,
} from './domain/ticket';
export { TICKET_STATUSES } from './domain/ticket';
export type { TicketQuery, TicketRepository, TicketSortField } from './domain/TicketRepository';
export { MockTicketRepository } from './infrastructure/MockTicketRepository';
export { TicketDetailPage } from './presentation/pages/TicketDetailPage';
export { TicketListPage } from './presentation/pages/TicketListPage';
export { ticketPaths } from './presentation/ticketPaths';
export { TicketRepositoryProvider } from './presentation/ticketServices';
