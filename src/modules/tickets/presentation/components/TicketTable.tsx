import { Link, useLocation, useNavigate } from 'react-router';
import { customerPaths } from '@/modules/customers';
import type { Sort } from '@/shared/domain/pagination';
import { ActionMenu, DataTable } from '@/shared/ui';
import type { Ticket } from '../../domain/ticket';
import type { TicketSortField } from '../../domain/TicketRepository';
import { useToggleStar } from '../hooks/ticketQueries';
import { ticketPaths } from '../ticketPaths';
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
            label: 'پروفایل مشتری (Customer 360)',
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
  sort: Sort<TicketSortField>;
  onSortChange: (sort: Sort<TicketSortField>) => void;
  selected: ReadonlySet<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

export function TicketTable({
  tickets,
  sort,
  onSortChange,
  selected,
  onSelectionChange,
}: TicketTableProps) {
  const navigate = useNavigate();
  const { search } = useLocation();

  const columns: TicketColumn[] = [
    ...ticketColumns(search),
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
      sort={sort}
      onSortChange={onSortChange}
      selection={{ selected, onChange: onSelectionChange }}
      onRowClick={(ticket) =>
        navigate(ticketPaths.detail(ticket.id), { state: { listSearch: search } })
      }
    />
  );
}
