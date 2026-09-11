import { useMutation } from '@tanstack/react-query';
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
import type { CustomerQuery } from '../../domain/CustomerRepository';
import { customerColumns } from '../components/customerColumns';
import { CustomerFilters } from '../components/CustomerFilters';
import { CustomerOverviewStrip } from '../components/CustomerOverviewStrip';
import { CustomerTable } from '../components/CustomerTable';
import { useCustomerRepository } from '../customerServices';
import { useCustomers } from '../hooks/customerQueries';
import { useCustomerListParams } from '../hooks/useCustomerListParams';

/** Exports every row matching the current filters, not just the visible page. */
function useCustomerExport() {
  const repository = useCustomerRepository();
  return useMutation({
    mutationFn: async (query: CustomerQuery) => {
      const first = await repository.list({ ...query, page: 1, pageSize: 1 });
      const all = await repository.list({ ...query, page: 1, pageSize: Math.max(1, first.total) });
      const { headers, rows } = tableExport(customerColumns, all.items);
      downloadCsv('customers', headers, rows);
    },
  });
}

export function CustomerListPage() {
  const { query, update } = useCustomerListParams();
  const { data, isPending, isError, refetch } = useCustomers(query);
  const exportCustomers = useCustomerExport();
  const isFiltered = Boolean(query.search || query.status || query.kind || query.vipOnly);

  return (
    <section>
      <PageHeader
        title="مشتریان"
        subtitle="Customer 360: اطلاعات هویتی، بیمه‌ای و سوابق تعامل هر مشتری"
      />

      <CustomerOverviewStrip />

      <CustomerFilters
        key={query.search}
        search={query.search}
        status={query.status}
        kind={query.kind}
        vipOnly={query.vipOnly}
        onSearch={(search) => update({ search })}
        onStatusChange={(status) => update({ status })}
        onKindChange={(kind) => update({ kind })}
        onVipOnlyChange={(vipOnly) => update({ vipOnly: vipOnly || undefined })}
        meta={
          <>
            {data && (
              <span className="filter-bar__count">{formatPersianNumber(data.total)} مشتری</span>
            )}
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={() =>
                  update({
                    search: undefined,
                    status: undefined,
                    kind: undefined,
                    vipOnly: undefined,
                  })
                }
              >
                حذف فیلترها
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={!data?.total || exportCustomers.isPending}
              onClick={() => exportCustomers.mutate(query)}
            >
              {exportCustomers.isPending ? 'در حال آماده‌سازی…' : 'خروجی Excel'}
            </Button>
          </>
        }
      />

      {isPending ? (
        <SkeletonTable rows={8} />
      ) : isError ? (
        <ErrorState message="دریافت مشتریان با خطا مواجه شد." onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState message="مشتری‌ای با این فیلترها پیدا نشد." />
      ) : (
        <>
          <CustomerTable
            customers={data.items}
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
