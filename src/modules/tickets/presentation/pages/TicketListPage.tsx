import { pageCount } from '@/shared/domain/pagination';
import { EmptyState, ErrorState, PageHeader, Pagination, SkeletonTable } from '@/shared/ui';
import { TicketFilters } from '../components/TicketFilters';
import { TicketTable } from '../components/TicketTable';
import { useTickets } from '../hooks/ticketQueries';
import { useTicketListParams } from '../hooks/useTicketListParams';

export function TicketListPage() {
  const { query, update } = useTicketListParams();
  const { data, isPending, isError, refetch } = useTickets(query);

  return (
    <section>
      <PageHeader title="تیکت‌ها" subtitle="تیکت‌های دریافتی از CRM به همراه تحلیل هوشمند" />

      <TicketFilters
        key={query.search}
        search={query.search}
        status={query.status}
        resultCount={data?.total}
        onSearch={(search) => update({ search })}
        onStatusChange={(status) => update({ status })}
        onReset={() => update({ search: undefined, status: undefined })}
      />

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
          />
          <Pagination
            page={data.page}
            pageCount={pageCount(data)}
            pageSize={data.pageSize}
            total={data.total}
            onChange={(page) => update({ page })}
          />
        </>
      )}
    </section>
  );
}
