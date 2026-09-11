import { Link } from 'react-router';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import {
  PriorityBadge,
  priorityMeta,
  SentimentBadge,
  sentimentMeta,
  TagList,
  type DataColumn,
} from '@/shared/ui';
import type { Ticket } from '../../domain/ticket';
import type { TicketSortField } from '../../domain/TicketRepository';
import { statusMeta } from '../ticketLabels';
import { ticketPaths } from '../ticketPaths';
import { TicketStatusBadge } from './TicketBadges';

export type TicketColumn = DataColumn<Ticket, TicketSortField>;

/**
 * CRM columns (same order as the current CRM, right → left) followed by SMART enrichment columns.
 * `listSearch` travels to the detail page so its prev/next buttons follow the same list.
 */
export const ticketColumns = (listSearch = ''): TicketColumn[] => [
  {
    header: 'شماره تیکت',
    sortField: 'id',
    interactive: true,
    cell: (t) => (
      <Link to={ticketPaths.detail(t.id)} state={{ listSearch }} className="queue-table__tracking">
        {formatPersianNumber(t.id)}
      </Link>
    ),
    exportValue: (t) => t.id,
  },
  {
    header: 'زمان ایجاد',
    sortField: 'createdAt',
    cell: (t) => formatDateTime(t.createdAt),
    exportValue: (t) => formatDateTime(t.createdAt),
  },
  { header: 'نوع تیکت', sortField: 'type', cell: (t) => t.type, exportValue: (t) => t.type },
  {
    header: 'وضعیت',
    sortField: 'status',
    cell: (t) => <TicketStatusBadge status={t.status} />,
    exportValue: (t) => statusMeta[t.status].label,
  },
  {
    header: 'موبایل',
    sortField: 'mobile',
    cell: (t) => formatPersianNumber(t.customer.mobile),
    exportValue: (t) => t.customer.mobile,
  },
  {
    header: 'کدملی',
    sortField: 'nationalId',
    cell: (t) => formatPersianNumber(t.customer.nationalId),
    exportValue: (t) => t.customer.nationalId,
  },
  {
    header: 'نوع اصلی شکایت',
    sortField: 'subject1',
    cell: (t) => t.subject.level1,
    exportValue: (t) => t.subject.level1,
  },
  {
    header: 'نوع شکایت',
    sortField: 'subject2',
    cell: (t) => t.subject.level2,
    exportValue: (t) => t.subject.level2,
  },
  {
    header: 'مالک پیگیری',
    sortField: 'followUpOwner',
    cell: (t) => t.followUpOwner,
    exportValue: (t) => t.followUpOwner,
  },
  {
    header: 'علت شکایت',
    sortField: 'subject3',
    cell: (t) => t.subject.level3,
    exportValue: (t) => t.subject.level3,
  },
  { header: 'نام شعبه', sortField: 'branch', cell: (t) => t.branch, exportValue: (t) => t.branch },
  {
    header: 'مالک شکایت',
    sortField: 'complaintOwner',
    cell: (t) => t.complaintOwner,
    exportValue: (t) => t.complaintOwner,
  },
  {
    header: 'احساس',
    sortField: 'sentiment',
    cell: (t) => t.enrichment && <SentimentBadge sentiment={t.enrichment.sentiment} />,
    exportValue: (t) => t.enrichment && sentimentMeta[t.enrichment.sentiment].label,
  },
  {
    header: 'اولویت',
    sortField: 'priority',
    cell: (t) => t.enrichment && <PriorityBadge priority={t.enrichment.priority} />,
    exportValue: (t) => t.enrichment && priorityMeta[t.enrichment.priority].label,
  },
  {
    header: 'برچسب‌های AI',
    cell: (t) => t.enrichment && <TagList tags={t.enrichment.aiTags} />,
    exportValue: (t) => t.enrichment?.aiTags.join('، '),
  },
];
