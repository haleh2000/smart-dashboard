import { StatusBadge } from '@/shared/ui';
import type { ClaimStatus, CustomerStatus, PolicyStatus } from '../../domain/customer';
import { claimStatusMeta, customerStatusMeta, policyStatusMeta } from '../customerLabels';

export const CustomerStatusBadge = ({ status }: { status: CustomerStatus }) => (
  <StatusBadge tone={customerStatusMeta[status].tone}>
    {customerStatusMeta[status].label}
  </StatusBadge>
);

export const VipBadge = () => <StatusBadge tone="warning">VIP</StatusBadge>;

export const PolicyStatusBadge = ({ status }: { status: PolicyStatus }) => (
  <StatusBadge tone={policyStatusMeta[status].tone}>{policyStatusMeta[status].label}</StatusBadge>
);

export const ClaimStatusBadge = ({ status }: { status: ClaimStatus }) => (
  <StatusBadge tone={claimStatusMeta[status].tone}>{claimStatusMeta[status].label}</StatusBadge>
);
