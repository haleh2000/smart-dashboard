import { StatusBadge } from '@/shared/ui';
import type { CallDirection, CallStatus } from '../../domain/call';
import { callDirectionLabels, callStatusMeta } from '../callLabels';

export const CallStatusBadge = ({ status }: { status: CallStatus }) => (
  <StatusBadge tone={callStatusMeta[status].tone} pulse={callStatusMeta[status].live}>
    {callStatusMeta[status].label}
  </StatusBadge>
);

export const CallDirectionBadge = ({ direction }: { direction: CallDirection }) => (
  <StatusBadge tone="neutral">{callDirectionLabels[direction]}</StatusBadge>
);
