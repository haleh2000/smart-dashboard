import { useState } from 'react';
import { useNavigate } from 'react-router';
import { pageCount } from '@/shared/domain/pagination';
import { downloadCsv } from '@/shared/lib/csv';
import { formatPersianNumber } from '@/shared/lib/format';
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  SkeletonTable,
  tableExport,
} from '@/shared/ui';
import { callPaths } from '../callPaths';
import { useCallRepository } from '../callServices';
import { callColumns, callExportColumns } from '../components/callColumns';
import { CallFilters } from '../components/CallFilters';
import { useCalls } from '../hooks/callQueries';
import { useCallListParams } from '../hooks/useCallListParams';

export function CallListPage() {
  const navigate = useNavigate();
  const repository = useCallRepository();
  const { state, query, update, reset, isFiltered } = useCallListParams();
  const { data, isPending, isError, refetch } = useCalls(query);
  const [exporting, setExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);

  // «خروجی Excel»: every row matching the current filters, not only the visible page.
  const exportAll = async () => {
    if (!data) return;
    setExporting(true);
    setExportFailed(false);
    try {
      const all = await repository.list({ ...query, page: 1, pageSize: Math.max(data.total, 1) });
      const { headers, rows } = tableExport(callExportColumns, all.items);
      downloadCsv('calls', headers, rows);
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section>
      <PageHeader
        title="تماس‌ها"
        subtitle="تماس‌های مرکز تماس (سیتاک) به همراه فایل صوتی، متن مکالمه و تحلیل هوشمند"
      />

      <CallFilters
        key={state.search}
        state={state}
        onChange={update}
        meta={
          <>
            {data && (
              <span className="filter-bar__count">{formatPersianNumber(data.total)} تماس</span>
            )}
            {isFiltered && (
              <Button variant="ghost" onClick={reset}>
                حذف فیلترها
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={!data || data.total === 0 || exporting}
              onClick={exportAll}
            >
              {exporting ? 'در حال آماده‌سازی…' : 'خروجی Excel'}
            </Button>
          </>
        }
      />

      {exportFailed && (
        <ErrorState message="تهیه خروجی Excel با خطا مواجه شد." onRetry={exportAll} />
      )}

      {isPending ? (
        <SkeletonTable rows={8} />
      ) : isError ? (
        <ErrorState message="دریافت تماس‌ها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState message="تماسی با این فیلترها پیدا نشد." />
      ) : (
        <>
          <DataTable
            rows={data.items}
            columns={callColumns}
            rowKey={(call) => call.id}
            sort={state.sort}
            onSortChange={(sort) => update({ sort })}
            onRowClick={(call) => navigate(callPaths.detail(call.id))}
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
