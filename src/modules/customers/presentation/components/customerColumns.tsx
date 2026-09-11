import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { SentimentBadge, sentimentMeta, type DataColumn } from '@/shared/ui';
import type { CustomerSummary } from '../../domain/customer';
import type { CustomerSortField } from '../../domain/CustomerRepository';
import { customerKindLabels, customerStatusMeta } from '../customerLabels';
import { CustomerStatusBadge, VipBadge } from './CustomerBadges';

/** Customer list columns; `exportValue` feeds the Excel export. */
export const customerColumns: DataColumn<CustomerSummary, CustomerSortField>[] = [
  {
    header: 'نام مشتری',
    sortField: 'fullName',
    cell: (c) => (
      <span className="customer-table__name">
        {c.fullName}
        {c.isVip && <VipBadge />}
      </span>
    ),
    exportValue: (c) => (c.isVip ? `${c.fullName} (VIP)` : c.fullName),
  },
  {
    header: 'کدملی',
    cell: (c) => formatPersianNumber(c.nationalId),
    exportValue: (c) => c.nationalId,
  },
  {
    header: 'موبایل',
    cell: (c) => formatPersianNumber(c.mobile),
    exportValue: (c) => c.mobile,
  },
  {
    header: 'نوع',
    cell: (c) => (
      <span>
        {customerKindLabels[c.kind]}
        {c.corporateName && <span className="queue-table__muted"> — {c.corporateName}</span>}
      </span>
    ),
    exportValue: (c) =>
      c.corporateName
        ? `${customerKindLabels[c.kind]} — ${c.corporateName}`
        : customerKindLabels[c.kind],
  },
  { header: 'شهر', cell: (c) => c.city, exportValue: (c) => c.city },
  {
    header: 'وضعیت',
    cell: (c) => <CustomerStatusBadge status={c.status} />,
    exportValue: (c) => customerStatusMeta[c.status].label,
  },
  {
    header: 'بیمه‌نامه‌های فعال',
    sortField: 'activePolicyCount',
    cell: (c) => formatPersianNumber(c.activePolicyCount),
    exportValue: (c) => c.activePolicyCount,
  },
  {
    header: 'تیکت‌های باز',
    sortField: 'openTicketCount',
    cell: (c) => formatPersianNumber(c.openTicketCount),
    exportValue: (c) => c.openTicketCount,
  },
  {
    header: 'آخرین تعامل',
    sortField: 'lastInteractionAt',
    cell: (c) =>
      c.lastInteractionAt ? (
        formatDateTime(c.lastInteractionAt)
      ) : (
        <span className="queue-table__muted">—</span>
      ),
    exportValue: (c) => (c.lastInteractionAt ? formatDateTime(c.lastInteractionAt) : ''),
  },
  {
    header: 'آخرین احساس',
    cell: (c) => c.lastSentiment && <SentimentBadge sentiment={c.lastSentiment} />,
    exportValue: (c) => (c.lastSentiment ? sentimentMeta[c.lastSentiment].label : ''),
  },
];
