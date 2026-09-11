import { useState } from 'react';
import { pageCount } from '@/shared/domain/pagination';
import { downloadCsv } from '@/shared/lib/csv';
import { formatPersianNumber } from '@/shared/lib/format';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SkeletonTable,
  tableExport,
} from '@/shared/ui';
import type { Ticket } from '../../domain/ticket';
import { TicketFilters } from '../components/TicketFilters';
import { ticketColumns } from '../components/ticketColumns';
import { TicketTable } from '../components/TicketTable';
import { PAGE_SIZES } from '../hooks/ticketListParams';
import { useTicketExport, useTickets } from '../hooks/ticketQueries';
import { useTicketListParams } from '../hooks/useTicketListParams';
import './TicketListPage.css';

const exportTickets = (tickets: Ticket[]) => {
  const { headers, rows } = tableExport(ticketColumns(), tickets);
  downloadCsv(`smart-tickets-${new Date().toISOString().slice(0, 10)}`, headers, rows);
};

export function TicketListPage() {
  const { state, query, update, search } = useTicketListParams();
  const { data, isPending, isError, refetch } = useTickets(query);
  const exportAll = useTicketExport();

  // Selection belongs to the current view: a new filter, sort or page starts empty.
  const [selection, setSelection] = useState({ view: search, ids: new Set<string>() });
  const selected = selection.view === search ? selection.ids : new Set<string>();
  const selectedTickets = data?.items.filter((ticket) => selected.has(ticket.id)) ?? [];

  const exportButton =
    selectedTickets.length > 0 ? (
      <Button variant="ghost" onClick={() => exportTickets(selectedTickets)}>
        خروجی Excel ({formatPersianNumber(selectedTickets.length)} ردیف انتخاب‌شده)
      </Button>
    ) : (
      <Button
        variant="ghost"
        disabled={!data?.total || exportAll.isPending}
        onClick={() => exportAll.mutate(query, { onSuccess: exportTickets })}
      >
        {exportAll.isPending ? 'در حال آماده‌سازی…' : 'خروجی Excel'}
      </Button>
    );

  return (
    <section>
      <PageHeader title="تیکت‌ها" subtitle="تیکت‌های دریافتی از CRM به همراه تحلیل هوشمند" />

      <TicketFilters
        key={state.search}
        state={state}
        onChange={update}
        onReset={() => update({ ...emptyFilters })}
        meta={
          <>
            {data && (
              <span className="filter-bar__count">{formatPersianNumber(data.total)} تیکت</span>
            )}
            {exportButton}
          </>
        }
      />

      {exportAll.isError && (
        <ErrorState
          message="تهیه خروجی Excel با خطا مواجه شد."
          onRetry={() => exportAll.mutate(query, { onSuccess: exportTickets })}
        />
      )}

      {isPending ? (
        <SkeletonTable rows={8} />
      ) : isError ? (
        <ErrorState message="دریافت تیکت‌ها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState message="تیکتی با این فیلترها پیدا نشد." />
      ) : (
        <>
          <TicketTable
            tickets={data.items}
            sort={query.sort}
            onSortChange={(sort) => update({ sort })}
            selected={selected}
            onSelectionChange={(ids) => setSelection({ view: search, ids })}
          />
          <div className="ticket-list__footer">
            <label className="ticket-list__page-size">
              ردیف در هر صفحه
              <select
                className="form-select"
                value={state.pageSize}
                onChange={(event) => update({ pageSize: Number(event.target.value) })}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {formatPersianNumber(size)}
                  </option>
                ))}
              </select>
            </label>
            <Pagination
              page={data.page}
              pageCount={pageCount(data)}
              pageSize={data.pageSize}
              total={data.total}
              onChange={(page) => update({ page })}
            />
          </div>
        </>
      )}
    </section>
  );
}

const emptyFilters = {
  search: undefined,
  status: undefined,
  priority: undefined,
  sentiment: undefined,
  type: undefined,
  subject1: undefined,
  branch: undefined,
  operator: undefined,
  starredOnly: undefined,
  period: 'all',
} as const;
