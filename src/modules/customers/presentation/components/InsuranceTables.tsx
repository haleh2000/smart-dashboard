import { formatAmount, formatDate, formatPersianNumber } from '@/shared/lib/format';
import { DataTable, EmptyState, type DataColumn } from '@/shared/ui';
import type { Claim, Policy } from '../../domain/customer';
import { ClaimStatusBadge, PolicyStatusBadge } from './CustomerBadges';

const rial = (amount: number) => `${formatAmount(amount)} ریال`;

const policyColumns: DataColumn<Policy>[] = [
  {
    header: 'شماره بیمه‌نامه',
    cell: (p) => <bdi className="queue-table__tracking">{formatPersianNumber(p.number)}</bdi>,
  },
  { header: 'رشته', cell: (p) => p.line },
  { header: 'موضوع بیمه', cell: (p) => formatPersianNumber(p.insuredItem) },
  { header: 'شروع', cell: (p) => formatDate(p.startDate) },
  { header: 'پایان', cell: (p) => formatDate(p.endDate) },
  { header: 'حق بیمه', cell: (p) => rial(p.premium) },
  { header: 'وضعیت', cell: (p) => <PolicyStatusBadge status={p.status} /> },
];

const claimColumns: DataColumn<Claim>[] = [
  {
    header: 'شماره خسارت',
    cell: (c) => <bdi className="queue-table__tracking">{formatPersianNumber(c.number)}</bdi>,
  },
  { header: 'بیمه‌نامه', cell: (c) => <bdi>{formatPersianNumber(c.policyNumber)}</bdi> },
  { header: 'رشته', cell: (c) => c.line },
  { header: 'تاریخ ثبت', cell: (c) => formatDate(c.filedAt) },
  { header: 'مبلغ', cell: (c) => rial(c.amount) },
  {
    header: 'پرداختی',
    cell: (c) =>
      c.paidAmount !== undefined ? (
        rial(c.paidAmount)
      ) : (
        <span className="queue-table__muted">—</span>
      ),
  },
  { header: 'وضعیت', cell: (c) => <ClaimStatusBadge status={c.status} /> },
];

/** «سوابق بیمه‌ای» from the Core Insurance Systems. */
export function PolicyTable({ policies }: { policies: Policy[] }) {
  if (policies.length === 0)
    return <EmptyState message="بیمه‌نامه‌ای برای این مشتری ثبت نشده است." />;
  return <DataTable rows={policies} columns={policyColumns} rowKey={(p) => p.number} />;
}

/** «سوابق خسارت», newest first. */
export function ClaimTable({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) return <EmptyState message="خسارتی برای این مشتری ثبت نشده است." />;
  const sorted = [...claims].sort((a, b) => b.filedAt.getTime() - a.filedAt.getTime());
  return <DataTable rows={sorted} columns={claimColumns} rowKey={(c) => c.number} />;
}
