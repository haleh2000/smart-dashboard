import { StatusBadge } from '@/shared/ui';
import type { Priority, Sentiment, TicketStatus } from '../../domain/ticket';
import { priorityMeta, sentimentMeta, statusMeta } from '../ticketLabels';

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => (
  <StatusBadge tone={statusMeta[status].tone} pulse={statusMeta[status].live}>
    {statusMeta[status].label}
  </StatusBadge>
);

export const SentimentBadge = ({ sentiment }: { sentiment: Sentiment }) => (
  <StatusBadge tone={sentimentMeta[sentiment].tone}>{sentimentMeta[sentiment].label}</StatusBadge>
);

export const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <StatusBadge tone={priorityMeta[priority].tone}>{priorityMeta[priority].label}</StatusBadge>
);
