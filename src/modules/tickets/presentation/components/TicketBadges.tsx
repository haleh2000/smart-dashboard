import { StatusBadge } from '@/shared/ui';
import type { TicketStatus } from '../../domain/ticket';
import { statusMeta } from '../ticketLabels';

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => (
  <StatusBadge tone={statusMeta[status].tone} pulse={statusMeta[status].live}>
    {statusMeta[status].label}
  </StatusBadge>
);
