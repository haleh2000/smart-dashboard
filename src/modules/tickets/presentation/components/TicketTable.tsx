import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Sort } from '@/shared/domain/pagination';
import { formatDateTime, formatPersianNumber } from '@/shared/lib/format';
import { StatusBadge } from '@/shared/ui';
import type { Ticket } from '../../domain/ticket';
import type { TicketSortField } from '../../domain/TicketRepository';
import { ticketPaths } from '../ticketPaths';
import { PriorityBadge, SentimentBadge, TicketStatusBadge } from './TicketBadges';
import './TicketTable.css';

interface Column {
  header: string;
  cell: (ticket: Ticket) => ReactNode;
  sortField?: TicketSortField;
}

/** CRM columns (same order as the current CRM, right → left) followed by SMART enrichment columns. */
const columns: Column[] = [
  {
    header: 'شماره تیکت',
    sortField: 'id',
    cell: (t) => (
      <Link
        to={ticketPaths.detail(t.id)}
        className="queue-table__tracking"
        onClick={(e) => e.stopPropagation()}
      >
        {formatPersianNumber(t.id)}
      </Link>
    ),
  },
  { header: 'زمان ایجاد', sortField: 'createdAt', cell: (t) => formatDateTime(t.createdAt) },
  { header: 'نوع تیکت', cell: (t) => t.type },
  { header: 'وضعیت', sortField: 'status', cell: (t) => <TicketStatusBadge status={t.status} /> },
  { header: 'موبایل', cell: (t) => formatPersianNumber(t.customer.mobile) },
  { header: 'کدملی', cell: (t) => formatPersianNumber(t.customer.nationalId) },
  { header: 'نوع اصلی شکایت', cell: (t) => t.subject.level1 },
  { header: 'نوع شکایت', cell: (t) => t.subject.level2 },
  { header: 'مالک پیگیری', cell: (t) => t.followUpOwner },
  { header: 'علت شکایت', cell: (t) => t.subject.level3 },
  { header: 'نام شعبه', cell: (t) => t.branch },
  { header: 'مالک شکایت', cell: (t) => t.complaintOwner },
  {
    header: 'احساس',
    cell: (t) => t.enrichment && <SentimentBadge sentiment={t.enrichment.sentiment} />,
  },
  {
    header: 'اولویت',
    cell: (t) => t.enrichment && <PriorityBadge priority={t.enrichment.priority} />,
  },
  {
    header: 'برچسب‌های AI',
    cell: (t) => (
      <span className="queue-table__tags">
        {t.enrichment?.aiTags.map((tag) => (
          <StatusBadge key={tag} tone="info">
            {tag}
          </StatusBadge>
        ))}
      </span>
    ),
  },
];

interface TicketTableProps {
  tickets: Ticket[];
  sort: Sort<TicketSortField>;
  onSortChange: (sort: Sort<TicketSortField>) => void;
}

export function TicketTable({ tickets, sort, onSortChange }: TicketTableProps) {
  const navigate = useNavigate();
  const open = (id: string) => navigate(ticketPaths.detail(id));

  const toggleSort = (field: TicketSortField) =>
    onSortChange({
      field,
      direction: sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc',
    });

  return (
    <div className="queue-table-wrap">
      <table className="queue-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                aria-sort={
                  column.sortField === sort.field
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.sortField ? (
                  <button
                    type="button"
                    className="queue-table__sort"
                    onClick={() => toggleSort(column.sortField!)}
                  >
                    {column.header}
                    <span className="queue-table__sort-mark" aria-hidden="true">
                      {column.sortField === sort.field
                        ? sort.direction === 'asc'
                          ? '▲'
                          : '▼'
                        : '↕'}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="queue-table__row"
              tabIndex={0}
              onClick={() => open(ticket.id)}
              onKeyDown={(event) => event.key === 'Enter' && open(ticket.id)}
            >
              {columns.map((column) => (
                <td key={column.header} data-label={column.header}>
                  {column.cell(ticket)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
