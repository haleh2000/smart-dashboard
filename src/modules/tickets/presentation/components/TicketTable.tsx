import { Link, useLocation, useNavigate } from 'react-router';
import { customerPaths } from '@/modules/customers';
import { ActionMenu, DataTable } from '@/shared/ui';
import type { Ticket } from '../../domain/ticket';
import { useToggleStar } from '../hooks/ticketQueries';
import type { TicketListState } from '../hooks/ticketListParams';
import type { TicketListChanges } from '../hooks/useTicketListParams';
import { ticketPaths } from '../ticketPaths';
import { useTicketColumnFilters } from './TicketColumnFilters';
import { ticketColumns, type TicketColumn } from './ticketColumns';

function StarButton({ ticket }: { ticket: Ticket }) {
  const toggleStar = useToggleStar();
  const label = ticket.starred ? 'حذف ستاره' : 'ستاره‌دار کردن';
  return (
    <button
      type="button"
      className={`icon-button${ticket.starred ? ' icon-button--on' : ''}`}
      aria-label={label}
      aria-pressed={ticket.starred}
      title={label}
      onClick={() => toggleStar.mutate({ id: ticket.id, starred: !ticket.starred })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"
          fill={ticket.starred ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function RowActions({ ticket, listSearch }: { ticket: Ticket; listSearch: string }) {
  return (
    <span className="queue-table__actions">
      <StarButton ticket={ticket} />
      <Link
        className="icon-button"
        to={ticketPaths.detail(ticket.id)}
        state={{ listSearch }}
        aria-label="مشاهده"
        title="مشاهده"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </Link>
      <ActionMenu
        label="بیشتر"
        items={[
          {
            label: 'کپی شماره تیکت',
            onSelect: () => void navigator.clipboard?.writeText(ticket.id),
          },
          {
            label: 'پروفایل مشتری ',
            to: customerPaths.profile(ticket.customer.nationalId),
          },
          {
            label: 'تیکت‌های دیگر این مشتری',
            to: ticketPaths.ofCustomer(ticket.customer.nationalId),
          },
        ]}
      />
    </span>
  );
}

interface TicketTableProps {
  tickets: Ticket[];
  selected: ReadonlySet<string>;
  onSelectionChange: (selected: Set<string>) => void;
  state: TicketListState;
  onFilterChange: (changes: TicketListChanges) => void;
}

/** No column header is clickable: sorting lives in the URL state, the headers only filter. */
export function TicketTable({
  tickets,
  selected,
  onSelectionChange,
  state,
  onFilterChange,
}: TicketTableProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const columnFilters = useTicketColumnFilters({ state, onChange: onFilterChange });

  // شکایت موضوع تماس ندارد؛ در نمای فیلترشده شکایت ستون‌ها و فیلترهای موضوع حذف می‌شوند.
  const isComplaintView = state.type === 'شکایت';
  const baseColumns = ticketColumns(search).filter(
    (column) => !isComplaintView || !['subject1', 'subject2', 'subject3'].includes(column.id ?? ''),
  );
  const filteredColumnFilters = isComplaintView
    ? Object.fromEntries(
        Object.entries(columnFilters).filter(
          ([key]) => !['subject1', 'subject2', 'subject3'].includes(key),
        ),
      )
    : columnFilters;

  const columns: TicketColumn[] = [
    ...baseColumns,
    {
      header: 'عملیات',
      interactive: true,
      cell: (ticket) => <RowActions ticket={ticket} listSearch={search} />,
    },
  ];

  return (
    <DataTable
      rows={tickets}
      columns={columns}
      rowKey={(ticket) => ticket.id}
      selection={{ selected, onChange: onSelectionChange }}
      columnFilters={filteredColumnFilters}
      onRowClick={(ticket) =>
        navigate(ticketPaths.detail(ticket.id), { state: { listSearch: search } })
      }
    />
  );
}
